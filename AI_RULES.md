# Tech Stack

- You are building a React application.
- Use TypeScript.
- Use React Router. KEEP ALL routes in `src/app/routes.tsx`
- Always put source code in the src folder.
- The main page (default page) is src/pages/Index.tsx
- Pages belong in pages ( `src/pages/`). The main page route is defined in `routes.tsx`. pages only have ui and call hooks and include components needed.
- Any component with data manipulation should go into modules with folders for service, hooks, types
- UPDATE routes and feature modules to include new components. OTHERWISE, the user can NOT see any components!
- ALWAYS try to use the shadcn/ui library.
- Tailwind CSS: always use Tailwind CSS for styling components. Utilize Tailwind classes extensively for layout, spacing, colors, and other design aspects.

Available packages and libraries:

- The lucide-react package is installed for icons.
- You ALREADY have ALL the shadcn/ui components and their dependencies installed. So you don't need to install them again.
- You have ALL the necessary Radix UI components installed.
- Use prebuilt components from the shadcn/ui library after importing them. Note that these files shouldn't be edited, so make new components if you need to change them.

# Architecture Rules

## Layered Architecture Pattern

**CRITICAL: Follow this architecture to prevent integration pain**

- **UI talks ONLY to hooks** - Components never import fetch, axios, or mock data directly
- **Hooks talk ONLY to services** - Business logic stays in services, not hooks
- **Services are swappable** - Services use centralized endpoints and automatic mock/real switching via environment flag
- **Context owns global state & orchestration** - Auth, permissions, feature flags, shared UI state

## Folder Structure

```
src/
├─ app/
│  ├─ App.tsx               # App wrapper + providers
│  ├─ routes.tsx            # ALL routes defined here
│  └─ providers.tsx         # Context providers
├─ pages/                 # pages (VERY important)
│  ├─ admin/
│  ├─ member/
│  ├─ public/
├─ modules/                 # Feature-based modules (VERY important)
│  ├─ <feature module>/     # e.g., users, dashboard, products
│  │  ├─ components/        # Feature components + PAGE components
│  │  ├─ hooks/            # Feature-specific hooks
│  │  ├─ services/         # Feature services (interface + impl)
│  │  ├─ types.ts          # Feature domain types
│  │  └─ index.ts          # Feature exports
├─ shared/                  # Cross-feature reusable code
│  ├─ components/          # Buttons, tables, modals,
│  ├─ layouts              # Layout for the portals
│  ├─ hooks/               # Generic hooks
│  ├─ utils/               # Utility functions
│  └─ constants/           # App constants
├─ context/                # Global state management
│  ├─ AuthContext.tsx      # Context for auth
│  ├─ UIContext.tsx        # Context for UI logic
│  └─ DataContext.tsx      # Context for data states
├─ services/
│  ├─ api/
│  │  ├─ client.ts         # Unified client (auto mock/real switch)
│  │  ├─ clientFactory.ts  # Switches between mockApiClient & apiClient
│  │  ├─ endpoints.ts      # ALL API endpoints centralized
│  │  └─ mockClient.ts     # Mock API client implementation
│  ├─ mock/
│  │  ├─ handlerAdapter.ts # Routes ALL mock requests to handlers
│  │  └─ mockDb.ts         # Centralized mock database
│  └─ index.ts             # Service exports (auto mock/real)
├─ types/                  # Global types
│  └─ api.ts
└─ env.ts
```

## Service Pattern (Integration-Safe)

1. **Define Stable Domain Types** (Never change these)
2. **Centralized API Endpoints** (In `src/services/api/endpoints.ts`, ALL API endpoints defined here)
3. **Create Service Interface** (Single contract in `src/modules/<feature>/services/`)
4. **Centralized Mock Database** (In `src/services/mock/mockDb.ts`, shared across features)
5. **Mock Request Handlers** (In `src/services/mock/handlerAdapter.ts`, routes requests & handles business logic)
6. **Mock Service Implementation** (In `src/modules/<feature>/services/`, implements interface using mock handlers)
7. **Real API Implementation** (Same interface, uses `src/services/api/client.ts`)
8. **Unified Client Switch** (`src/services/api/clientFactory.ts` switches between mock/real based on env flag)

## Component Guidelines

- **Components = Pure UI** - No API calls, no business logic
- **Use existing domain hooks only** - `const { data, loading } = useDomainData()`
- **Keep components presentational** - All logic in hooks/services

## Adding New Pages & Components

### How to Add New Pages

1. **Add page under `src/pages/<role>` for UI design look**
   ```typescript
   // src/pages/admin/DashboardPage.tsx
   export function DashboardPage() {
     return (
       <div>
         <h1>Dashboard</h1>
         {/* Focus on UI layout and design */}
         {/* Use components from modules for data interactions */}
       </div>
     )
   }
   ```

2. **Create components with data manipulation in modules**
   - Create service interfaces and implementations in the module
   - Create types for the data structures
   ```typescript
   // src/modules/dashboard/
   // - components/DashboardComponents.tsx (UI components)
   // - services/DashboardService.ts (service interface)
   // - services/dashboard.api.ts (real API implementation)
   // - services/dashboard.mock.ts (delegates to centralized handlerAdapter)
   // - hooks/useDashboard.ts (data manipulation hooks)
   // - types.ts (TypeScript types)
   // - index.ts (exports)
   ```

