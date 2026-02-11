# Security Features

This document details all security measures implemented in the Plaid Financcer API.

## Overview

The API implements multiple layers of security to protect against common attacks and abuse:

1. **Rate Limiting** - Prevents brute force and DDoS attacks
2. **IP Blocking** - Automatically blocks abusive IPs
3. **Helmet** - Sets secure HTTP headers
4. **CORS** - Controls cross-origin requests
5. **Input Validation** - Validates and sanitizes all input
6. **JWT Authentication** - Secure token-based authentication
7. **Password Hashing** - Bcrypt with salt
8. **Request Size Limits** - Prevents memory exhaustion

## 1. Rate Limiting

### Implementation
Uses `@nestjs/throttler` with three tiers:

- **Short**: 10 requests per second
- **Medium**: 20 requests per 10 seconds
- **Long**: 100 requests per minute

### Configuration
```env
THROTTLE_SHORT_LIMIT=10
THROTTLE_MEDIUM_LIMIT=20
THROTTLE_LONG_LIMIT=100
```

### Sensitive Endpoints
Extra strict limits on authentication endpoints:

- **Register**: 3 requests per minute
- **Login**: 5 attempts per minute

```typescript
@Throttle({ short: { limit: 5, ttl: 60000 } })
```

### How It Works
1. Tracks requests by IP address
2. Counts requests within time windows
3. Returns `429 Too Many Requests` when limit exceeded
4. Headers include retry information

### Response When Limit Exceeded
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

## 2. IP Blocking System

### Automatic Blocking
IPs are automatically blocked after:
- **10 rate limit violations** within **15 minutes**
- Block duration: **1 hour**

### How It Works
```typescript
// Violation tracking
recordViolation(ip: string)
  ├─ Track violations within 15-minute window
  ├─ Reset count after window expires
  └─ Block IP after 10 violations

// Automatic cleanup every 10 minutes
cleanup()
  ├─ Remove expired blocks
  └─ Clean old violation records
```

### Blocked IP Response
```json
{
  "statusCode": 403,
  "message": "Your IP has been temporarily blocked due to too many failed requests",
  "blockedUntil": "2024-01-15T15:30:00.000Z"
}
```

### Manual IP Management
```typescript
// Block an IP manually
ipBlacklistService.blockIP('192.168.1.100');

// Unblock an IP
ipBlacklistService.unblockIP('192.168.1.100');

// Check if blocked
const isBlocked = ipBlacklistService.isBlocked('192.168.1.100');

// Get all blocked IPs
const blockedIPs = ipBlacklistService.getAllBlockedIPs();
```

## 3. Helmet - HTTP Security Headers

### Headers Set
```
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### Protection Against
- **XSS Attacks**: Content Security Policy
- **Clickjacking**: X-Frame-Options
- **MIME Sniffing**: X-Content-Type-Options
- **Man-in-the-Middle**: HSTS header

### Configuration
```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
})
```

## 4. CORS Configuration

### Settings
```typescript
enableCors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
})
```

### Environment Configuration
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,https://yourdomain.com
```

### What It Prevents
- Unauthorized cross-origin requests
- CSRF attacks from untrusted domains
- Data theft from malicious sites

## 5. Input Validation

### Global Validation Pipe
```typescript
useGlobalPipes(
  new ValidationPipe({
    whitelist: true,                    // Strip unknown properties
    forbidNonWhitelisted: true,         // Reject if unknown properties exist
    transform: true,                     // Auto-transform to DTO types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
)
```

### Example: Register DTO
```typescript
export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and number/special char',
  })
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;
}
```

### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number or special character

### What It Prevents
- **SQL Injection**: Input sanitization
- **NoSQL Injection**: Type validation
- **XSS**: HTML/script stripping
- **Buffer Overflow**: Length limits

## 6. JWT Security

### Token Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "iat": 1642262400,
  "exp": 1642866400
}
```

### Security Features
- Tokens signed with `JWT_SECRET`
- Configurable expiration (default: 7 days)
- Automatic validation on protected routes
- Invalid/expired tokens return 401

### Best Practices
```env
# Use strong random secret (min 32 characters)
JWT_SECRET=your_256_bit_secret_here_change_in_production

