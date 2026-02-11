// Common MongoDB Queries for Plaid Financcer
// Use these queries in mongosh or MongoDB Compass

use plaid-financcer;

print('==================================');
print('Common MongoDB Queries');
print('==================================\n');

// ==========================================
// ACCOUNTS QUERIES
// ==========================================

print('--- ACCOUNTS QUERIES ---\n');

// Get all accounts
print('1. Get all accounts:');
print('db.accounts.find().pretty()\n');

// Get active accounts only
print('2. Get active accounts:');
print('db.accounts.find({ isActive: true }).pretty()\n');

// Get accounts by type
print('3. Get checking accounts:');
print('db.accounts.find({ subtype: "checking" }).pretty()\n');

// Get accounts by item ID
print('4. Get accounts for a specific Plaid item:');
print('db.accounts.find({ itemId: "your_item_id" }).pretty()\n');

// Get account with balance information
print('5. Get accounts with available balance > $100:');
print('db.accounts.find({ "balances.available": { $gt: 100 } }).pretty()\n');

// Count accounts by type
print('6. Count accounts by type:');
print('db.accounts.aggregate([');
print('  { $group: { _id: "$type", count: { $sum: 1 } } }');
print('])\n');

// ==========================================
// TRANSACTIONS QUERIES
// ==========================================

print('--- TRANSACTIONS QUERIES ---\n');

// Get all transactions
print('7. Get all transactions (sorted by date desc):');
print('db.transactions.find().sort({ date: -1 }).pretty()\n');

// Get transactions for specific account
print('8. Get transactions for specific account:');
print('db.transactions.find({ accountId: "acc_checking_001" }).sort({ date: -1 }).pretty()\n');

// Get pending transactions
print('9. Get pending transactions:');
print('db.transactions.find({ pending: true }).pretty()\n');

// Get transactions by date range
print('10. Get transactions in date range:');
print('db.transactions.find({');
print('  date: {');
print('    $gte: new Date("2024-01-01"),');
print('    $lte: new Date("2024-01-31")');
print('  }');
print('}).sort({ date: -1 }).pretty()\n');

// Get transactions by category
print('11. Get food/restaurant transactions:');
print('db.transactions.find({ category: "Food and Drink" }).pretty()\n');

// Get transactions by amount range
print('12. Get transactions over $100:');
print('db.transactions.find({ amount: { $gt: 100 } }).sort({ amount: -1 }).pretty()\n');

// Get transactions by merchant
print('13. Get transactions from specific merchant:');
print('db.transactions.find({ merchantName: "Starbucks" }).pretty()\n');

// ==========================================
// AGGREGATION QUERIES
// ==========================================

print('--- AGGREGATION QUERIES ---\n');

// Total spending by account
print('14. Total spending by account:');
print('db.transactions.aggregate([');
print('  { $match: { amount: { $gt: 0 } } },');
print('  { $group: {');
print('    _id: "$accountId",');
print('    totalSpent: { $sum: "$amount" },');
print('    transactionCount: { $sum: 1 }');
print('  } }');
print('])\n');

// Total spending by category
print('15. Total spending by category:');
print('db.transactions.aggregate([');
print('  { $match: { amount: { $gt: 0 } } },');
print('  { $unwind: "$category" },');
print('  { $group: {');
print('    _id: "$category",');
print('    totalSpent: { $sum: "$amount" },');
print('    count: { $sum: 1 }');
print('  } },');
print('  { $sort: { totalSpent: -1 } }');
print('])\n');

// Monthly spending summary
print('16. Monthly spending summary:');
print('db.transactions.aggregate([');
print('  { $match: { amount: { $gt: 0 } } },');
print('  { $group: {');
print('    _id: {');
print('      year: { $year: "$date" },');
print('      month: { $month: "$date" }');
print('    },');
print('    totalSpent: { $sum: "$amount" },');
print('    transactionCount: { $sum: 1 },');
print('    avgTransaction: { $avg: "$amount" }');
print('  } },');
print('  { $sort: { "_id.year": -1, "_id.month": -1 } }');
print('])\n');

// Top merchants by spending
print('17. Top 10 merchants by spending:');
print('db.transactions.aggregate([');
print('  { $match: { amount: { $gt: 0 }, merchantName: { $ne: null } } },');
print('  { $group: {');
print('    _id: "$merchantName",');
print('    totalSpent: { $sum: "$amount" },');
print('    transactionCount: { $sum: 1 }');
print('  } },');
print('  { $sort: { totalSpent: -1 } },');
print('  { $limit: 10 }');
print('])\n');

// Average transaction amount by payment channel
print('18. Average transaction by payment channel:');
print('db.transactions.aggregate([');
print('  { $match: { amount: { $gt: 0 } } },');
print('  { $group: {');
print('    _id: "$paymentChannel",');
print('    avgAmount: { $avg: "$amount" },');
print('    count: { $sum: 1 }');
print('  } }');
print('])\n');

// ==========================================
// SYNC CONFIG QUERIES
// ==========================================

print('--- SYNC CONFIG QUERIES ---\n');

// Get all sync configurations
print('19. Get all sync configurations:');
print('db.syncconfigs.find().pretty()\n');

// Get active sync configs
print('20. Get active sync configurations:');
print('db.syncconfigs.find({ isActive: true }).pretty()\n');

// Get sync configs that need attention (not synced in last 2 hours)
print('21. Get sync configs not synced recently:');
print('db.syncconfigs.find({');
print('  lastSyncedAt: { $lt: new Date(Date.now() - 2*60*60*1000) }');
print('}).pretty()\n');

// ==========================================
// MAINTENANCE QUERIES
// ==========================================

print('--- MAINTENANCE QUERIES ---\n');

// Delete old transactions (older than 2 years)
print('22. Delete old transactions (dry run - count only):');
print('db.transactions.countDocuments({');
print('  date: { $lt: new Date(Date.now() - 2*365*24*60*60*1000) }');
print('})\n');

// Update all inactive accounts
print('23. Mark old accounts as inactive:');
print('db.accounts.updateMany(');
print('  { lastSyncedAt: { $lt: new Date(Date.now() - 90*24*60*60*1000) } },');
print('  { $set: { isActive: false } }');
print(')\n');

// Get database statistics
print('24. Get collection statistics:');
print('db.stats()\n');
print('db.accounts.stats()\n');
print('db.transactions.stats()\n');

// ==========================================
// INDEX MANAGEMENT
// ==========================================

print('--- INDEX QUERIES ---\n');

// List all indexes
print('25. List all indexes:');
print('db.accounts.getIndexes()');
print('db.transactions.getIndexes()');
print('db.syncconfigs.getIndexes()\n');

print('==================================');
print('End of Common Queries');
print('==================================\n');
