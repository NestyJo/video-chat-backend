# Agora Backend API

A robust Node.js backend application built with TypeScript, Express.js, and MongoDB.

## Features

- 🚀 **TypeScript** - Full TypeScript support with strict type checking
- 🛡️ **Security** - Helmet, CORS, rate limiting, and JWT authentication
- 📊 **Database** - MongoDB with Mongoose ODM
- 🔐 **Authentication** - JWT-based authentication and authorization
- ✅ **Validation** - Request validation with Joi
- 🧪 **Testing** - Jest testing framework setup
- 📝 **Logging** - Morgan HTTP request logger
- 🔧 **Development** - Hot reload with ts-node-dev
- 📋 **Code Quality** - ESLint configuration

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/agora-backend
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Setup MongoDB**
   
   **Quick Start with Docker (Recommended):**
   ```bash
   docker run -d -p 27017:27017 --name agora-mongodb mongo:latest
   ```
   
   **Check MongoDB Status:**
   ```bash
   npm run check-db
   ```
   
   **For other setup options, see:** `scripts/setup-mongodb.md`

5. **Seed Database (Optional)**
   
   **Create admin user:**
   ```bash
   npm run seed
   ```
   
   **Create admin + sample users:**
   ```bash
   npm run seed:samples
   ```
   
   **Default admin credentials:**
   - Username: `admin`
   - Email: `admin@agora.com`
   - Password: `Admin123!@#`
   
   **For detailed seeding guide, see:** `docs/seeding.md`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run type-check` - Check TypeScript types
- `npm run type-check:watch` - Check TypeScript types in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run check-db` - Check MongoDB connection status
- `npm run setup-db` - Show MongoDB setup instructions
- `npm run seed` - Seed admin user to database
- `npm run seed:admin` - Seed admin user only
- `npm run seed:samples` - Seed admin + sample users
- `npm run seed:clear` - Clear all users and reseed
- `npm run seed:help` - Show seeding help

## API Endpoints

### Health Check
- `GET /api/health` - Health check endpoint
- `GET /api/health/ready` - Readiness check endpoint

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (Protected)
- `PUT /api/auth/profile` - Update current user profile (Protected)

### Users
- `GET /api/users` - Get all users with pagination (Protected)
- `GET /api/users/:id` - Get user by ID (Protected)
- `GET /api/users/username/:username` - Get user by username (Protected)
- `PUT /api/users/:id/deactivate` - Deactivate user (Admin only)
- `PUT /api/users/:id/activate` - Activate user (Admin only)

## Architecture

This application follows a **layered architecture** with clear separation of concerns:

### 🏗️ **Layers**

1. **Controllers** (`src/controllers/`)
   - Thin layer that handles HTTP requests/responses
   - Input validation and sanitization
   - Delegates business logic to services
   - Returns formatted responses

2. **Services** (`src/services/`)
   - Contains all business logic
   - Handles data processing and validation
   - Orchestrates interactions between models
   - Reusable across different controllers

3. **Models** (`src/models/`)
   - Database schema definitions
   - Data validation rules
   - Database-specific logic (hooks, methods)
   - Direct database interactions

4. **Middleware** (`src/middleware/`)
   - Cross-cutting concerns (auth, logging, etc.)
   - Request/response processing
   - Error handling

### 🔄 **Data Flow**

```
Request → Routes → Middleware → Controllers → Services → Models → Database
                                     ↓
Response ← Controllers ← Services ← Models ← Database
```

### ✅ **Benefits**

- **Separation of Concerns**: Each layer has a single responsibility
- **Testability**: Services can be tested independently
- **Reusability**: Business logic can be reused across different endpoints
- **Maintainability**: Changes in one layer don't affect others
- **Scalability**: Easy to add new features and modify existing ones

## Project Structure

```
src/
├── config/          # Configuration files
│   └── database.ts  # Database connection
├── controllers/     # Route controllers (thin layer)
│   ├── authController.ts
│   ├── userController.ts
│   └── healthController.ts
├── services/        # Business logic layer
│   ├── baseService.ts    # Base service with common CRUD
│   ├── authService.ts    # Authentication business logic
│   ├── userService.ts    # User management business logic
│   └── healthService.ts  # Health check business logic
├── models/          # Database models (data layer)
│   └── User.ts
├── middleware/      # Custom middleware
│   ├── auth.ts      # Authentication middleware
│   ├── errorHandler.ts
│   ├── notFoundHandler.ts
│   └── rateLimiter.ts
├── routes/          # Route definitions
│   ├── auth.ts
│   ├── user.ts
│   └── health.ts
├── types/           # TypeScript type definitions
│   ├── api.ts
│   └── express.d.ts
├── utils/           # Utility functions
│   ├── AppError.ts
│   ├── jwt.ts
│   └── validation.ts
├── seeders/         # Database seeding
│   ├── index.ts
│   ├── userSeeder.ts
│   └── config.ts
├── __tests__/       # Test files
│   ├── services/    # Service layer tests
│   └── *.test.ts
└── index.ts         # Application entry point
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables

## Validation

Request validation is handled by Joi schemas. Invalid requests return detailed error messages.

## Testing

Run the test suite:

```bash
npm test
```

Tests are located in the `src/__tests__` directory.

## Development

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **The server will start on http://localhost:3000**

3. **API documentation will be available at the health endpoint**

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/agora-backend` |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `CORS_ORIGIN` | CORS origin | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.