That means:

UI talks only to hooks

Hooks talk only to services

Services are swappable (mock ↔ real)

Context owns global state & orchestration

No component imports fetch, axios, or mock JSON directly

```
src/
├─ app/
│  ├─ App.tsx
│  ├─ routes.tsx
│  └─ providers.tsx
│
├─ modules/                # Feature-based (VERY important)
│  ├─ <feature module>/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ services/
│  │  ├─ types.ts
│  │  └─ index.ts
│  ├─ packages/ # packages we install, put .gitkeep for now
│  └─ analytics/ # analytic modules packages we need, put .gitkeep for now
│
├─ shared/
│  ├─ components/          # Buttons, tables, modals
│  ├─ hooks/
│  ├─ utils/
│  └─ constants/
│
├─ context/
│  ├─ AuthContext.tsx
│  ├─ UIContext.tsx
│  └─ DataContext.tsx
│
├─ services/
│  ├─ api/
│  │  ├─ client.ts         # axios/fetch wrapper
│  │  ├─ endpoints.ts      # url endpoints
│  │  └─ adapters.ts       # transform api request
│  ├─ mock/
│  │  └─ index.ts
│  └─ index.ts
│
├─ types/
│  └─ api.ts
│
└─ env.ts

```

❌ Bad (tight coupling)
useEffect(() => {
  fetch("/api/users").then(...)
}, [])

✅ Good (integration-safe)
const { users, isLoading } = useUsers()

When backend arrives → only useUsers + service changes.

1️⃣ Define Stable Domain Types (Never Change These)
// modules/users/types.ts
export type User = {
  id: string
  name: string
  email: string
  role: "admin" | "member"
}


🔒 Rule: UI components ONLY consume these types

2️⃣ Create a Service Interface (Contract)
// modules/users/services/UserService.ts
import { User } from "../types"

export interface UserService {
  list(): Promise<User[]>
  get(id: string): Promise<User>
  create(input: Partial<User>): Promise<User>
}


This is the single integration contract.

3️⃣ Mock Implementation (Used Now)
// modules/users/services/user.mock.ts
import { UserService } from "./UserService"

export const userMockService: UserService = {
  async list() {
    return [
      { id: "1", name: "Alice", email: "a@test.com", role: "admin" },
      { id: "2", name: "Bob", email: "b@test.com", role: "member" },
    ]
  },

  async get(id) {
    return { id, name: "Alice", email: "a@test.com", role: "admin" }
  },

  async create(input) {
    return { id: crypto.randomUUID(), ...input } as any
  },
}

4️⃣ Real API Implementation (Later, Same Shape)
// modules/users/services/user.api.ts
import { apiClient } from "@/services/api/client"
import { UserService } from "./UserService"

export const userApiService: UserService = {
  async list() {
    const res = await apiClient.get("/users")
    return res.data
  },

  async get(id) {
    return apiClient.get(`/users/${id}`).then(r => r.data)
  },

  async create(input) {
    return apiClient.post("/users", input).then(r => r.data)
  },
}

5️⃣ Runtime Service Switch (🔥 Critical)
// services/index.ts
import { userMockService } from "@/modules/users/services/user.mock"
import { userApiService } from "@/modules/users/services/user.api"

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true"

export const userService = USE_MOCK
  ? userMockService
  : userApiService


🧠 Integration = flipping ONE env flag

6️⃣ Hook = UI’s Only Entry Point
// modules/users/hooks/useUsers.ts
import { useEffect, useState } from "react"
import { userService } from "@/services"

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userService.list().then(setUsers).finally(() => setLoading(false))
  }, [])

  return { users, loading }
}

7️⃣ Component = Pure UI (Safe Forever)
// modules/users/components/UserTable.tsx
export function UserTable() {
  const { users, loading } = useUsers()

  if (loading) return <Spinner />

  return (
    <table>
      {users.map(u => (
        <tr key={u.id}>
          <td>{u.name}</td>
          <td>{u.role}</td>
        </tr>
      ))}
    </table>
  )
}


✅ No API knowledge
✅ No mock knowledge
✅ No refactor later

🧠 Context API: What Goes There vs What Doesn’t
✅ Context is for:

Auth session

Feature flags

Permissions

Shared UI state

Cached domain data (optional)

❌ Context is NOT for:

API calls directly

Page-specific state

Mock logic

Example: DataContext (Optional Optimization)
<DataProvider services={{ userService, packageService }}>


This allows AI to later:

inject real services

add caching

add react-query without breaking UI

🧠 AI Prompt You Should Use (Important)

When asking AI to build screens:

“Use existing domain hooks only.
Do not call fetch/axios directly.
Assume all data comes from hooks.
Keep components presentational.”

This prevents 90% of integration pain.


Why This Scales Ridiculously Well

Backend swap = 1 file

API shape change = adapter only

Mock updates don’t touch UI

Golden Rules

Components → Hooks → Services → API

One interface per domain

Mock & real share the same contract

Env flag controls backend

UI never imports API or mock files