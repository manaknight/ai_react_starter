That means:

UI talks only to hooks

Hooks talk only to services

Services use centralized endpoints + automatic mock/real switching

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
│  │  ├─ clientFactory.ts  # Factory that switches between mock/real clients
│  │  ├─ endpoints.ts      # ALL API endpoints centralized
│  │  └─ mockClient.ts     # Mock API client implementation
│  ├─ mock/
│  │  ├─ handlerAdapter.ts # Routes ALL mock requests to handlers
│  │  └─ mockDb.ts         # Centralized mock database
│  └─ index.ts             # Service exports (auto mock/real)
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

When backend arrives → only flip USE_MOCK env flag.

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

3️⃣ Unified API Implementation (Works for both mock & real)
// modules/users/services/user.api.ts
import { clientFactory } from "@/services/api/clientFactory"
import { endpoints } from "@/services/api/endpoints"
import { UserService } from "./UserService"

const client = clientFactory(); // Auto-switches mock/real based on VITE_USE_MOCK

export const userApiService: UserService = {
  async list() {
    const res = await client.get(endpoints.users.list)
    return res.data
  },

  async get(id) {
    const res = await client.get(endpoints.users.get(id))
    return res
  },

  async create(input) {
    const res = await client.post(endpoints.users.create, input)
    return res
  },
}

5 Centralized Endpoints (🔥 Single source of truth)
// services/api/endpoints.ts
export const endpoints = {
  users: {
    list: "/api/users",
    get: (id: string) => `/api/users/${id}`,
    create: "/api/users",
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
  },
  // ... all other endpoints
}

6 Centralized Mock Handling (🔥 All mocks in one place)
// services/mock/handlerAdapter.ts
export const handlerAdapters = {
  "/api/users": async (url, method, data) => {
    if (method === 'GET') return mockDb.users;
    if (method === 'POST') {
      const newUser = { id: Date.now(), ...data };
      mockDb.users.push(newUser);
      return newUser;
    }
  },
  // ... all other mock handlers
}

6 Automatic Mock/Real Switching
// services/api/clientFactory.ts
export const clientFactory = () => {
  if (env.USE_MOCK) {
    return mockApiClient; // Centralized mock client
  }
  return realApiClient;   // Real API client
}

// services/index.ts
export { userApiService as userService } from "@/modules/users/services/user.api"


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
✅ No refactor ever (services auto-switch mock/real)

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

Easy to migrate to:

React Query

TanStack Router

SSR

Micro-frontends

Golden Rules

Components → Hooks → Services → clientFactory() → Centralized Client

One interface per domain

Services use clientFactory() which auto-switches mock/real

Services use centralized endpoints.ts

ClientFactory switches via VITE_USE_MOCK env flag

All mock logic centralized in handlerAdapter.ts

UI never imports API or mock files