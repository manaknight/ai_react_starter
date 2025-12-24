# Backend

This is a Node.js/Express backend API with MySQL database, built with security and scalability in mind.

## Architecture Overview

The backend follows a modular architecture with:
- **Express.js** server with middleware for security, CORS, rate limiting
- **MySQL** database with connection pooling
- **JWT** authentication with role-based access control
- **Database Service** layer providing ORM-like functionality
- **Modular routing** system
- **Service layer** for business logic

## 🔀 2025 Route Definition Patterns

### New Route Structure
Routes are now defined as arrays of configuration objects with Zod validation, automatic mock/real switching, and capability-based authorization.

### Standard Route Structure
```javascript
module.exports = [
  {
    path: '/resource',           // URL path (relative to project)
    method: 'GET',               // HTTP method
    capability: 'resource:read', // Required permission
    schema: ResponseSchema,      // Zod validation schema
    requestSchema: {             // Optional request validation
      body: BodySchema,
      query: QuerySchema,
      params: ParamsSchema
    },
    mock: (req) => {             // Mock implementation
      return MockDataService.list(() => MockDataService.resource(), 5);
    },
    real: async (req, db) => {   // Real database implementation
      return await db.find('resource');
    },
    noAuth: false,               // Skip authentication (default: false)
    forceMock: false,            // Always use mock (default: false)
    delay: 0                     // Custom mock delay override
  }
];
```

### AutoCRUD Route Structure (2025 Vision)
```javascript
{
  resource: 'orders',           // Resource name (plural)
  schema: OrderSchema,          // Zod response schema
  capabilities: {               // CRUD capabilities
    list: 'orders:read',
    create: 'orders:write',
    read: 'orders:read',
    update: 'orders:write',
    delete: 'orders:write'
  },
  hooks: {                      // Lifecycle hooks (optional)
    beforeCreate: async (data, context) => { /* validation */ },
    afterCreate: async (result, context) => { /* notifications */ }
  }
}
// Auto-generates: GET /orders, POST /orders, GET /orders/:id, PATCH /orders/:id, DELETE /orders/:id
```

### Zod Schema Patterns

#### Response Schemas
```javascript
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['Member', 'Admin', 'SuperAdmin']),
  avatar: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional()
});

const UserListSchema = z.array(UserSchema);
```

#### Request Validation Schemas
```javascript
const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['Member', 'Admin']).optional().default('Member')
});

requestSchema: {
  body: CreateUserSchema,
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
  }),
  params: z.object({
    id: z.string().uuid()
  })
}
```

### Authentication & Authorization

#### JWT Authentication
- **Header**: `Authorization: Bearer <token>`
- **Verification**: Automatic via `auth.verifyToken` middleware
- **User Object**: `req.user = { id, email, role, status, tenantId, is_premium }`

#### Capability-Based Authorization
```javascript
// Route-level capability check
capability: 'users:read'

// Middleware usage
const { requireCapability } = require('../middleware/capability');
router.get('/users', requireCapability('users:read'), handler);
```

#### Role-Based Access
```javascript
const auth = require('../middleware/auth');

// Common patterns
auth.requireMember       // Member, Admin, Support
auth.requireAdmin        // Admin only (tenant-scoped)
auth.requireSuperAdmin   // SuperAdmin only (global)
auth.requirePremiumMember // Premium members only
```

#### Capability Mapping
```javascript
// From core/Capability.js
const CAPABILITIES = {
  member: ['profile:read', 'profile:write'],
  admin: ['users:read', 'users:write', 'system:read'],
  superadmin: ['*'] // All capabilities
};
```

### Database Patterns

#### Standard Operations
```javascript
// Find records
const users = await db.find('users', {
  where: { role: 'Admin', status: 'active' },
  orderBy: { createdAt: 'desc' },
  limit: 10,
  offset: 20,
  select: ['id', 'name', 'email']
});

// Find single record
const user = await db.findOne('users', {
  where: { id: userId }
});

// Create record
const newUser = await db.insert('users', {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Member'
});

// Update record
const updatedUser = await db.update('users', {
  where: { id: userId },
  data: { name: 'Jane Doe' }
});

// Delete record
const deletedCount = await db.delete('users', {
  where: { id: userId }
});
```

#### Tenant-Aware Database Access
```javascript
// In project routes, 'db' parameter is auto-namespaced
real: async (req, db) => {
  // db.find('users') automatically queries 'projectId_users'
  return await db.find('users');
}
```

### Mock Data Patterns

#### MockDataService Usage
```javascript
const MockDataService = require('../services/MockDataService');

// Generate single entity
const user = MockDataService.user(); // { id, name, email, ... }

// Generate list
const users = MockDataService.list(() => MockDataService.user(), 5);

// Persist in memory (for stateful mocks)
const savedUser = MockDataService.persist('users', userData);

// Retrieve from memory
const storedUsers = MockDataService.findAll('users');
const user = MockDataService.findById('users', userId);
```

