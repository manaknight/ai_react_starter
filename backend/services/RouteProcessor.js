const auth = require('../middleware/auth');
const { requireCapability } = require('../middleware/capability');
const DatabaseService = require('./DatabaseService');
const MockDataService = require('./MockDataService');
const crypto = require('crypto');
const { z } = require('zod');

/**
 * Route Processor for 2025 Route Definition Patterns
 * Processes route definitions with Zod validation, auth, and mock/real switching
 */
class RouteProcessor {
  constructor(app) {
    this.app = app;
    this.isMockMode = process.env.MOCK_MODE === 'true';
  }

  /**
   * Process an array of route definitions
   * @param {Array} routeDefinitions - Array of route definition objects
   * @param {string} basePath - Base path for all routes (e.g., '/api/auth')
   */
  processRoutes(routeDefinitions, basePath = '') {
    routeDefinitions.forEach(routeDef => {
      this.processRoute(routeDef, basePath);
    });
  }

  /**
   * Process a single route definition
   * @param {Object} routeDef - Route definition object
   * @param {string} basePath - Base path prefix
   */
  processRoute(routeDef, basePath = '') {
    const {
      path,
      method,
      capability,
      schema: responseSchema,
      requestSchema,
      mock,
      real,
      noAuth = false,
      forceMock = false,
      delay = 0
    } = routeDef;

    const fullPath = basePath + path;
    const useMock = forceMock || (this.isMockMode && !forceMock);

    // Build middleware chain
    const middlewares = [];

    // Add auth middleware if required
    if (!noAuth) {
      middlewares.push(auth.verifyToken);
    }

    // Add capability middleware if required
    if (capability) {
      middlewares.push(requireCapability(capability));
    }

    // Add request validation middleware
    if (requestSchema) {
      middlewares.push(this.createValidationMiddleware(requestSchema));
    }

    // Add response validation middleware (only in development)
    if (responseSchema && process.env.NODE_ENV === 'development') {
      middlewares.push(this.createResponseValidationMiddleware(responseSchema));
    }

    // Add the main handler
    middlewares.push(this.createHandler(mock, real, useMock, delay));

    // Register the route
    const expressMethod = method.toLowerCase();
    if (this.app[expressMethod]) {
      this.app[expressMethod](fullPath, ...middlewares);
    } else {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  /**
   * Create request validation middleware using Zod
   * @param {Object} requestSchema - Zod schema for request validation
   * @returns {Function} Express middleware
   */
  createValidationMiddleware(requestSchema) {
    return (req, res, next) => {
      try {
        // Validate body if specified
        if (requestSchema.body) {
          req.body = requestSchema.body.parse(req.body);
        }

        // Validate query if specified
        if (requestSchema.query) {
          req.query = requestSchema.query.parse(req.query);
        }

        // Validate params if specified
        if (requestSchema.params) {
          req.params = requestSchema.params.parse(req.params);
        }

        next();
      } catch (error) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Request data does not match expected format',
          details: error.errors || error.message
        });
      }
    };
  }

  /**
   * Create response validation middleware using Zod (development only)
   * @param {Object} responseSchema - Zod schema for response validation
   * @returns {Function} Express middleware
   */
  createResponseValidationMiddleware(responseSchema) {
    return (req, res, next) => {
      // Store original json method
      const originalJson = res.json;

      // Override json method to validate response
      res.json = function(data) {
        try {
          // Validate response data
          const validatedData = responseSchema.parse(data);

          // Call original json method with validated data
          return originalJson.call(this, validatedData);
        } catch (error) {
          console.error('Response validation failed:', error);
          // Still send the response but log the error
          return originalJson.call(this, data);
        }
      };

      next();
    };
  }

  /**
   * Create the main route handler with mock/real switching
   * @param {Function} mockHandler - Mock implementation
   * @param {Function} realHandler - Real database implementation
   * @param {boolean} useMock - Whether to use mock implementation
   * @param {number} delay - Mock delay in milliseconds
   * @returns {Function} Express handler
   */
  createHandler(mockHandler, realHandler, useMock, delay) {
    return async (req, res, next) => {
      try {
        let result;

        if (useMock && mockHandler) {
          // Add delay for mock responses
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          // Call mock handler
          result = await mockHandler(req);
        } else if (realHandler) {
          // Create database instance with tenant context
          const db = DatabaseService;

          // Call real handler with database context
          result = await realHandler(req, db);
        } else {
          throw new Error('No handler provided for route');
        }

        // Send response
        res.json(result);
      } catch (error) {
        // Handle different types of errors
        if (error.message.includes('already exists')) {
          return res.status(409).json({
            error: 'Conflict',
            message: error.message
          });
        }

        if (error.message.includes('not found')) {
          return res.status(404).json({
            error: 'Not found',
            message: error.message
          });
        }

        if (error.message.includes('Invalid credentials') ||
            error.message.includes('Account suspended') ||
            error.message.includes('Premium required')) {
          return res.status(403).json({
            error: 'Forbidden',
            message: error.message
          });
        }

        // Default error response
        res.status(500).json({
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
      }
    };
  }

  /**
   * Process AutoCRUD route definitions (2025 Vision)
   * @param {Object} autoCrudDef - AutoCRUD definition
   * @param {string} basePath - Base path for routes
   */
  processAutoCrud(autoCrudDef, basePath = '') {
    const { resource, schema, capabilities, hooks = {} } = autoCrudDef;

    // Generate standard CRUD routes
    const routes = this.generateCrudRoutes(resource, schema, capabilities, hooks);

    // Process the generated routes
    this.processRoutes(routes, basePath);
  }

  /**
   * Generate CRUD routes from AutoCRUD definition
   * @param {string} resource - Resource name (plural)
   * @param {Object} schema - Zod schema
   * @param {Object} capabilities - CRUD capabilities
   * @param {Object} hooks - Lifecycle hooks
   * @returns {Array} Route definitions
   */
  generateCrudRoutes(resource, schema, capabilities, hooks) {
    const routes = [];

    // LIST - GET /resource
    if (capabilities.list) {
      routes.push({
        path: `/${resource}`,
        method: 'GET',
        capability: capabilities.list,
        schema: schema.array(),
        mock: () => {
          const items = MockDataService.findAll(resource);
          return items.length > 0 ? items : MockDataService.list(() => MockDataService[resource.slice(0, -1)](), 5);
        },
        real: async (req, db) => {
          if (hooks.beforeList) await hooks.beforeList(req);
          const result = await db.find(resource);
          if (hooks.afterList) await hooks.afterList(result, req);
          return result;
        }
      });
    }

    // CREATE - POST /resource
    if (capabilities.create) {
      routes.push({
        path: `/${resource}`,
        method: 'POST',
        capability: capabilities.create,
        schema: schema,
        requestSchema: { body: schema },
        mock: (req) => {
          const newItem = {
            id: crypto.randomUUID(),
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return MockDataService.persist(resource, newItem);
        },
        real: async (req, db) => {
          if (hooks.beforeCreate) await hooks.beforeCreate(req.body, req);
          const result = await db.insert(resource, req.body);
          if (hooks.afterCreate) await hooks.afterCreate(result, req);
          return result;
        }
      });
    }

    // READ - GET /resource/:id
    if (capabilities.read) {
      routes.push({
        path: `/${resource}/:id`,
        method: 'GET',
        capability: capabilities.read,
        schema: schema,
        mock: (req) => {
          const item = MockDataService.findById(resource, req.params.id);
          if (!item) throw new Error('Not found');
          return item;
        },
        real: async (req, db) => {
          if (hooks.beforeRead) await hooks.beforeRead(req.params.id, req);
          const result = await db.findOne(resource, { where: { id: req.params.id } });
          if (!result) throw new Error('Not found');
          if (hooks.afterRead) await hooks.afterRead(result, req);
          return result;
        }
      });
    }

    // UPDATE - PATCH /resource/:id
    if (capabilities.update) {
      routes.push({
        path: `/${resource}/:id`,
        method: 'PATCH',
        capability: capabilities.update,
        schema: schema,
        requestSchema: { body: schema.partial() },
        mock: (req) => {
          const existing = MockDataService.findById(resource, req.params.id);
          if (!existing) throw new Error('Not found');

          const updated = {
            ...existing,
            ...req.body,
            updatedAt: new Date().toISOString()
          };
          return MockDataService.persist(resource, updated);
        },
        real: async (req, db) => {
          if (hooks.beforeUpdate) await hooks.beforeUpdate(req.params.id, req.body, req);
          const result = await db.update(resource, req.body, { where: { id: req.params.id } });
          if (result.affectedRows === 0) throw new Error('Not found');
          if (hooks.afterUpdate) await hooks.afterUpdate(result, req);
          return result;
        }
      });
    }

    // DELETE - DELETE /resource/:id
    if (capabilities.delete) {
      routes.push({
        path: `/${resource}/:id`,
        method: 'DELETE',
        capability: capabilities.delete,
        schema: z.object({ message: z.string() }),
        mock: (req) => {
          const deleted = MockDataService.remove(resource, req.params.id);
          if (!deleted) throw new Error('Not found');
          return { message: 'Deleted successfully' };
        },
        real: async (req, db) => {
          if (hooks.beforeDelete) await hooks.beforeDelete(req.params.id, req);
          const result = await db.delete(resource, { where: { id: req.params.id } });
          if (result.affectedRows === 0) throw new Error('Not found');
          if (hooks.afterDelete) await hooks.afterDelete(result, req);
          return { message: 'Deleted successfully' };
        }
      });
    }

    return routes;
  }
}

module.exports = RouteProcessor;
