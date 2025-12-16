# M&A Club Backend

Express.js backend API for the M&A Club platform.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (Member, Admin, Support)
- **Database**: MySQL database with connection pooling
- **Security**: Helmet, CORS, rate limiting, input validation
- **API Structure**: RESTful API endpoints for all platform features
- **Middleware**: Authentication, role checking, premium feature access control

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MySQL database
- npm or yarn

### Installation

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

   Edit `.env` with your configuration:
   ```env
   PORT=3001
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=manda_club
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Set up the database:**
   - Create a MySQL database named `manda_club`
   - Run the SQL schema from `../requirements/mandasql.sql`

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Users (Admin/Support)
- `GET /api/users` - List users with pagination
- `PUT /api/users/:id` - Update user details

### Platform Settings (Admin)
- `GET /api/settings` - Get platform settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/jackpot/draw` - Trigger jackpot draw

### Jackpot
- `GET /api/jackpot` - Get jackpot information
- `POST /api/jackpot/enter` - Enter jackpot (premium only)

### Coupons
- `GET /api/coupons` - List available coupons
- `POST /api/coupons/apply` - Apply for application-based coupons
- `PUT /api/admin/coupons/:id` - Admin edit coupon

### Sponsors
- `GET /api/sponsors` - List sponsors
- `POST /api/sponsors/apply` - Submit sponsor application

### Advisory
- `GET /api/advisors` - List advisors
- `POST /api/advisory/requests` - Submit advisory request

### Fundraising (Premium)
- `POST /api/fundraising` - Submit fundraising request
- `GET /api/fundraising/:id/messages` - Get fundraising messages
- `POST /api/fundraising/:id/messages` - Send message

### Opportunities
- `GET /api/opportunities` - List opportunities
- `GET /api/opportunities/:id` - Get opportunity details (premium)
- `POST /api/opportunities/:id/nda` - Sign NDA
- `POST /api/opportunities/:id/proposals` - Submit proposal
- `GET /api/opportunities/:id/chat` - Get chat messages
- `POST /api/opportunities/:id/chat` - Send chat message

### Education
- `GET /api/education` - List education content

### Notifications
- `GET /api/notifications` - List user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Billing (Stripe)
- `GET /api/billing/subscription` - Get subscription info
- `POST /api/billing/checkout` - Create checkout session
- `POST /api/billing/cancel` - Cancel subscription

### Affiliate
- `GET /api/affiliate` - Get affiliate information
- `POST /api/affiliate/convert-to-jackpot` - Convert payout to jackpot entry

### Support Tickets
- `GET /api/support/tickets` - List support tickets
- `POST /api/support/tickets` - Create new ticket
- `GET /api/support/tickets/:id/messages` - Get ticket messages
- `POST /api/support/tickets/:id/messages` - Send message

## User Roles & Permissions

### Member (Free)
- Can view most content
- Cannot access premium features
- Can submit basic applications

### Member (Premium)
- Full access to all features
- Can enter jackpots, access opportunities, submit proposals
- Can access sensitive deal information (with NDA)

### Support
- Can view/edit all data except platform settings
- Cannot trigger jackpot draws
- Full access to support tickets

### Admin
- Full system control
- Can modify platform settings
- Can trigger jackpot draws
- Can manage all users and data

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection
├── middleware/
│   └── auth.js             # Authentication middleware
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── users.js            # User management
│   ├── settings.js         # Platform settings
│   ├── jackpot.js          # Jackpot system
│   ├── coupons.js          # Coupon management
│   ├── sponsors.js         # Sponsor applications
│   ├── advisory.js         # Advisory marketplace
│   ├── fundraising.js      # Fundraising requests
│   ├── opportunities.js    # M&A/Service opportunities
│   ├── education.js        # Education content
│   ├── notifications.js    # User notifications
│   ├── billing.js          # Stripe billing
│   ├── affiliate.js        # Affiliate system
│   └── support.js          # Support tickets
├── server.js               # Main application file
├── package.json            # Dependencies
├── env.example            # Environment template
└── README.md              # This file
```

## Environment Variables

See `env.example` for all required environment variables.

## Health Check

The API includes a health check endpoint:
```
GET /health
```

Returns server status, uptime, and timestamp.

## Contributing

1. Follow the existing code structure
2. Implement proper error handling
3. Add input validation for all endpoints
4. Update this README for any new features
5. Test your changes thoroughly
