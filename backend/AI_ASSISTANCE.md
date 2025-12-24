# AI Assistance Rules for Creating New API Routes

## Route Definition System Overview

The backend provides:
- **Automatic Zod validation** for requests and responses
- **Mock/Real switching** based on `MOCK_MODE` environment variable
- **Capability-based authorization** with automatic middleware application
- **AutoCRUD generation** for standard REST operations
- **Type-safe schemas** with compile-time validation

## 📋 Route Creation Process (2025 Edition)

### 1. Database Schema Planning
When creating a new API endpoint, **always think of the table schema first**:
- Design the database table structure that will support the new endpoint
- Consider relationships, constraints, and indexes
- **Update the database schema first** before implementing the route
- Consider tenant-aware table naming (e.g., `project_users` vs `users`)

### 2. Zod Schema Design
**Create type-safe schemas first** in `routes/schemas/`:
```javascript
// routes/schemas/resource.js
const { z } = require('zod');

const ResourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const CreateResourceSchema = z.object({
  name: z.string().min(2).max(100)
});

const UpdateResourceSchema = ResourceSchema.partial();

module.exports = {
  ResourceSchema,
  CreateResourceSchema,
  UpdateResourceSchema
};
```

### 3. Capabilities and Authorization
**Reference and update core/Capability.js for role policies**:
```javascript
// Check CAPABILITIES in core/Capability.js
const CAPABILITIES = {
  member: {
    can: ['profile:read', 'profile:write']
  },
  admin: {
    can: ['users:read', 'users:write', 'system:read']
  },
  superadmin: {
    can: ['*'] // All capabilities
  }
};
```
- Add new capabilities if needed
- Use existing capability strings for route authorization
- Capabilities are automatically enforced via `capability` field in route definitions

### 4. Route Definition Implementation
**Create route definitions in `routes/resource.routes.js`**:

#### Standard Route Structure:
```javascript
// Conditional imports (ALWAYS USE THIS PATTERN)
let DatabaseService;
if (process.env.MOCK_MODE !== 'true') {
  DatabaseService = require('../services/DatabaseService');
}
const MockDataService = require('../services/MockDataService');
const { ResourceSchema, CreateResourceSchema } = require('./schemas/resource');

module.exports = [
  // GET /api/resource
  {
    path: '/resource',
    method: 'GET',
    capability: 'resource:read',
    schema: z.array(ResourceSchema), // Response validation
    mock: () => {
      const items = MockDataService.findAll('resources');
      return items.length > 0 ? items : MockDataService.list(() => MockDataService.resource(), 5);
    },
    real: async (req, db) => {
      return await db.find('resources');
    }
  },

  // POST /api/resource
  {
    path: '/resource',
    method: 'POST',
    capability: 'resource:write',
    schema: ResourceSchema,
    requestSchema: { body: CreateResourceSchema }, // Request validation
    mock: (req) => {
      const newItem = {
        id: require('crypto').randomUUID(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return MockDataService.persist('resources', newItem);
    },
    real: async (req, db) => {
      return await db.insert('resources', req.body);
    }
  }
];
```

#### AutoCRUD Pattern (For Simple Resources):
```javascript
// For basic CRUD, use this simplified format:
{
  resource: 'products',           // Resource name (plural)
  schema: ProductSchema,          // Zod response schema
  capabilities: {                 // CRUD capabilities
    list: 'products:read',
    create: 'products:write',
    read: 'products:read',
    update: 'products:write',
    delete: 'products:write'
  },
  hooks: {                        // Optional lifecycle hooks
    beforeCreate: async (data, context) => { /* validation */ },
    afterCreate: async (result, context) => { /* notifications */ }
  }
}
// Auto-generates: GET /products, POST /products, GET /products/:id, PATCH /products/:id, DELETE /products/:id
```

### 5. Server Integration with RouteProcessor
**Register routes in server.js**:
```javascript
// Import route definitions
const resourceRouteDefinitions = require('./routes/resource.routes');
const autoCrudDef = require('./routes/autocrud.routes');

// Initialize RouteProcessor (already done)
const routeProcessor = new RouteProcessor(app);

// Register routes
routeProcessor.processRoutes(resourceRouteDefinitions, '/api');
// OR for AutoCRUD:
routeProcessor.processAutoCrud(autoCrudDef, '/api');
```

### 6. Testing Preparation
**Prep tests for the new API patterns**:
- Test both mock and real implementations
- Verify Zod schema validation
- Test capability-based authorization
- Include error condition tests
- Test tenant-aware database operations

## 🎯 Route Definition Fields Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | ✅ | URL path (relative to base path) |
| `method` | string | ✅ | HTTP method (GET, POST, PUT, DELETE, PATCH) |
| `capability` | string | ❌ | Required capability (null for public routes) |
| `schema` | ZodSchema | ❌ | Response validation schema |
| `requestSchema` | object | ❌ | Request validation: `{body, query, params}` |
| `mock` | function | ❌ | Mock implementation function |
| `real` | function | ❌ | Database implementation function |
| `noAuth` | boolean | ❌ | Skip authentication (default: false) |
| `forceMock` | boolean | ❌ | Always use mock (default: false) |
| `delay` | number | ❌ | Mock response delay in ms (default: 0) |

## 🔧 Best Practices Patterns

### Import Patterns
```javascript
// ✅ ALWAYS use conditional DatabaseService import
let DatabaseService;
if (process.env.MOCK_MODE !== 'true') {
  DatabaseService = require('../services/DatabaseService');
}
const MockDataService = require('../services/MockDataService');

// ✅ Import Zod schemas
const { z } = require('zod');
const { ResourceSchema } = require('./schemas/resource');
```

### Mock Implementation Patterns
```javascript
// ✅ Seed with fallback pattern
mock: () => {
  const stored = MockDataService.findAll('resources');
  if (stored.length === 0) {
    const seeded = MockDataService.list(() => MockDataService.resource(), 5);
    seeded.forEach(item => MockDataService.persist('resources', item));
    return seeded;
  }
  return stored;
}

// ✅ Single entity with error handling
mock: (req) => {
  const item = MockDataService.findById('resources', req.params.id);
  if (!item) throw new Error('Resource not found');
  return item;
}
```

### Real Implementation Patterns
```javascript
// ✅ Use tenant-aware database access
real: async (req, db) => {
  // db.find('resources') automatically queries 'project_resources'
  return await db.find('resources');
}

// ✅ Standard CRUD operations
real: async (req, db) => {
  return await db.find('resources', {
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
    limit: 10
  });
}
```

### Error Handling
- **Don't manually handle errors** - RouteProcessor does this automatically
- **Throw descriptive errors** - they'll be formatted properly
- **Use standard error messages** - 'Not found', 'Invalid credentials', etc.

### File Organization
```
routes/
├── schemas/           # Zod schemas
│   ├── auth.js
│   └── resource.js
├── auth.routes.js     # Route definitions
├── resource.routes.js
└── autocrud.routes.js # AutoCRUD definitions
```

## 🚦 Environment Variables
- `MOCK_MODE=true` - Use mock implementations
- `NAMESPACE=project` - Database tenant prefix
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Token expiration (default: '7d')

## 📚 Additional Resources
- Check existing `routes/auth.routes.js` for complete examples
- Review `services/RouteProcessor.js` for advanced routing features
- See `core/Capability.js` for available capabilities
- Test with `npm run dev` and check `/health` endpoint