# Shorter expiration is more secure
JWT_EXPIRATION=1h  # For high-security apps
JWT_EXPIRATION=7d  # For convenience
```

### Token Transmission
- Must be sent in `Authorization` header
- Format: `Bearer {token}`
- Never in URL parameters
- Always over HTTPS in production

## 7. Password Security

### Hashing
- **Algorithm**: bcrypt
- **Salt Rounds**: 10
- **Pre-save hook**: Automatic hashing

```typescript
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

### Password Comparison
```typescript
async comparePassword(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
}
```

### Never Stored in Plain Text
- Passwords hashed before database storage
- Original password never logged or stored
- Password field excluded from API responses

## 8. HTTPS / TLS

### Production Requirements
```
✓ Always use HTTPS in production
✓ Valid SSL certificate
✓ TLS 1.2 or higher
✓ Redirect HTTP to HTTPS
```

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

## Security Checklist

### Before Going to Production

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Enable HTTPS/TLS
- [ ] Update `CORS_ORIGIN` to production domains only
- [ ] Set `NODE_ENV=production`
- [ ] Review and adjust rate limits
- [ ] Set up monitoring and alerts
- [ ] Enable database encryption at rest
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Implement logging for security events
- [ ] Set up WAF (Web Application Firewall)
- [ ] Regular backup strategy
- [ ] Incident response plan

### Environment Variables
```env
NODE_ENV=production
JWT_SECRET=<strong_random_256_bit_secret>
CORS_ORIGIN=https://yourdomain.com
THROTTLE_SHORT_LIMIT=10
THROTTLE_MEDIUM_LIMIT=20
THROTTLE_LONG_LIMIT=100
```

## Monitoring & Logging

### Security Events to Log
1. Failed login attempts
2. Rate limit violations
3. IP blocks/unblocks
4. Invalid JWT tokens
5. Validation errors
6. Suspicious patterns

### Recommended Tools
- **Logging**: Winston, Pino
- **Monitoring**: Datadog, New Relic
- **Alerts**: PagerDuty, Slack
- **WAF**: Cloudflare, AWS WAF

## Common Attack Vectors & Mitigations

### 1. Brute Force Attacks
**Attack**: Trying many passwords to guess credentials
**Mitigation**:
- Rate limiting on login (5 attempts/minute)
- IP blocking after violations
- Account lockout after failed attempts

### 2. DDoS Attacks
**Attack**: Overwhelming server with requests
**Mitigation**:
- Multi-tier rate limiting
- IP blocking
- CDN/Load balancer

### 3. XSS (Cross-Site Scripting)
**Attack**: Injecting malicious scripts
**Mitigation**:
- Content Security Policy
- Input validation
- Output encoding
- Helmet headers

### 4. CSRF (Cross-Site Request Forgery)
**Attack**: Unauthorized actions from trusted user
**Mitigation**:
- CORS restrictions
- SameSite cookies (if using sessions)
- JWT tokens (stateless)

### 5. SQL/NoSQL Injection
**Attack**: Malicious database queries
**Mitigation**:
- Mongoose parameterized queries
- Input validation
- Type checking

### 6. Man-in-the-Middle
**Attack**: Intercepting communication
**Mitigation**:
- HTTPS/TLS required
- HSTS header
- Certificate pinning

## Testing Security

### Rate Limiting Test
```bash
# Send 20 requests rapidly
for i in {1..20}; do
  curl http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}'
done
```

### IP Blocking Test
```bash
# Trigger rate limits repeatedly to get blocked
for i in {1..50}; do
  curl http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  sleep 0.1
done
```

### CORS Test
```bash
# Test from unauthorized origin
curl http://localhost:3000/api/accounts \
  -H "Origin: https://evil.com" \
  -H "Authorization: Bearer token" \
  -v
```

## Security Updates

### Dependency Scanning
```bash
# Check for vulnerabilities
npm audit
yarn audit

# Auto-fix
npm audit fix
yarn audit fix
```

### Regular Updates
```bash
# Update all dependencies
yarn upgrade-interactive --latest
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

## Support

For security issues, please contact: security@yourdomain.com

**Do not** disclose security vulnerabilities publicly.
