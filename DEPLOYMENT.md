# 🚀 Deployment Guide - Darts Tournament System

## Production Deployment Checklist

### 1. Prerequisites

- [ ] Node.js 20+ installed
- [ ] PostgreSQL database setup
- [ ] Redis instance (for rate limiting)
- [ ] SMTP credentials (for magic link authentication)
- [ ] Domain with SSL/TLS certificate

### 2. Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in all required environment variables:

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production domain (https://yourdomain.com)
- `REDIS_URL` - Redis connection string
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - Email service credentials

**Optional but Recommended:**
- `STRIPE_SECRET_KEY` - For payment processing
- `SENTRY_DSN` - For error tracking

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Create admin user (run once)
npm run tsx scripts/create-admin-user.ts
```

### 4. Build Application

```bash
# Install dependencies
npm ci

# Build for production
npm run build
```

### 5. Start Production Server

```bash
# Start Next.js server
npm start

# Or with PM2 for process management:
pm2 start npm --name "dartsturnier" -- start
pm2 save
pm2 startup
```

### 6. Reverse Proxy Setup (Nginx)

Example Nginx configuration:

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

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /api/ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 7. Docker Deployment (Alternative)

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Build app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t dartsturnier .
docker run -p 3000:3000 --env-file .env dartsturnier
```

### 8. Security Checklist

- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] All `.env` files are in `.gitignore`
- [ ] `NODE_ENV=production` is set
- [ ] `DEV_LOGIN_ALLOWED` is NOT set or is false
- [ ] HTTPS/TLS is enabled
- [ ] Redis is secured with password
- [ ] Database uses strong passwords
- [ ] SMTP credentials are secured
- [ ] Regular security updates scheduled

### 9. Monitoring & Maintenance

**Health Checks:**
- Check application at `https://yourdomain.com/api/health`
- Monitor database connections
- Monitor Redis availability

**Regular Tasks:**
- Review logs for errors
- Database backups (daily recommended)
- Update dependencies monthly
- Security audit quarterly

**Performance Optimization:**
- Enable Redis caching
- Use CDN for static assets
- Monitor and optimize slow queries
- Set up application monitoring (e.g., Sentry)

### 10. Troubleshooting

**Common Issues:**

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall rules

2. **Redis Connection Failed**
   - Verify REDIS_URL
   - Check Redis service status
   - Ensure network access

3. **Magic Link Not Sent**
   - Verify SMTP credentials
   - Check email logs
   - Test SMTP connection

4. **Build Fails**
   - Run `npm ci` to clean install
   - Check Node.js version (20+)
   - Verify all env vars are set

### 11. Rollback Plan

Keep previous version for quick rollback:

```bash
# Before deployment
cp -r /var/www/dartsturnier /var/www/dartsturnier.backup

# If rollback needed
pm2 stop dartsturnier
rm -rf /var/www/dartsturnier
mv /var/www/dartsturnier.backup /var/www/dartsturnier
pm2 start dartsturnier
```

### 12. Support & Documentation

- **Main Documentation**: README.md
- **Admin Security**: ADMIN_SECURITY.md
- **SMTP Setup**: SMTP_SETUP.md
- **Stripe Payments**: STRIPE_SETUP.md
- **Production Checklist**: PRODUCTION_CHECKLIST.md

---

## Quick Start Commands

```bash
# Full deployment sequence
cp .env.example .env
# Edit .env with your values
npm ci
npm run db:migrate
npm run build
npm start
```

For questions or issues, refer to the documentation or check the logs in `/var/log/dartsturnier/`.
