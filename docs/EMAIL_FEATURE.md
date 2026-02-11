# Email Feature - Daily Transaction Summary

This document explains how the daily email transaction summary feature works.

## Overview

The application sends automated daily email summaries of transactions to account holders. Emails are sent at midnight (00:00) and include all transactions from the previous day.

## Features

- **Automated Daily Emails**: Sent at midnight every day
- **Grouped by Category**: Transactions are organized by category for easy review
- **Beautiful HTML Template**: Professional, responsive email design
- **Account-Specific**: Each account receives its own summary
- **Opt-in/Opt-out**: Accounts can be configured to receive or skip emails
- **Manual Testing**: Test endpoint to send emails on-demand

## Configuration

### Environment Variables

Add these to your [.env](.env) file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM=Plaid Financcer <noreply@example.com>

# Email Features
EMAIL_DAILY_SUMMARY_ENABLED=true
```

### Common SMTP Providers

#### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```
**Note**: Use [App Passwords](https://support.google.com/accounts/answer/185833) for Gmail, not your regular password.

#### Outlook/Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

## Account Configuration

Each account needs to have an email address configured to receive summaries.

### Account Schema Fields

- `email`: Email address to send summaries to
- `receiveEmailSummary`: Boolean flag to enable/disable emails (default: `true`)

### Setting Email for an Account

You can set the email when creating or updating accounts:

```javascript
// Via MongoDB
db.accounts.updateOne(
  { accountId: "acc_checking_001" },
  {
    $set: {
      email: "user@example.com",
      receiveEmailSummary: true
    }
  }
);
```

Or update via application code:
```typescript
await accountService.upsertAccount({
  accountId: "acc_checking_001",
  email: "user@example.com",
  receiveEmailSummary: true,
  // ... other account fields
});
```

## Scheduler Configuration

The email scheduler runs automatically at midnight:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async sendDailyTransactionSummary() {
  // Sends emails to all eligible accounts
}
```

### Eligible Accounts

An account receives daily emails if ALL of these conditions are met:
1. `email` field is set and not empty
2. `receiveEmailSummary` is `true`
3. `isActive` is `true`

## Email Content

### Subject Line
```
Daily Transaction Summary - [Month Day, Year]
```
Example: `Daily Transaction Summary - January 15, 2024`

### Email Sections

1. **Header**
   - Account name
   - Account mask (last 4 digits)
   - Date of transactions

2. **Summary Box**
   - Total number of transactions
   - Total amount spent
   - Number of categories

3. **Transactions by Category**
   - Grouped by primary category
   - Category subtotals
   - Sorted by total amount (highest first)

4. **Individual Transactions**
   - Transaction name
   - Merchant name (if available)
   - Amount (color-coded: red for spending, green for income)
   - Date and time
   - Pending badge (if applicable)

### Example Email Content

```
💳 Daily Transaction Summary

Plaid Checking (****0000)
Monday, January 15, 2024

┌─────────────────────────────┐
│ Total Transactions: 5       │
│ Total Amount: $273.72       │
│ Categories: 3               │
└─────────────────────────────┘

Food and Drink                    $110.73
  ├─ Starbucks
  │  🏪 Starbucks
  │  📅 Jan 15 at 8:30 AM        $25.50
  └─ Whole Foods
     🏪 Whole Foods Market
     📅 Jan 15 at 6:45 PM        $85.23 [PENDING]

Shops                             $150.00
  └─ Amazon
     🏪 Amazon
     📅 Jan 14 at 3:20 PM        $150.00

Transfer                          -$1500.00
  └─ Direct Deposit - Salary
     📅 Jan 1 at 12:00 AM        +$1500.00
```

## Testing

### Manual Test Email

You can send a test email to any account:

```bash
POST http://localhost:3000/api/scheduler/test-email/{accountId}
```

Example:
```bash
curl -X POST http://localhost:3000/api/scheduler/test-email/acc_checking_001
```

Response:
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

### Prerequisites for Testing
1. Account must exist in database
2. Account must have `email` field set
3. SMTP must be properly configured
4. Account should have some transactions from yesterday

## Troubleshooting

### Email Not Sending

**Check 1: Feature Enabled**
```env
EMAIL_DAILY_SUMMARY_ENABLED=true
```

**Check 2: SMTP Configuration**
Test the connection:
```typescript
// The email service automatically verifies connection on startup
// Check the application logs for:
// "Email service initialized with SMTP host: smtp.example.com"
```

**Check 3: Account Configuration**
Verify account has email:
```javascript
db.accounts.find({
  email: { $exists: true, $ne: "" },
  receiveEmailSummary: true,
  isActive: true
});
```

**Check 4: Transactions Exist**
Verify there are transactions from yesterday:
```javascript
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(0, 0, 0, 0);

db.transactions.find({
  accountId: "your_account_id",
  date: { $gte: yesterday }
}).count();
```

### Common SMTP Errors

#### Authentication Failed
- Check username and password
- For Gmail, use App Password
- Verify SMTP credentials in `.env`

#### Connection Timeout
- Check `SMTP_HOST` and `SMTP_PORT`
- Verify firewall isn't blocking SMTP ports
- Try different ports (587, 465, 25)

#### TLS/SSL Errors
- Set `SMTP_SECURE=false` for port 587
- Set `SMTP_SECURE=true` for port 465

## Logs

The email scheduler logs important events:

```
[EmailSchedulerService] Starting daily transaction summary email job
[EmailSchedulerService] Found 3 accounts to send summaries to
[EmailSchedulerService] Processing account: acc_checking_001 (user@example.com)
[EmailSchedulerService] Found 5 transactions for account acc_checking_001
[EmailService] Email sent successfully to user@example.com: <message-id>
```

Monitor these logs to ensure emails are being sent properly.

## Customization

### Changing Email Schedule

Edit [email-scheduler.service.ts](../src/scheduler/email-scheduler.service.ts):

```typescript
// Current: Midnight
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)