3. **In `src/pages/<role>/<Page>.tsx`, include components with interaction through hooks only**
   ```typescript
   // src/pages/admin/DashboardPage.tsx
   import { DashboardChart, DashboardStats } from '../../modules/dashboard'
   import { useDashboard } from '../../modules/dashboard'

   export function DashboardPage() {
     const { data, loading, error, refreshData } = useDashboard()

     return (
       <div>
         <DashboardStats data={data.stats} />
         <DashboardChart data={data.chart} onRefresh={refreshData} />
       </div>
     )
   }
   ```

4. **Add route in `src/app/routes.tsx`**
   ```typescript
   import { DashboardPage } from "../pages/admin/DashboardPage"

   export const AppRoutes = () => (
     <Routes>
       <Route path="/" element={<Index />} />
       <Route path="/admin/dashboard" element={<DashboardPage />} />
       {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
       <Route path="*" element={<NotFound />} />
     </Routes>
   )
   ```

5. **UPDATE the main page (`src/pages/Index.tsx`) to include navigation** if needed

### Where to Put Components

**🎯 Shared Components (`src/shared/components/`):**
- **Reused across multiple features** - Buttons, forms, modals, tables, cards
- **Generic UI elements** - Layout components, navigation, common widgets
- **shadcn/ui customizations** - Modified versions of shadcn components
- **Utility components** - Loading spinners, error boundaries, tooltips

**✅ Put in shared/components when:**
- Component is used in 2+ different feature modules
- Component has no feature-specific logic
- Component is a pure UI primitive

**❌ Don't put in shared/components when:**
- Component is only used in one feature
- Component contains feature-specific business logic
- Component is tightly coupled to a specific domain

**🏗️ Feature Components (`src/modules/<feature>/components/`):**
- **Page components** - Full page layouts (e.g., `DashboardPage`, `UserProfilePage`)
- **Feature-specific components** - User profile form, product card, dashboard widgets
- **Page sections** - Complex layouts specific to one feature
- **Domain-specific UI** - Order history, user management table

**✅ Put in feature modules when:**
- Component is only used within one feature
- Component contains feature-specific logic or hooks
- Component represents a domain concept
- Component is a PAGE (full route destination)

### Feature Module Structure

When creating a new feature module:

```
src/modules/<feature>/
├─ components/           # Feature-specific components only
├─ hooks/               # Feature-specific hooks
├─ services/            # Feature services (interface + mock + real)
├─ types.ts             # Feature domain types
└─ index.ts             # Feature exports
```

**Example: User Management Feature**
```
src/modules/users/
├─ components/
│  ├─ UsersPage.tsx     # PAGE: Lists all users (route: /users)
│  ├─ UserDetailPage.tsx # PAGE: Single user view (route: /users/:id)
│  ├─ UserTable.tsx     # Component: Uses useUsers hook
│  ├─ UserForm.tsx      # Component: Uses useUserForm hook
│  └─ UserProfile.tsx   # Component: Uses useUser hook
├─ hooks/
│  ├─ useUsers.ts       # Calls userService
│  ├─ useUser.ts        # Calls userService
│  └─ useUserForm.ts    # Form logic + userService
├─ services/
│  ├─ UserService.ts    # Service interface
│  ├─ user.mock.ts      # Mock implementation (delegates to handlerAdapter)
│  └─ user.api.ts       # Real API implementation (uses centralized client)
├─ types.ts             # User, UserRole, etc.
└─ index.ts             # export { UsersPage, useUsers, UserTable, ... }
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
import { apiClient } from "@/services/api/client"
import { endpoints } from "@/services/api/endpoints"
import { UserService } from "./UserService"

export const userApiService: UserService = {
  async list() {
    const res = await apiClient.get(endpoints.users.list)
    return res.data
  },

  async get(id) {
    const res = await apiClient.get(endpoints.users.get(id))
    return res
  },

  async create(input) {
    const res = await apiClient.post(endpoints.users.create, input)
    return res
  },
}

4️⃣ Centralized Endpoints (🔥 NEW: Single source of truth)
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

5️⃣ Centralized Mock Handling (🔥 NEW: All mocks in one place)
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

6️⃣ Automatic Mock/Real Switching (🔥 NEW: No manual switching)
// services/api/client.ts (via clientFactory)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true"
export const apiClient = USE_MOCK ? mockApiClient : realApiClient

// services/index.ts
export { userApiService as userService } from "@/modules/users/services/user.api"


🧠 Integration = flipping ONE env flag

6️⃣ Hook = UI’s Only Entry Point (Unchanged)
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

7️⃣ Component = Pure UI (Safe Forever) (Unchanged)
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

## Context Usage

**✅ Context IS for:**
- Auth session
- Feature flags
- Permissions
- Shared UI state
- Cached domain data (optional)

**❌ Context is NOT for:**
- API calls directly
- Page-specific state
- Mock logic

## Golden Rules

- Components → Hooks → Services → API
- One interface per domain
- Mock & real share the same contract
- Env flag controls backend
- UI never imports API or mock files

## AI Prompt for Building Screens

**"Use existing domain hooks only. Do not call fetch/axios directly. Assume all data comes from hooks. Keep components presentational."**

This prevents 90% of integration pain.
