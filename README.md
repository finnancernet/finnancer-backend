# Plaid Financcer 2

A NestJS application with MongoDB integration that automatically syncs bank account data and transactions from Plaid API on an hourly basis.

## Features

- **JWT Authentication**: Secure user authentication with JSON Web Tokens
- **User Management**: Complete user registration, login, and profile management
- **Automated Hourly Sync**: Scheduler runs every hour to fetch latest bank data and transactions
- **Daily Email Summaries**: Automated transaction summaries sent via email at midnight
- **Plaid Integration**: Full integration with Plaid API for accessing financial data
- **MongoDB Storage**: Persistent storage of users, accounts, and transactions
- **RESTful API**: Protected endpoints to query accounts and transactions
- **TypeScript**: Full type safety throughout the application
- **Beautiful Email Templates**: Professional HTML email templates with transaction grouping
- **User Data Isolation**: Each user only sees their own financial data

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── strategies/       # Passport strategies (JWT, Local)
│   ├── guards/           # Auth guards
│   ├── decorators/       # Custom decorators (CurrentUser)
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── auth.module.ts
├── user/                 # User management module
│   ├── schemas/          # User schema with password hashing
│   ├── user.service.ts
│   └── user.module.ts
├── account/              # Account module (linked to users)
│   ├── schemas/          # MongoDB schemas
│   ├── account.service.ts
│   ├── account.controller.ts
│   └── account.module.ts
├── transaction/          # Transaction module
│   ├── schemas/          # MongoDB schemas
│   ├── transaction.service.ts
│   ├── transaction.controller.ts
│   └── transaction.module.ts
├── email/                # Email service
│   ├── templates/        # Email templates
│   ├── email.service.ts
│   └── email.module.ts
├── plaid/               # Plaid service integration
│   ├── plaid.service.ts
│   └── plaid.module.ts
├── scheduler/           # Schedulers (hourly sync, daily emails)
│   ├── schemas/         # Sync configuration schemas
│   ├── scheduler.service.ts
│   ├── email-scheduler.service.ts
│   └── scheduler.module.ts
├── app.module.ts        # Main application module
└── main.ts             # Application entry point
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or remote instance)
- Plaid API credentials (Client ID and Secret)
- Yarn package manager

## Installation

1. Clone the repository
2. Install dependencies:

```bash
yarn install
```

3. Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
   - `MONGODB_URI`: Your MongoDB connection string
   - `PLAID_CLIENT_ID`: Your Plaid client ID
   - `PLAID_SECRET`: Your Plaid secret key
   - `PLAID_ENV`: Environment (sandbox, development, or production)

5. Set up MongoDB database (see MongoDB Setup section below)

## MongoDB Setup

The `mongodb/` directory contains scripts to initialize your database with proper collections, indexes, and sample data.

### Quick Setup (Recommended)

**Windows:**
```bash
mongodb\setup-db.bat
```

**macOS/Linux:**
```bash
chmod +x mongodb/setup-db.sh
./mongodb/setup-db.sh
```

### Manual Setup

```bash
# 1. Initialize database with collections and indexes
mongosh plaid-financcer < mongodb/init-db.js

# 2. (Optional) Load sample data for testing
mongosh plaid-financcer < mongodb/sample-data.js
```

### What Gets Created

- **Collections**: `accounts`, `transactions`, `syncconfigs`
- **Indexes**: Performance indexes on frequently queried fields
- **Validators**: Schema validation at database level
- **Sample Data**: 3 accounts and 5 transactions (if loaded)

For more details, see [mongodb/README.md](mongodb/README.md)

## Running the Application

### Development mode
```bash
yarn start:dev
```

### Production mode
```bash
yarn build
yarn start:prod
```

The application will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### Accounts

- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:accountId` - Get specific account
- `GET /api/accounts/item/:itemId` - Get accounts by Plaid item ID

### Transactions

- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:transactionId` - Get specific transaction
- `GET /api/transactions/account/:accountId` - Get transactions by account
- `GET /api/transactions/account/:accountId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get transactions by date range

### Scheduler

- `GET /api/scheduler/configs` - Get all sync configurations
- `POST /api/scheduler/configs` - Add new sync configuration
- `DELETE /api/scheduler/configs/:itemId` - Remove sync configuration
- `POST /api/scheduler/test-email/:accountId` - Send test transaction summary email

## Daily Email Summaries

The application automatically sends daily transaction summaries via email at midnight. Each account can opt-in to receive beautiful HTML emails with their previous day's transactions grouped by category.

### Features
- **Automated delivery** at midnight every day
- **Grouped by category** for easy review
- **Beautiful HTML template** with responsive design
- **Account-specific** summaries
- **Opt-in/opt-out** per account

### Setup
1. Configure SMTP settings in `.env` (see `.env.example`)
2. Add email addresses to accounts:
   ```javascript
   db.accounts.updateOne(
     { accountId: "acc_checking_001" },
     { $set: { email: "user@example.com", receiveEmailSummary: true } }
   );
   ```
3. Test with: `POST /api/scheduler/test-email/acc_checking_001`

For detailed configuration and troubleshooting, see [docs/EMAIL_FEATURE.md](docs/EMAIL_FEATURE.md)

## Setting Up Plaid Sync

To start syncing data from Plaid, you need to add a sync configuration with your Plaid access token:

```typescript
// Add this to your application initialization or create an endpoint
const schedulerService = app.get(SchedulerService);
await schedulerService.addSyncConfig(
  'your-item-id',
  'your-plaid-access-token',
  'Institution Name'
);
```

The scheduler will automatically start syncing data every hour once configured.

## How It Works

1. **Scheduler Service**: Runs every hour using NestJS Schedule module
2. **Plaid Service**: Fetches accounts and transactions from Plaid API
3. **Data Storage**: Automatically upserts (inserts or updates) data to MongoDB
4. **Transaction Sync**: Uses Plaid's transaction sync endpoint for efficient incremental updates
5. **Cursor Management**: Stores sync cursors to track the last sync position

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Application port | 3000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/plaid-financcer |
| PLAID_CLIENT_ID | Plaid client ID | - |
| PLAID_SECRET | Plaid secret key | - |
| PLAID_ENV | Plaid environment | sandbox |
| PLAID_API_VERSION | Plaid API version | 2020-09-14 |

## Development

### Run tests
```bash
yarn test
```

### Run tests with coverage
```bash
yarn test:cov
```

### Lint and format
```bash
yarn lint
yarn format
```

## Production Deployment Checklist

Before deploying to production, ensure you complete these critical security and configuration steps:

### 🔒 Security
- [ ] **Change JWT_SECRET** - Use a strong random 256-bit secret (min 32 characters)
  ```bash
  # Generate a secure secret
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] **Enable HTTPS/TLS** - Never run production without SSL
- [ ] **Update CORS_ORIGIN** - Set to your production domain(s) only
  ```env
  CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
  ```
- [ ] **Set NODE_ENV=production** - Enables production optimizations
- [ ] **Review Rate Limits** - Adjust based on expected traffic
- [ ] **Secure MongoDB** - Enable authentication and encryption at rest
- [ ] **Regular Security Audits** - Run `yarn audit` and fix vulnerabilities

### 📊 Monitoring & Logging
- [ ] **Set up application monitoring** - Datadog, New Relic, or similar
- [ ] **Configure error tracking** - Sentry, Rollbar, or similar
- [ ] **Enable security logging** - Track failed logins, rate limit violations
- [ ] **Set up alerts** - For critical errors and security events
- [ ] **Monitor rate limit violations** - Track and analyze patterns

### 🗄️ Database
- [ ] **MongoDB Production Setup** - Use replica sets for high availability
- [ ] **Enable MongoDB authentication** - Never use default/no auth
- [ ] **Configure backups** - Automated daily backups with retention policy
- [ ] **Database encryption** - Enable encryption at rest and in transit
- [ ] **Connection pooling** - Configure appropriate pool size

### 🔐 Secrets Management
- [ ] **Use environment variables** - Never hardcode secrets
- [ ] **Secure .env file** - Ensure it's in .gitignore
- [ ] **Use secrets manager** - AWS Secrets Manager, HashiCorp Vault, etc.
- [ ] **Rotate credentials** - Regular rotation policy for API keys
- [ ] **SMTP credentials** - Use app-specific passwords

