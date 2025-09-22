# Configuration Setup

This directory contains the configuration setup for the NestJS application using `@nestjs/config`.

## Files

- `configuration.ts` - Configuration factory that loads environment variables
- `config.interface.ts` - TypeScript interfaces for type-safe configuration access
- `README.md` - This documentation file

## Usage

### In Services

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class YourService {
  constructor(private configService: ConfigService) {}

  someMethod() {
    // Access configuration values
    const port = this.configService.get<number>('port');
    const nodeEnv = this.configService.get<string>('nodeEnv');
    const mongodbUri = this.configService.get<string>('database.mongodbUri');
    
    // Use the values...
  }
}
```

### Environment Variables

Create a `.env` file in the root directory with your environment variables:

```env
# Application Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/flex

# Add your other environment variables here
# API_KEY=your_api_key_here
# JWT_SECRET=your_jwt_secret_here
```

### Adding New Configuration

1. Add the environment variable to your `.env` file
2. Update `configuration.ts` to include the new variable
3. Update `config.interface.ts` to add the type definition
4. Use `ConfigService` to access the value in your services

## Environment Files

- `.env` - Default environment file (not tracked in git)
- `.env.local` - Local overrides (not tracked in git, takes precedence over .env)
- `.env.example` - Example environment file (tracked in git)
- `.env.development` - Development-specific variables
- `.env.production` - Production-specific variables
- `.env.test` - Test-specific variables

## Production Behavior

In production (`NODE_ENV=production`):
- The application **ignores** `.env` files completely
- Environment variables must be set directly on the system/container
- Required environment variables are validated at startup
- If required variables are missing, the application will fail to start with a clear error message

### Required Environment Variables in Production
- `MONGODB_URI` - MongoDB connection string

### Setting Environment Variables in Production

**Docker:**
```dockerfile
ENV MONGODB_URI=mongodb://your-production-db:27017/flex
ENV PORT=3000
ENV NODE_ENV=production
```

**Kubernetes:**
```yaml
env:
  - name: MONGODB_URI
    value: "mongodb://your-production-db:27017/flex"
  - name: NODE_ENV
    value: "production"
```

**System Environment:**
```bash
export MONGODB_URI=mongodb://your-production-db:27017/flex
export NODE_ENV=production
export PORT=3000
```
