# AI React Starter

A modern, full-stack React application starter with TypeScript, featuring a modular architecture, comprehensive UI components, and robust development tooling.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Backend: MySQL database (optional, can use mock data)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd ai_react_starter
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your database credentials
   ```

3. **Start the development servers:**
   ```bash
   # Terminal 1: Start the backend
   cd backend
   pnpm run dev

   # Terminal 2: Start the frontend
   pnpm run dev
   ```

4. **Open your browser:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001

## 🏗️ Project Structure

### Frontend (`src/`)

The React frontend follows a modular, scalable architecture:

```
src/
├── app/                    # Application core
│   ├── App.tsx            # Main app component
│   ├── providers.tsx      # Context providers setup
│   └── routes.tsx         # Route configuration
├── context/               # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   ├── DataContext.tsx    # Global data management
│   └── UIContext.tsx      # UI state (theme, modals, etc.)
├── modules/               # Feature modules (modular architecture)
│   └── users/             # User management module
│       ├── components/    # Module-specific components
│       ├── hooks/         # Module-specific hooks
│       ├── services/      # API and mock services
│       ├── types/         # TypeScript types
│       └── index.ts       # Module exports
├── pages/                 # Route-based page components
│   ├── Index.tsx          # Home page
│   └── NotFound.tsx       # 404 page
├── services/              # Shared services
│   ├── api/               # API client and endpoints
│   └── mock/              # Mock data services
├── shared/                # Shared utilities and components
│   ├── components/        # Reusable UI components
│   │   └── components/ui/ # shadcn/ui component library
│   ├── hooks/             # Shared custom hooks
│   └── utils/             # Utility functions
├── types/                 # Global TypeScript definitions
├── env.ts                 # Environment configuration
└── main.tsx               # Application entry point
```

### Backend (`backend/`)

Node.js/Express API server with modular services:

```
backend/
├── config/                # Configuration files
├── core/                  # Core utilities (DB, capabilities)
├── middleware/            # Express middleware
├── routes/                # API route handlers
├── services/              # Business logic services
└── server.js              # Main server file
```

## 🔧 How It Works

### Architecture Overview

This project uses a **modular architecture** where features are organized into self-contained modules. Each module includes its own components, hooks, services, and types.

### Key Technologies

- **Frontend:**
  - React 18 with TypeScript
  - Vite for build tooling
  - React Router for routing
  - TanStack Query for data fetching
  - Radix UI + Tailwind CSS for components
  - Context API for state management

- **Backend:**
  - Node.js + Express
  - MySQL with connection pooling
  - JWT authentication
  - RESTful API design

### Data Flow

1. **API Layer:** Axios client with interceptors handles HTTP requests
2. **Service Layer:** Business logic abstracted into services (API vs Mock)
3. **Hook Layer:** Custom hooks manage component state and data fetching
4. **Component Layer:** Presentational components consume hooks and context

### Environment Configuration

The app supports multiple environments through environment variables:

- `VITE_API_BASE_URL`: Backend API URL (defaults to `http://localhost:3001/api`)
- `VITE_USE_MOCK`: Toggle between real API and mock data (`true`/`false`)
- `NODE_ENV`: Current environment mode

### Development vs Production

- **Development:** Uses Vite dev server with HMR, can switch between mock/real data
- **Production:** Built with Vite, served as static files, connects to real API

## 📦 Available Scripts

### Frontend
```bash
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run build:dev    # Build for development
pnpm run preview      # Preview production build
pnpm run lint         # Run ESLint
```

### Backend
```bash
cd backend
pnpm run dev          # Start with nodemon
pnpm run start        # Start production server
pnpm run test         # Run tests
```

## 🎯 Development Workflow

1. **Create a new feature module:**
   ```bash
   mkdir -p src/modules/newFeature/{components,hooks,services,types}
   touch src/modules/newFeature/index.ts
   ```

2. **Add routes** in `src/app/routes.tsx`
3. **Update providers** if new context is needed
4. **Configure API endpoints** in backend routes

## 🔒 Security Features

- JWT-based authentication
- Helmet for security headers
- Rate limiting
- Input validation with express-validator
- CORS configuration

## 🧪 Testing

- Frontend: Component testing with React Testing Library
- Backend: API testing with Jest and Supertest
- Mock data support for isolated development

## 📚 Learn More

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)