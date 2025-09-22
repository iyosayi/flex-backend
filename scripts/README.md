# Database Seeding Scripts

## Overview
This directory contains database seeding scripts for populating the development database with mock data.

## Available Scripts

### seed-database.ts
Seeds the database with properties and reviews from the mock data files.

**Features:**
- ✅ Clears existing data before seeding
- ✅ Bulk inserts for optimal performance
- ✅ Proper ObjectId handling for relationships
- ✅ Data integrity verification
- ✅ Comprehensive error handling and logging

**Usage:**
```bash
# Run the seeding script
npm run seed

# Or run directly with ts-node
npx ts-node -r tsconfig-paths/register scripts/seed-database.ts
```

**What it does:**
1. Connects to the database using NestJS application context
2. Clears existing properties and reviews
3. Inserts 4 properties from mock data
4. Inserts 5 reviews with proper property references
5. Verifies data integrity and relationships
6. Provides detailed logging throughout the process

**Output:**
- Properties: 4 (Paris, Marrakesh, Zurich locations)
- Reviews: 5 (with ratings 2-5, various channels: Airbnb, Booking, Direct, Google)
- All reviews properly linked to their respective properties

## Prerequisites
- MongoDB instance running
- Environment variables configured (see main project README)
- Dependencies installed (`npm install`)
