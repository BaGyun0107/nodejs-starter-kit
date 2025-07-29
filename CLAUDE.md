# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm start` (uses nodemon)
- **Lint code**: `npm run lint` (ESLint with --fix)
- **Pre-commit checks**: `npm run precommit` (runs lint-staged)

## Architecture Overview

This is a Node.js Express API server with a layered architecture following MVC pattern:

### Core Structure
- **Entry point**: `app.js` - Express server with comprehensive middleware setup
- **Routes**: `/routes/index.js` - Currently basic router setup mounting at `/api`
- **Configuration**: Environment-based config in `/config/config.js`
- **Database**: MySQL with Sequelize ORM, auto-generation via `orm.js`

### Middleware Layer (`/middlewares/`)
Handles cross-cutting concerns with single responsibility principle:
- Authentication: JWT token validation, payload decryption
- Common utilities: File uploads (Multer), image processing, field validation
- Security: Authorization checks, location lists, password mapping

### Service Layer (`/services/`)
Contains business logic following these principles:
- Encapsulates core business rules
- Independent modules with minimal coupling
- Dependency injection pattern for Repository/Utils/Validators
- Error propagation to Controller layer

### Repository Layer (`/repositories/`)
Data access abstraction:
- All database interactions centralized here
- Interface-based design for easy data source switching
- Comprehensive error handling with detailed logging
- Shared query logic modularized for reuse

### Validation Layer (`/validators/`)
Input validation using express-validator:
- `Required*.js` files for mandatory fields
- `Opt*.js` files for optional fields
- Centralized validation rules with clear error messages

### Utilities (`/utils/`)
Pure helper functions organized by domain:
- `auth/`: Authentication utilities (Korean-English mapping)
- `common/`: General utilities (encryption, dates, socket.io, UUID, etc.)
- Stateless functions with minimal side effects

## Environment Configuration

- Uses environment-specific `.env` files (`.env.local`, `.env.development`, etc.)
- Database config supports local/development/test/production environments
- CORS configured with environment-specific allowed origins

## Key Dependencies

- **Express**: Web framework with comprehensive middleware stack
- **Sequelize**: MySQL ORM with auto-generation capabilities
- **Security**: Helmet, XSS-clean, CORS with strict origin validation
- **Authentication**: JWT (jsonwebtoken + jose), bcrypt for hashing
- **File handling**: Multer for uploads, Sharp for image processing
- **Logging**: Morgan with custom Korean timezone formatting
- **Process management**: PM2 ecosystem config for clustering

## Code Style Configuration

### Prettier Settings
- Single quotes, no trailing commas
- 80 character line width, 2 space tabs
- Semicolons required, bracket spacing enabled
- Auto line endings, always use arrow function parentheses

### ESLint Rules (Airbnb Base + Custom)
- **Ignored patterns**: `node_modules/`, `models/`, `app.js`
- **Console usage**: Allowed in development (`no-console: off`)
- **Variables**: No `var` keyword, prefer `const`, unused vars allowed
- **Functions**: Arrow functions must always have body braces
- **Comments**: Must have space after `//` or `/*`
- **Syntax**: camelCase not enforced, consistent returns required
- **Note**: Console logging should be removed in production builds

## Development Notes

- Server runs in cluster mode in production (8 instances via PM2)
- Comprehensive request/response logging with custom Morgan format
- Graceful shutdown handling for server and database connections
- Socket.io integration available (currently commented out)
- Environment-based error stack trace exposure