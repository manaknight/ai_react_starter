# Tech Stack

- You are building a React application.
- Use TypeScript.
- Use React Router. KEEP ALL routes in `src/app/routes.tsx`
- Always put source code in the src folder.
- Pages belong in pages (not `src/pages/`). The main page route is defined in `routes.tsx`. pages only have ui and call hooks and include components needed.
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
- **Services are swappable** - Mock ↔ Real services via environment flag
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
├─ services/               # Global services
│  ├─ api/
│  │  ├─ client.ts         # axios/fetch wrapper
│  │  ├─ endpoints.ts      # url endpoints
│  │  └─ adapters.ts       # transform api requests
│  ├─ mock/
│  │  └─ index.ts          # Mock data (arrays/objects)
│  └─ index.ts
├─ types/                  # Global types
│  └─ api.ts
└─ env.ts
```

## Service Pattern (Integration-Safe)

1. **Define Stable Domain Types** (Never change these)
2. **Create Service Interface** (Single contract)
3. **Mock Data** (In `src/services/mock/`, export arrays/objects)
4. **Mock Service Implementation** (In `src/modules/<feature>/services/`, implements interface using mock data)
5. **Real API Implementation** (Same interface)
6. **Runtime Service Switch** (One env flag: `USE_MOCK` to switch between services and mock services)

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
   - Create mocks, services, and hooks in the module
   - Create types for the data structures
   ```typescript
   // src/modules/dashboard/
   // - components/DashboardComponents.tsx (UI components)
   // - services/dashboard.api.ts (API calls)
   // - services/dashboard.mock.ts (mock data)
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
│  ├─ UserService.ts    # Interface
│  ├─ user.mock.ts      # Mock service implementation (uses global mock data)
│  └─ user.api.ts       # Real API implementation
├─ types.ts             # User, UserRole, etc.
└─ index.ts             # export { UsersPage, useUsers, UserTable, ... }
```

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
