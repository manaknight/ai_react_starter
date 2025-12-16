# AI Assistance Rules for Creating New API Routes

## Route Creation Process

### 1. Database Schema Planning
When creating a new API endpoint, **always think of the table schema first**:
- Design the database table structure that will support the new endpoint
- Consider relationships, constraints, and indexes
- **Update the database schema first** before implementing the route

### 2. Middleware Consideration
After schema design, **think of middleware needed**:
- Authentication/authorization requirements
- Input validation middleware
- Rate limiting or other security middleware
- CORS configuration if needed
- Request logging or monitoring middleware

### 3. Capabilities and Role Policies
**Reference core/capabilities.js for role policies**:
- Check if the endpoint requires update permissions for specific roles
- Review or update role capabilities in `core/capabilities.js` as needed
- Ensure your route enforces these capabilities (e.g., via middleware or route guards)
- Avoid duplicating capabilities logic outside of `core/capabilities.js`

### 4. Route Implementation
**Make the API in routes folder**:
- Create the route file in the appropriate routes directory
- Implement the HTTP methods (GET, POST, PUT, DELETE, etc.)
- Add proper error handling and response formatting
- Include input validation and sanitization

### 5. Server Integration
**Add to server.js when done**:
- Import the new route module in server.js
- Mount the routes with appropriate path prefixes
- Ensure proper ordering of middleware and routes
- Test the integration

### 6. Testing Preparation
**Prep tests for those API**:
- Write unit tests for route handlers
- Create integration tests for the full API endpoints
- Include tests for error conditions and edge cases
- Add tests for middleware behavior
- Document API usage examples in tests

## Additional Best Practices

- Always follow RESTful conventions when possible
- Include proper Swagger documentation
- Add request/response logging for debugging
- Consider API versioning from the start /api/v1/<route>
- Plan for rate limiting and security measures
- Document any breaking changes or migrations needed
