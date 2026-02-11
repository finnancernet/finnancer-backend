# MongoDB Scripts

This directory contains MongoDB scripts for initializing, managing, and querying the Plaid Financcer database.

## Prerequisites

- MongoDB installed and running (locally or remote)
- MongoDB Shell (`mongosh`) installed
- Database name: `plaid-financcer`

## Scripts Overview

### 1. init-db.js
**Purpose**: Initialize database with collections, validators, and indexes

**Usage**:
```bash
# Connect to MongoDB and run the script
mongosh plaid-financcer < mongodb/init-db.js

# Or run directly in mongosh
mongosh
use plaid-financcer
load('mongodb/init-db.js')
```

**What it does**:
- Creates `accounts` collection with schema validation
- Creates `transactions` collection with schema validation
- Creates `syncconfigs` collection with schema validation
- Creates performance indexes on all collections
- Sets up unique constraints

**Collections created**:
- `accounts` - Bank accounts from Plaid
- `transactions` - Transaction history
- `syncconfigs` - Plaid sync configurations with access tokens

### 2. sample-data.js
**Purpose**: Insert sample data for testing

**Usage**:
```bash
# Run the script
mongosh plaid-financcer < mongodb/sample-data.js
```

**What it includes**:
- 1 sample sync configuration
- 3 sample accounts (checking, savings, credit card)
- 5 sample transactions (various categories and types)

**Note**: Useful for testing API endpoints without needing real Plaid connections.

### 3. queries.js
**Purpose**: Reference guide for common MongoDB queries

**Usage**:
```bash
# Open the file and copy-paste queries into mongosh
mongosh plaid-financcer

# Then run any query from queries.js
```

**Query categories**:
- Account queries (filtering by type, balance, etc.)
- Transaction queries (date ranges, merchants, categories)
- Aggregation queries (spending summaries, top merchants)
- Sync configuration management
- Maintenance queries (cleanup, statistics)

## Quick Start

### Option 1: Fresh Setup
```bash
# 1. Initialize database
mongosh plaid-financcer < mongodb/init-db.js

# 2. (Optional) Add sample data for testing
mongosh plaid-financcer < mongodb/sample-data.js

# 3. Verify setup
mongosh plaid-financcer --eval "db.getCollectionNames()"
```

### Option 2: Using MongoDB Compass
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Create database: `plaid-financcer`
4. Copy and paste contents of `init-db.js` into Compass shell
5. Run the script

## Manual Collection Creation

If you prefer not to use the scripts, Mongoose will automatically create collections when the application first writes data. However, you'll miss out on:
- Schema validation
- Performance indexes
- Unique constraints

## Indexes Created

### Accounts
- `accountId` (unique)
- `itemId`
- `isActive`
- `lastSyncedAt` (descending)

### Transactions
- `transactionId` (unique)
- `accountId`
- `date` (descending)
- `accountId + date` (compound index)
- `pending`
- `category`
- `merchantName`

### Sync Configs
- `itemId` (unique)
- `isActive`
- `lastSyncedAt` (descending)

## Common Operations

### Check Collections
```javascript
use plaid-financcer
show collections
```

### View Collection Stats
```javascript
db.accounts.stats()
db.transactions.stats()
db.syncconfigs.stats()
```

### Count Documents
```javascript
db.accounts.countDocuments()
db.transactions.countDocuments()
db.syncconfigs.countDocuments()
```

### Drop Collections (Careful!)
```javascript
// Only if you want to start fresh
db.accounts.drop()
db.transactions.drop()
db.syncconfigs.drop()
```

### Backup Database
```bash
# Backup entire database
mongodump --db=plaid-financcer --out=/path/to/backup

# Restore database
mongorestore --db=plaid-financcer /path/to/backup/plaid-financcer
```

## Troubleshooting

### Connection Issues
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# If connection fails, start MongoDB
# Windows:
net start MongoDB

# macOS/Linux:
sudo systemctl start mongod
```

### Permission Issues
If you encounter permission errors, ensure your MongoDB user has proper permissions:
```javascript
use admin
db.createUser({
  user: "plaid_user",
  pwd: "your_password",
  roles: [{ role: "readWrite", db: "plaid-financcer" }]
})
```

### Index Issues
If indexes aren't created properly:
```javascript
// Drop and recreate indexes
db.accounts.dropIndexes()
db.transactions.dropIndexes()
db.syncconfigs.dropIndexes()

// Then re-run init-db.js
```

## Environment Variables

Make sure your `.env` file has the correct MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/plaid-financcer

# Or for authenticated connection:
MONGODB_URI=mongodb://username:password@localhost:27017/plaid-financcer

# Or for MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/plaid-financcer
```

## Next Steps

After running the initialization scripts:

1. Update `.env` with your MongoDB URI
2. Add Plaid API credentials to `.env`
3. Run `yarn install`
4. Run `yarn start:dev`
5. Add sync configuration via API: `POST /api/scheduler/configs`

## Notes

- **Mongoose Auto-Creation**: Even without these scripts, Mongoose will create collections automatically. These scripts provide better structure, validation, and performance.
- **Schema Validation**: MongoDB validators are complementary to Mongoose schemas - they provide database-level validation.
- **Indexes**: Critical for query performance, especially as data grows.
- **Sample Data**: Safe to run multiple times - uses `insertOne`/`insertMany` which will error if duplicates exist.
