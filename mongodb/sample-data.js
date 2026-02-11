// Sample Data Script for Testing
// Run this script using: mongosh plaid-financcer < sample-data.js

use plaid-financcer;

print('==================================');
print('Inserting Sample Data');
print('==================================\n');

// Clear existing data (optional - comment out if you don't want to clear)
// db.accounts.deleteMany({});
// db.transactions.deleteMany({});
// db.syncconfigs.deleteMany({});
// print('✓ Existing data cleared\n');

// Insert sample sync configuration
const sampleSyncConfig = {
  itemId: 'sample_item_123',
  accessToken: 'access-sandbox-sample-token',
  institutionName: 'Sample Bank',
  isActive: true,
  cursor: null,
  lastSyncedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

try {
  db.syncconfigs.insertOne(sampleSyncConfig);
  print('✓ Sample sync configuration inserted');
} catch (e) {
  print('⚠ Sync config already exists or error:', e.message);
}

// Insert sample accounts
const sampleAccounts = [
  {
    accountId: 'acc_checking_001',
    itemId: 'sample_item_123',
    name: 'Plaid Checking',
    officialName: 'Plaid Gold Standard 0% Interest Checking',
    type: 'depository',
    subtype: 'checking',
    mask: '0000',
    email: 'user@example.com',
    receiveEmailSummary: true,
    balances: {
      available: 100.50,
      current: 110.75,
      limit: null,
      isoCurrencyCode: 'USD',
      unofficialCurrencyCode: null
    },
    isActive: true,
    lastSyncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    accountId: 'acc_savings_001',
    itemId: 'sample_item_123',
    name: 'Plaid Saving',
    officialName: 'Plaid Silver Standard 0.1% Interest Saving',
    type: 'depository',
    subtype: 'savings',
    mask: '1111',
    email: 'savings@example.com',
    receiveEmailSummary: true,
    balances: {
      available: 210.00,
      current: 210.00,
      limit: null,
      isoCurrencyCode: 'USD',
      unofficialCurrencyCode: null
    },
    isActive: true,
    lastSyncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    accountId: 'acc_credit_001',
    itemId: 'sample_item_123',
    name: 'Plaid Credit Card',
    officialName: 'Plaid Diamond 12.5% APR Interest Credit Card',
    type: 'credit',
    subtype: 'credit card',
    mask: '3333',
    email: 'credit@example.com',
    receiveEmailSummary: false,
    balances: {
      available: 410.00,
      current: 590.00,
      limit: 1000.00,
      isoCurrencyCode: 'USD',
      unofficialCurrencyCode: null
    },
    isActive: true,
    lastSyncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  db.accounts.insertMany(sampleAccounts);
  print('✓ Sample accounts inserted (3 accounts)');
} catch (e) {
  print('⚠ Accounts already exist or error:', e.message);
}

// Insert sample transactions
const sampleTransactions = [
  {
    transactionId: 'txn_001',
    accountId: 'acc_checking_001',
    amount: 25.50,
    isoCurrencyCode: 'USD',
    unofficialCurrencyCode: null,
    category: ['Food and Drink', 'Restaurants'],
    categoryId: '13005000',
    date: new Date('2024-01-15'),
    authorizedDate: new Date('2024-01-15'),
    name: 'Starbucks',
    merchantName: 'Starbucks',
    pending: false,
    paymentChannel: 'in store',
    location: {
      address: '123 Main St',
      city: 'San Francisco',
      region: 'CA',
      postalCode: '94101',
      country: 'US',
      lat: 37.7749,
      lon: -122.4194
    },
    transactionType: 'place',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    transactionId: 'txn_002',
    accountId: 'acc_checking_001',
    amount: 12.99,
    isoCurrencyCode: 'USD',
    unofficialCurrencyCode: null,
    category: ['Shops', 'Digital Purchase'],
    categoryId: '19019000',
    date: new Date('2024-01-14'),
    authorizedDate: new Date('2024-01-14'),
    name: 'Netflix Subscription',
    merchantName: 'Netflix',
    pending: false,
    paymentChannel: 'online',
    transactionType: 'digital',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    transactionId: 'txn_003',
    accountId: 'acc_credit_001',
    amount: 150.00,
    isoCurrencyCode: 'USD',
    unofficialCurrencyCode: null,
    category: ['Shops', 'Clothing and Accessories'],
    categoryId: '19012000',
    date: new Date('2024-01-13'),
    authorizedDate: new Date('2024-01-13'),
    name: 'Amazon',
    merchantName: 'Amazon',
    pending: false,
    paymentChannel: 'online',
    transactionType: 'place',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    transactionId: 'txn_004',
    accountId: 'acc_checking_001',
    amount: -1500.00,
    isoCurrencyCode: 'USD',
    unofficialCurrencyCode: null,
    category: ['Transfer', 'Deposit'],
    categoryId: '21001000',
    date: new Date('2024-01-01'),
    authorizedDate: new Date('2024-01-01'),
    name: 'Direct Deposit - Salary',
    merchantName: null,
    pending: false,
    paymentChannel: 'other',
    transactionType: 'special',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    transactionId: 'txn_005',
    accountId: 'acc_checking_001',
    amount: 85.23,
    isoCurrencyCode: 'USD',
    unofficialCurrencyCode: null,
    category: ['Shops', 'Supermarkets and Groceries'],
    categoryId: '19047000',
    date: new Date('2024-01-12'),
    authorizedDate: new Date('2024-01-12'),
    name: 'Whole Foods',
    merchantName: 'Whole Foods Market',
    pending: true,
    paymentChannel: 'in store',
    location: {
      address: '456 Market St',
      city: 'San Francisco',
      region: 'CA',
      postalCode: '94102',
      country: 'US',
      lat: 37.7849,
      lon: -122.4094
    },
    transactionType: 'place',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  db.transactions.insertMany(sampleTransactions);
  print('✓ Sample transactions inserted (5 transactions)');
} catch (e) {
  print('⚠ Transactions already exist or error:', e.message);
}

print('\n==================================');
print('Sample Data Insertion Complete!');
print('==================================\n');

print('Summary:');
print('  - 1 sync configuration');
print('  - 3 accounts (checking, savings, credit card)');
print('  - 5 transactions (including 1 pending)\n');

print('You can now test the API endpoints:');
print('  - GET http://localhost:3000/api/accounts');
print('  - GET http://localhost:3000/api/transactions');
print('  - GET http://localhost:3000/api/scheduler/configs\n');
