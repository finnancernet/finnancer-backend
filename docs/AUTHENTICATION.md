# Authentication & User Management

This document explains the authentication system and user management features.

## Overview

The application uses **JWT (JSON Web Tokens)** for stateless authentication. Users must register and login to access their financial data.

## Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt for secure password storage
- **User Isolation**: Each user only sees their own accounts and transactions
- **Protected Endpoints**: All financial data endpoints require authentication
- **Token Expiration**: Configurable token lifespan (default: 7 days)

## Architecture

```
User
  ├── Accounts (1:many)
  │     └── Transactions (1:many)
  └── Email Summaries
```

- **One user** can have **multiple accounts**
- Each **account** belongs to **exactly one user**
- **Transactions** are linked to accounts (and indirectly to users)

## API Endpoints

### Authentication

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** Same as register

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "lastLoginAt": "2024-01-15T10:35:00Z"
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer {token}
```

**Response:**
```json
{
  "valid": true
}
```

### Protected Endpoints

All these endpoints require the `Authorization: Bearer {token}` header:

#### Accounts
```http
GET /api/accounts
GET /api/accounts/:accountId
GET /api/accounts/item/:itemId
```

#### Transactions
```http
GET /api/transactions
GET /api/transactions/:transactionId
GET /api/transactions/account/:accountId
GET /api/transactions/account/:accountId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Authentication (JWT)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRATION=7d
# Options: 15m, 1h, 24h, 7d, 30d
```

**Important:**
- Change `JWT_SECRET` in production to a strong random string
- Shorter expiration times (15m, 1h) are more secure but require frequent re-login
- Longer times (7d, 30d) are more convenient but less secure

## Usage Example

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Save the `access_token` from the response.

### 2. Use Token for Protected Endpoints

```bash
# Get user's accounts
curl -X GET http://localhost:3000/api/accounts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get user's transactions
curl -X GET http://localhost:3000/api/transactions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Login (if token expired)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

## Security Features

### Password Hashing
- Uses **bcrypt** with salt factor of 10
- Passwords are never stored in plain text
- Pre-save hook automatically hashes passwords

### JWT Security
- Tokens are signed with `JWT_SECRET`
- Tokens include user ID and email
- Expiration is enforced
- Invalid/expired tokens return 401 Unauthorized

### User Isolation
- All queries filter by `userId`
- Users cannot access other users' data
- Account and transaction controllers enforce user ownership

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  isActive: Boolean (default: true),
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Account Collection (Updated)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'), // NEW: Links to user
  accountId: String (unique),
  itemId: String,
  name: String,
  // ... other fields
}
```

## Frontend Integration

### Storing the Token

```javascript
// After login/register
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
localStorage.setItem('token', data.access_token);
localStorage.setItem('user', JSON.stringify(data.user));
```

### Making Authenticated Requests

```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/accounts', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.status === 401) {
  // Token expired or invalid - redirect to login
  window.location.href = '/login';
}
```

### Logout

```javascript
localStorage.removeItem('token');
localStorage.removeItem('user');
window.location.href = '/login';
```

## Testing

### 1. Register a Test User

```bash
POST http://localhost:3000/api/auth/register
{
  "email": "test@example.com",
  "password": "Test123!",
  "firstName": "Test",
  "lastName": "User"
}
```

### 2. Try Accessing Protected Endpoint Without Token

```bash
GET http://localhost:3000/api/accounts
# Returns: 401 Unauthorized
```

### 3. Login and Get Token

```bash
POST http://localhost:3000/api/auth/login
{
  "email": "test@example.com",
  "password": "Test123!"
}
```

### 4. Access Protected Endpoint With Token

```bash
GET http://localhost:3000/api/accounts
Authorization: Bearer {your_token_here}
# Returns: User's accounts
```

## Troubleshooting

### Error: "User with this email already exists"
- Email must be unique
- Try a different email or login instead

### Error: "Invalid email or password"
- Check email and password spelling
- Passwords are case-sensitive

### Error: "Unauthorized" (401)
- Token is missing, invalid, or expired
- Get a new token by logging in again

### Error: "User not found"
- The user associated with the token was deleted
- Register a new account

## Linking Users to Plaid Accounts

When syncing Plaid data, you need to associate accounts with users:

### Option 1: Update Sync Flow (Recommended)

The scheduler should be updated to accept userId:

```typescript
// In your scheduler or controller
await schedulerService.addSyncConfig(
  itemId,
  accessToken,
  institutionName,
  userId // Add userId parameter
);
```

### Option 2: Manual Update

Update existing accounts to link them to a user:

```javascript
// Via MongoDB
db.accounts.updateMany(
  { itemId: "your_item_id" },
  { $set: { userId: ObjectId("user_id_here") } }
);
```

### Option 3: API Endpoint

Create an endpoint to link Plaid item to user (recommended for production):

```typescript
@Post('scheduler/configs')
@UseGuards(JwtAuthGuard)
async addSyncConfig(
  @CurrentUser() user: User,
  @Body() body: { itemId: string; accessToken: string; institutionName?: string }
) {
  return this.schedulerService.addSyncConfigForUser(
    body.itemId,
    body.accessToken,
    user['_id'].toString(),
    body.institutionName
  );
}
```

## Best Practices

1. **Always use HTTPS in production** - JWT tokens should never be sent over HTTP
2. **Store JWT_SECRET securely** - Use environment variables, never commit to git
3. **Use strong passwords** - Enforce password requirements in production
4. **Implement refresh tokens** - For better security with short-lived access tokens
5. **Add rate limiting** - Prevent brute force attacks on login endpoint
6. **Log authentication events** - Monitor failed login attempts
7. **Implement password reset** - Allow users to recover accounts
8. **Add email verification** - Verify email addresses before activation

## Future Enhancements

- [ ] Refresh token implementation
- [ ] Password reset flow
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] Role-based access control (RBAC)
- [ ] OAuth2 integration (Google, GitHub, etc.)
- [ ] Account sharing/permissions
- [ ] Session management
- [ ] Login history tracking