#### Mock Implementation Examples
```javascript
// List with seeding
mock: () => {
  const stored = MockDataService.findAll('products');
  if (stored.length === 0) {
    const seeded = MockDataService.list(() => MockDataService.product(), 5);
    seeded.forEach(p => MockDataService.persist('products', p));
    return seeded;
  }
  return stored;
}

// Single entity with fallback
mock: (req) => {
  const product = MockDataService.findById('products', req.params.id);
  return product || MockDataService.product(req.params.id);
}

// Create with merge
mock: (req) => {
  const newProduct = {
    ...MockDataService.product(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  return MockDataService.persist('products', newProduct);
}
```

### Import Patterns

#### Conditional Database Imports
```javascript
// Always use this pattern to avoid import errors in mock mode
let DatabaseService;
if (process.env.MOCK_MODE !== 'true') {
  DatabaseService = require('../services/DatabaseService');
}
const MockDataService = require('../services/MockDataService');
```

#### Path Patterns by Location
```javascript
// In root routes/ directory
const DatabaseService = require('../services/DatabaseService');
const MockDataService = require('../services/MockDataService');

// In projects/[projectId]/routes/ directory
const DatabaseService = require('../../../services/DatabaseService');
const MockDataService = require('../../../services/MockDataService');
```

## How to Install

### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- npm or yarn

### Installation Steps

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env
```

4. **Configure your `.env` file:**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=project
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Other Configuration
ENCRYPTION_KEY=your_32_character_encryption_key
```

5. **Set up the database:**
```bash
# Run the database migration script
node run-sql.js
```

6. **Start the server:**
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start

# Test mode
npm test
```

The server will start on `http://localhost:3001` with a health check endpoint at `/health`.

## How to Add New Routes

### 2025 Route Definition Pattern
Routes are now defined using the new 2025 pattern with automatic validation, mock/real switching, and capability-based authorization.

### Example: Creating a new route file

1. **Create Zod schemas** (e.g., `routes/schemas/products.js`):
```javascript
const { z } = require('zod');

const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const CreateProductSchema = z.object({
  name: z.string().min(2).max(100),
  price: z.number().min(0),
  description: z.string().optional()
});

module.exports = {
  ProductSchema,
  CreateProductSchema
};
```

2. **Create route definitions** (e.g., `routes/products.routes.js`):
```javascript
// Conditional Database Imports
let DatabaseService;
if (process.env.MOCK_MODE !== 'true') {
  DatabaseService = require('../services/DatabaseService');
}
const MockDataService = require('../services/MockDataService');

// Import schemas
const { ProductSchema, CreateProductSchema } = require('./schemas/products');

module.exports = [
  // GET /api/products - List products
  {
    path: '/products',
    method: 'GET',
    capability: 'products:read',
    schema: z.array(ProductSchema),
    mock: () => {
      const products = MockDataService.findAll('products');
      return products.length > 0 ? products : MockDataService.list(() => MockDataService.product(), 5);
    },
    real: async (req, db) => {
      return await db.find('products');
    }
  },

  // POST /api/products - Create product
  {
    path: '/products',
    method: 'POST',
    capability: 'products:write',
    schema: ProductSchema,
    requestSchema: { body: CreateProductSchema },
    mock: (req) => {
      const newProduct = {
        id: require('crypto').randomUUID(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return MockDataService.persist('products', newProduct);
    },
    real: async (req, db) => {
      return await db.insert('products', {
        ...req.body,
        created_by: req.user.id
      });
    }
  },

  // GET /api/products/:id - Get single product
  {
    path: '/products/:id',
    method: 'GET',
    capability: 'products:read',
    schema: ProductSchema,
    mock: (req) => {
      const product = MockDataService.findById('products', req.params.id);
      if (!product) throw new Error('Product not found');
      return product;
    },
    real: async (req, db) => {
      const product = await db.findOne('products', {
        where: { id: req.params.id }
      });
      if (!product) throw new Error('Product not found');
      return product;
    }
  }
];
```

3. **Register routes in `server.js`:**
```javascript
// Import route definitions
const productRouteDefinitions = require('./routes/products.routes');

// Register with RouteProcessor
routeProcessor.processRoutes(productRouteDefinitions, '/api');
```

### Route Best Practices
- Use Zod schemas for type-safe validation
- Implement both mock and real handlers
- Use capability-based authorization
- Include proper error handling (errors are automatically handled)
- Follow the established patterns for consistency

## How to Add New Services

### Service Structure
Services are organized in the `services/` directory. Each service is a module that exports an object with methods.

### Example: Creating a new service

