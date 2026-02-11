// MongoDB Initialization Script for Plaid Financcer
// Run this script using: mongosh plaid-financcer < init-db.js
// Or connect to MongoDB and copy-paste the commands

// Switch to the database
use plaid-financcer;

print('==================================');
print('Initializing Plaid Financcer Database');
print('==================================\n');

// Create collections (Mongoose will create them automatically, but we can pre-create with validators)

// 1. Accounts Collection
db.createCollection('accounts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['accountId', 'itemId', 'name', 'type', 'subtype'],
      properties: {
        accountId: {
          bsonType: 'string',
          description: 'Plaid account ID - required'
        },
        itemId: {
          bsonType: 'string',
          description: 'Plaid item ID - required'
        },
        name: {
          bsonType: 'string',
          description: 'Account name - required'
        },
        officialName: {
          bsonType: 'string',
          description: 'Official account name'
        },
        type: {
          bsonType: 'string',
          description: 'Account type (depository, credit, etc.)'
        },
        subtype: {
          bsonType: 'string',
          description: 'Account subtype (checking, savings, etc.)'
        },
        mask: {
          bsonType: 'string',
          description: 'Last 4 digits of account number'
        },
        isActive: {
          bsonType: 'bool',
          description: 'Whether the account is active'
        }
      }
    }
  }
});
print('✓ Accounts collection created');

// 2. Transactions Collection
db.createCollection('transactions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['transactionId', 'accountId', 'amount', 'name', 'date'],
      properties: {
        transactionId: {
          bsonType: 'string',
          description: 'Plaid transaction ID - required'
        },
        accountId: {
          bsonType: 'string',
          description: 'Associated account ID - required'
        },
        amount: {
          bsonType: 'number',
          description: 'Transaction amount - required'
        },
        name: {
          bsonType: 'string',
          description: 'Transaction name - required'
        },
        date: {
          bsonType: 'date',
          description: 'Transaction date - required'
        },
        pending: {
          bsonType: 'bool',
          description: 'Whether transaction is pending'
        }
      }
    }
  }
});
print('✓ Transactions collection created');

// 3. Sync Configurations Collection
db.createCollection('syncconfigs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['itemId', 'accessToken'],
      properties: {
        itemId: {
          bsonType: 'string',
          description: 'Plaid item ID - required'
        },
        accessToken: {
          bsonType: 'string',
          description: 'Plaid access token - required'
        },
        cursor: {
          bsonType: 'string',
          description: 'Transaction sync cursor'
        },
        isActive: {
          bsonType: 'bool',
          description: 'Whether sync is active'
        },
        institutionName: {
          bsonType: 'string',
          description: 'Financial institution name'
        }
      }
    }
  }
});
print('✓ Sync configs collection created\n');

print('==================================');
print('Creating Indexes for Performance');
print('==================================\n');

// Create indexes for accounts
db.accounts.createIndex({ accountId: 1 }, { unique: true, name: 'accountId_unique' });
db.accounts.createIndex({ itemId: 1 }, { name: 'itemId_index' });
db.accounts.createIndex({ isActive: 1 }, { name: 'isActive_index' });
db.accounts.createIndex({ lastSyncedAt: -1 }, { name: 'lastSyncedAt_desc' });
print('✓ Account indexes created');

// Create indexes for transactions
db.transactions.createIndex({ transactionId: 1 }, { unique: true, name: 'transactionId_unique' });
db.transactions.createIndex({ accountId: 1 }, { name: 'accountId_index' });
db.transactions.createIndex({ date: -1 }, { name: 'date_desc' });
db.transactions.createIndex({ accountId: 1, date: -1 }, { name: 'accountId_date_compound' });
db.transactions.createIndex({ pending: 1 }, { name: 'pending_index' });
db.transactions.createIndex({ category: 1 }, { name: 'category_index' });
db.transactions.createIndex({ merchantName: 1 }, { name: 'merchantName_index' });
print('✓ Transaction indexes created');

// Create indexes for sync configs
db.syncconfigs.createIndex({ itemId: 1 }, { unique: true, name: 'itemId_unique' });
db.syncconfigs.createIndex({ isActive: 1 }, { name: 'isActive_index' });
db.syncconfigs.createIndex({ lastSyncedAt: -1 }, { name: 'lastSyncedAt_desc' });
print('✓ Sync config indexes created\n');

print('==================================');
print('Database Setup Complete!');
print('==================================\n');

print('Collections created:');
print('  - accounts');
print('  - transactions');
print('  - syncconfigs\n');

print('Next steps:');
print('  1. Update your .env file with MongoDB connection string');
print('  2. Add your Plaid API credentials to .env');
print('  3. Run: yarn install');
print('  4. Run: yarn start:dev');
print('  5. Add sync configuration via POST /api/scheduler/configs\n');
