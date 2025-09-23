# Flex API

A clean and simple NestJS API for property and review management with Docker support.

## Features

- 🏠 **Properties Management** - List and get property details
- ⭐ **Reviews Management** - Handle reviews with status updates
- 📊 **Overview Dashboard** - Property performance analytics
- 🐳 **Docker Support** - Easy setup with Docker Compose
- 🚀 **Clean Architecture** - Simplified, maintainable codebase

## API Endpoints

- `GET /api/properties` - List all properties
- `GET /api/properties/:id` - Get property details
- `GET /api/reviews/hostaway` - Get reviews (Hostaway format)
- `PATCH /api/reviews/:id/status` - Update review status
- `GET /api/overview` - Get overview analytics

## Quick Start with Docker (Recommended)

The easiest way to get started is using Docker Compose:

```bash
# Start the API in production mode
docker-compose up -d

# Or start in development mode with hot reload
docker-compose --profile dev up flex-api-dev
```

The API will be available at `http://localhost:4000`

## Manual Installation

If you prefer to run without Docker:

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Start in production mode
npm run build
npm run start:prod
```

## Docker Commands

### Using Make (Recommended)
```bash
# Start in production mode
make up

# Start in development mode with hot reload
make dev

# View logs
make logs

# Stop containers
make down

# Rebuild and start
make rebuild

# Show all available commands
make help
```

### Using Docker Compose directly
```bash
# Build and start production container
docker-compose up -d

# Start development container with hot reload
docker-compose --profile dev up flex-api-dev

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild containers
docker-compose up --build
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:cov
```

## Project Structure

```
src/
├── modules/
│   ├── properties/          # Property management
│   ├── reviews/            # Review management  
│   └── overview/           # Analytics dashboard
├── config/                 # Configuration
└── common/                 # Shared utilities
```

## Data Sources

- **Properties**: Mock data from `src/modules/properties/mock/mock-properties.ts`
- **Reviews**: Static data from `data/static-reviews.json`

## License

MIT Licensed
