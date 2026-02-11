// Database Reset Script
// WARNING: This will delete ALL data in the database
// Use this only for development/testing purposes

use plaid-financcer;

print('==================================');
print('⚠️  DATABASE RESET SCRIPT');
print('==================================\n');

print('WARNING: This will delete ALL data!');
print('This includes:');
print('  - All accounts');
print('  - All transactions');
print('  - All sync configurations\n');

// Uncomment the line below to enable the reset
// If you want to use this script, remove the '//' from the next line
const ENABLE_RESET = false;

if (!ENABLE_RESET) {
  print('❌ Reset is DISABLED for safety.');
  print('To enable reset, edit this file and set ENABLE_RESET = true\n');
  print('Exiting without making changes...\n');
  quit();
}

print('Proceeding with database reset...\n');

// Drop all collections
try {
  db.accounts.drop();
  print('✓ Accounts collection dropped');
} catch (e) {
  print('⚠ Could not drop accounts:', e.message);
}

try {
  db.transactions.drop();
  print('✓ Transactions collection dropped');
} catch (e) {
  print('⚠ Could not drop transactions:', e.message);
}

try {
  db.syncconfigs.drop();
  print('✓ Sync configs collection dropped');
} catch (e) {
  print('⚠ Could not drop sync configs:', e.message);
}

print('\n==================================');
print('Database Reset Complete!');
print('==================================\n');

print('Next steps:');
print('1. Run init-db.js to recreate collections');
print('2. (Optional) Run sample-data.js to add test data');
print('3. Or start your application to let Mongoose create collections\n');

print('Commands:');
print('  mongosh plaid-financcer < mongodb/init-db.js');
print('  mongosh plaid-financcer < mongodb/sample-data.js\n');