// Example: 8 AM every day
@Cron('0 8 * * *')

// Example: 6 PM every day
@Cron('0 18 * * *')

// Example: Every Monday at 9 AM
@Cron('0 9 * * 1')
```

### Customizing Email Template

The email template is in [transaction-summary.template.ts](../src/email/templates/transaction-summary.template.ts).

You can modify:
- **Styles**: Update the `<style>` section
- **Layout**: Modify the HTML structure
- **Colors**: Change color codes in CSS
- **Content**: Add or remove sections

### Adding More Email Types

Create new template files following the same pattern:
1. Create template file: `src/email/templates/your-template.template.ts`
2. Export a class with a `generate()` method
3. Return HTML string
4. Use in your scheduler or service

## API Endpoints

### Test Email
```
POST /api/scheduler/test-email/:accountId
```

Sends a test email for the specified account.

**Parameters:**
- `accountId`: The account ID to send test email for

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

## Security Considerations

1. **Never commit `.env` file** - Contains SMTP credentials
2. **Use environment variables** - Don't hardcode passwords
3. **App Passwords for Gmail** - More secure than regular passwords
4. **SMTP over TLS** - Use secure connections
5. **Rate Limiting** - Consider adding rate limits for manual test emails

## Performance

- Emails are sent sequentially, one account at a time
- For large numbers of accounts, consider:
  - Background job queue (Bull, BullMQ)
  - Batch email sending
  - Rate limiting to prevent SMTP throttling

## Dependencies

- `nodemailer`: ^6.9.8
- `@types/nodemailer`: ^6.4.14

Install with:
```bash
yarn add nodemailer
yarn add -D @types/nodemailer
```

## Next Steps

1. Configure SMTP settings in `.env`
2. Add email addresses to accounts
3. Run `yarn install` to install nodemailer
4. Test with manual endpoint
5. Wait for midnight or adjust cron schedule
6. Monitor logs for successful sends
