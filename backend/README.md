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
DB_NAME=manda_club
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

### Route Structure
Routes are organized in the `routes/` directory. Each route file exports an Express router.

### Example: Creating a new route file

1. **Create a new route file** (e.g., `routes/products.js`):
```javascript
const express = require('express');
const { body, validationResult } = require('express-validator');
const DatabaseService = require('../services/DatabaseService');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/products - Get all products (public)
router.get('/', async (req, res) => {
  try {
    const products = await DatabaseService.find('products');
    res.json(products);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// POST /api/products - Create new product (authenticated users only)
router.post('/', auth.verifyToken, [
  body('name').trim().isLength({ min: 1 }),
  body('price').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, price, description } = req.body;

    const result = await DatabaseService.insert('products', {
      name,
      price,
      description,
      created_by: req.user.id
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create product',
      message: error.message
    });
  }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', auth.requireAdmin, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('price').optional().isNumeric()
], async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await DatabaseService.update('products', updates, {
      where: { id }
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update product',
      message: error.message
    });
  }
});

module.exports = router;
```

2. **Register the route in `server.js`:**
```javascript
// In server.js, add after the auth routes import:
// const productRoutes = require('./routes/products');

// And add to the API routes section:
// app.use('/api/products', productRoutes);
```

### Route Best Practices
- Use Express Validator for input validation
- Include proper error handling with try/catch blocks
- Use authentication middleware when needed
- Return consistent JSON response formats
- Use HTTP status codes appropriately

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

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/capabilities` - Get role capabilities

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