# 🎯 Pre-Deployment Production Checklist

## Environment & Configuration

### Required Environment Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string configured
- [ ] `NEXTAUTH_SECRET` - Strong secret generated (min 32 chars)
- [ ] `NEXTAUTH_URL` - Production URL set (https://yourdomain.com)
- [ ] `REDIS_URL` - Redis connection configured for rate limiting
- [ ] `NODE_ENV=production` - Set to production

### SMTP Configuration (Required for Authentication)
- [ ] `SMTP_HOST` - Email server configured
- [ ] `SMTP_PORT` - Port configured (usually 587)
- [ ] `SMTP_USER` - Email username set
- [ ] `SMTP_PASS` - Email password set
- [ ] `SMTP_FROM` - Sender email configured
- [ ] Test email sending works

### Optional but Recommended
- [ ] `STRIPE_SECRET_KEY` - If using payment processing
- [ ] `STRIPE_PUBLISHABLE_KEY` - If using payment processing
- [ ] `STRIPE_WEBHOOK_SECRET` - If using Stripe webhooks
- [ ] `SENTRY_DSN` - For error tracking

## Security Checklist

### Authentication & Authorization
- [ ] No fallback JWT secrets in code
- [ ] `DEV_LOGIN_ALLOWED` is NOT set or is explicitly false
- [ ] Magic link expiration configured (24h recommended)
- [ ] Admin authentication working
- [ ] Session management tested

### Rate Limiting
- [ ] Redis-based rate limiting active
- [ ] Magic link endpoints: 5 requests/hour per IP
- [ ] Email endpoints: 3 requests/hour per email
- [ ] Verify rate limiting works in production

### Security Headers
- [ ] Content-Security-Policy configured
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security enabled
- [ ] HTTPS/TLS certificate installed

### Data Protection
- [ ] All `.env` files in `.gitignore`
- [ ] No sensitive data in logs
- [ ] Database credentials secured
- [ ] Redis password protected (if applicable)
- [ ] Stripe secrets server-side only

## Database & Data

### Database Setup
- [ ] PostgreSQL database created
- [ ] Database migrations completed: `npm run db:migrate`
- [ ] Prisma client generated: `npm run db:generate`
- [ ] Database backups configured
- [ ] Database connection tested

### Initial Data
- [ ] Admin user created: `tsx scripts/create-admin-user.ts`
- [ ] Test tournament created (optional)
- [ ] System settings configured
- [ ] Email templates set up

## Application Build

### Dependencies
- [ ] `npm ci` completed successfully
- [ ] No security vulnerabilities: `npm audit`
- [ ] All peer dependencies resolved
- [ ] Production dependencies only

### Build Process
- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors
- [ ] Linting passes: `npm run lint`
- [ ] Build artifacts in `.next/` directory

### File Cleanup (Completed)
- [x] Debug scripts removed
- [x] Test files removed
- [x] Dev-only API endpoints removed
- [x] Unnecessary documentation cleaned
- [x] Development utilities removed

## Server Setup

### Infrastructure
- [ ] Node.js 20+ installed
- [ ] PostgreSQL service running
- [ ] Redis service running
- [ ] Reverse proxy configured (Nginx/Apache)
- [ ] SSL/TLS certificate installed
- [ ] Firewall rules configured

### Application Deployment
- [ ] Application files deployed
- [ ] `.env` file configured on server
- [ ] File permissions set correctly
- [ ] Process manager configured (PM2/systemd)
- [ ] Auto-restart on failure enabled
- [ ] Logs directory created and writable

### Network & Domain
- [ ] Domain DNS configured
- [ ] A/AAAA records point to server
- [ ] SSL certificate verified
- [ ] WebSocket connections work
- [ ] CORS configured (if needed)

## Testing

### Functional Testing
- [ ] Login with magic link works
- [ ] Admin dashboard accessible
- [ ] Tournament creation works
- [ ] Player registration works
- [ ] Game scoring works
- [ ] Bracket generation works
- [ ] Real-time updates work

### Integration Testing
- [ ] Email sending verified
- [ ] Stripe payments work (if enabled)
- [ ] Database queries optimized
- [ ] Redis caching works
- [ ] WebSocket connections stable

### Performance Testing
- [ ] Page load times acceptable (<3s)
- [ ] API response times good (<500ms)
- [ ] Database queries optimized
- [ ] Memory usage monitored
- [ ] CPU usage acceptable

## Monitoring & Logging

### Application Monitoring
- [ ] Health check endpoint working: `/api/health`
- [ ] Error tracking configured (Sentry/similar)
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Alert system configured

### Logging
- [ ] Application logs configured
- [ ] Log rotation set up
- [ ] No sensitive data in logs verified
- [ ] Error logs monitored
- [ ] Access logs enabled

### Backups
- [ ] Database backup schedule (daily recommended)
- [ ] Backup verification tested
- [ ] Backup retention policy set
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested

## Documentation

### User Documentation
- [ ] Admin guide available
- [ ] User registration flow documented
- [ ] Tournament setup instructions
- [ ] Troubleshooting guide

### Technical Documentation
- [ ] Deployment guide complete (DEPLOYMENT.md)
- [ ] Environment variables documented (.env.example)
- [ ] API endpoints documented
- [ ] Architecture overview available
- [ ] Security practices documented

## Legal & Compliance

### Privacy & Legal
- [ ] Privacy policy (Datenschutz) page complete
- [ ] Terms of service available
- [ ] Cookie policy documented
- [ ] GDPR compliance verified
- [ ] Impressum page complete

### Data Handling
- [ ] User data retention policy
- [ ] Data deletion procedures
- [ ] Data export functionality
- [ ] Consent management
- [ ] Data encryption verified

## Post-Deployment

### Immediate Actions
- [ ] Verify all features work in production
- [ ] Test critical user flows
- [ ] Monitor error logs for 24h
- [ ] Check performance metrics
- [ ] Verify email delivery

### Week 1 Actions
- [ ] User feedback collected
- [ ] Performance optimizations applied
- [ ] Bug fixes deployed
- [ ] Documentation updated
- [ ] Backup verified

### Ongoing Maintenance
- [ ] Security updates scheduled
- [ ] Dependency updates monthly
- [ ] Performance reviews quarterly
- [ ] Security audits quarterly
- [ ] Database maintenance scheduled

## Emergency Contacts

### Technical Support
- Database Admin: _____________
- DevOps: _____________
- Security: _____________

### Service Providers
- Hosting: _____________
- Email (SMTP): _____________
- Payment (Stripe): _____________
- Domain Registrar: _____________

---

## Final Sign-Off

**Deployment Approved By:**

- [ ] Technical Lead: _____________ Date: _______
- [ ] Security Officer: _____________ Date: _______
- [ ] Project Manager: _____________ Date: _______

**Deployment Date:** _______  
**Deployment Time:** _______  
**Deployed By:** _______

---

## Rollback Plan

If critical issues occur:

1. **Immediate Actions:**
   - Stop new deployments
   - Assess issue severity
   - Notify stakeholders

2. **Rollback Steps:**
   ```bash
   pm2 stop dartsturnier
   cd /var/www/dartsturnier.backup
   npm start
   pm2 start dartsturnier
   ```

3. **Post-Rollback:**
   - Verify previous version works
   - Document issue
   - Plan hotfix
   - Schedule redeployment

---

**Status:** ✅ Ready for Production Deployment  
**Last Updated:** 2025-11-30  
**Version:** 1.0.0