### 🚀 Performance
- [ ] **Enable caching** - Redis for session/query caching
- [ ] **CDN setup** - CloudFlare, AWS CloudFront for static assets
- [ ] **Load balancer** - For horizontal scaling
- [ ] **Database indexes** - Run MongoDB init scripts
- [ ] **Compression** - Enable gzip/brotli compression

### 🛡️ Infrastructure
- [ ] **Web Application Firewall** - CloudFlare, AWS WAF
- [ ] **DDoS protection** - CloudFlare or similar
- [ ] **Reverse proxy** - Nginx or similar with rate limiting
- [ ] **Container security** - If using Docker/K8s
- [ ] **Network security** - Firewall rules, VPC configuration

### 📧 Email
- [ ] **Production SMTP** - Configure reliable email service
- [ ] **Email templates tested** - Test all email flows
- [ ] **SPF/DKIM/DMARC** - Configure email authentication
- [ ] **Email rate limits** - Prevent abuse

### 📝 Documentation
- [ ] **API documentation** - Swagger/OpenAPI docs
- [ ] **Runbook** - Incident response procedures
- [ ] **Architecture diagram** - Document system design
- [ ] **Deployment guide** - Step-by-step deployment process

### 🧪 Testing
- [ ] **Run all tests** - `yarn test` passes
- [ ] **Load testing** - Verify performance under load
- [ ] **Security testing** - Penetration testing completed
- [ ] **Backup restoration test** - Verify backups work

### 📦 Deployment
- [ ] **CI/CD pipeline** - Automated testing and deployment
- [ ] **Zero-downtime deployment** - Blue-green or rolling updates
- [ ] **Rollback plan** - Quick rollback procedure documented
- [ ] **Health check endpoint** - `/api/health` configured
- [ ] **Graceful shutdown** - Handle SIGTERM properly

### 🔍 Post-Deployment
- [ ] **Smoke tests** - Verify critical paths work
- [ ] **Monitor logs** - Watch for errors in first 24 hours
- [ ] **Performance metrics** - Compare to baseline
- [ ] **User acceptance** - Verify with stakeholders

### Quick Security Configuration

```env
# Production .env template
NODE_ENV=production
PORT=3000

# Generate secure secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<your-secure-256-bit-secret-here>
JWT_EXPIRATION=1h

# MongoDB with authentication
MONGODB_URI=mongodb://user:password@mongo-host:27017/plaid-financcer?authSource=admin&ssl=true

# Plaid Production
PLAID_CLIENT_ID=<production-client-id>
PLAID_SECRET=<production-secret>
PLAID_ENV=production
PLAID_API_VERSION=2020-09-14

# Email Production SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
EMAIL_FROM=Plaid Financcer <noreply@yourdomain.com>
EMAIL_DAILY_SUMMARY_ENABLED=true

# Security
THROTTLE_SHORT_LIMIT=10
THROTTLE_MEDIUM_LIMIT=20
THROTTLE_LONG_LIMIT=100
CORS_ORIGIN=https://yourdomain.com
```

### Recommended Production Stack

- **Hosting**: AWS (ECS/EKS), Google Cloud (GKE), DigitalOcean
- **Database**: MongoDB Atlas (managed), AWS DocumentDB
- **Caching**: Redis (ElastiCache, Redis Cloud)
- **CDN**: CloudFlare, AWS CloudFront
- **Monitoring**: Datadog, New Relic, Prometheus + Grafana
- **Logging**: CloudWatch, ELK Stack, Loki
- **Error Tracking**: Sentry, Rollbar
- **WAF**: CloudFlare, AWS WAF
- **Email**: SendGrid, AWS SES, Mailgun

### Useful Commands

```bash
# Build for production
yarn build

# Start production server
yarn start:prod

# Check for vulnerabilities
yarn audit
yarn audit fix

# Update dependencies
yarn upgrade-interactive --latest

# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test production build locally
NODE_ENV=production yarn start:prod
```

## Notes

- Make sure MongoDB is running before starting the application
- The scheduler starts automatically when the application boots
- Plaid sandbox environment is perfect for testing without real bank connections
- Access tokens need to be obtained through Plaid Link flow (not included in this base setup)
- See [docs/SECURITY.md](docs/SECURITY.md) for comprehensive security guide
- See [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) for auth implementation details
- See [docs/EMAIL_FEATURE.md](docs/EMAIL_FEATURE.md) for email configuration

## License

MIT