1. **Create a new service file** (e.g., `services/ProductService.js`):
```javascript
const DatabaseService = require('./DatabaseService');

/**
 * Product Service
 * Handles business logic for product operations
 */
const ProductService = {
  /**
   * Get all products with optional filtering
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of products
   */
  async getProducts(options = {}) {
    const { category, minPrice, maxPrice, limit = 20, offset = 0 } = options;

    let where = {};

    if (category) {
      where.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.operator = '>=';
        where.price.value = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price = where.price || {};
        where.price.operator = '<=';
        where.price.value = maxPrice;
      }
    }

    return await DatabaseService.find('products', {
      where,
      orderBy: { created_at: 'DESC' },
      limit,
      offset
    });
  },

  /**
   * Get product by ID with related data
   * @param {number} productId - Product ID
   * @returns {Promise<Object|null>} - Product object or null
   */
  async getProductById(productId) {
    const products = await DatabaseService.find('products', {
      where: { id: productId },
      limit: 1
    });

    return products[0] || null;
  },

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @param {number} userId - User creating the product
   * @returns {Promise<Object>} - Created product
   */
  async createProduct(productData, userId) {
    // Validate business rules
    if (productData.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }

    // Add audit fields
    const productWithAudit = {
      ...productData,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    };

    return await DatabaseService.insert('products', productWithAudit);
  },

  /**
   * Update product
   * @param {number} productId - Product ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Update result
   */
  async updateProduct(productId, updates) {
    // Add updated timestamp
    updates.updated_at = new Date();

    return await DatabaseService.update('products', updates, {
      where: { id: productId }
    });
  },

  /**
   * Delete product (soft delete)
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteProduct(productId) {
    return await DatabaseService.update('products', {
      deleted_at: new Date(),
      status: 'deleted'
    }, {
      where: { id: productId }
    });
  },

  /**
   * Get product statistics
   * @returns {Promise<Object>} - Statistics object
   */
  async getProductStats() {
    const [totalProducts] = await DatabaseService.query(
      'SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL'
    );

    const [avgPrice] = await DatabaseService.query(
      'SELECT AVG(price) as average FROM products WHERE deleted_at IS NULL AND price > 0'
    );

    return {
      totalProducts: totalProducts.count,
      averagePrice: avgPrice.average || 0
    };
  }
};

module.exports = ProductService;
```

2. **Use the service in routes:**
```javascript
const ProductService = require('../services/ProductService');

// In your route handler:
router.get('/', async (req, res) => {
  try {
    const products = await ProductService.getProducts(req.query);
    res.json(products);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});
```

### Service Best Practices
- Keep business logic separate from route handlers
- Validate data and enforce business rules
- Handle errors appropriately
- Use transactions for multi-step operations
- Include audit trails (created_by, updated_at, etc.)

## How to Migrate Database

### Using the SQL Runner

The backend includes a `run-sql.js` script for executing SQL migrations:

```bash
# Run migrations from requirements/mandasql_clean.sql
node run-sql.js
```

### Creating New Migrations

1. **Create SQL file** in `requirements/` directory with your schema changes:
```sql
-- Add new table
CREATE TABLE products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  created_by BIGINT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  status ENUM('active', 'deleted') DEFAULT 'active',
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at);
```

2. **Run the migration:**
```bash
node run-sql.js
```

### Manual Migration (Alternative)

You can also run SQL directly in your MySQL client or use migration tools like Flyway.

### Migration Best Practices
- Always backup your database before migrations
- Test migrations on development environment first
- Use descriptive names for migration files
- Include rollback scripts when possible
- Version control your SQL schema files

## Key Components

### Database Service
The `DatabaseService` provides ORM-like functionality with:
- Connection pooling and security
- Query building with sanitization
- Transaction support
- Pagination and filtering
- Decimal precision handling

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Member, Admin, Support)
- Password hashing with bcrypt
- Password reset functionality

### Middleware
- **auth.js**: Token verification and role checking
- **capability.js**: Permission-based access control
- Security headers via Helmet
- Rate limiting
- CORS configuration

### Database Schema
Current tables include:
- `users`: User accounts and authentication
- `user_profiles`: Extended user information
- `password_reset_tokens`: Password reset functionality

## Development Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run database migrations
node run-sql.js
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (2025 Route Pattern)
All auth endpoints now use Zod validation, automatic mock/real switching, and capability-based authorization:

- `POST /api/auth/register` - User registration (public)
- `POST /api/auth/login` - User login (public)
- `GET /api/auth/me` - Get current user profile (requires `profile:read`)
- `POST /api/auth/forgot-password` - Request password reset (public)
- `POST /api/auth/reset-password` - Reset password (public)
- `GET /api/auth/capabilities` - Get role capabilities (public)

## Environment Variables

See `env.example` for all required environment variables. Key variables include:
- Database connection settings
- JWT secrets and expiration
- CORS origins
- Server port and environment

## Error Handling

The API uses consistent error response formats:
```json
{
  "error": "ErrorType",
  "message": "Human readable message",
  "details": [] // Optional validation errors
}
```