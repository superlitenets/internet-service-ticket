# NetFlow ISP Billing Module

Complete modern ISP billing system integrated as a module within NetFlow. Handles customer services, billing, bandwidth monitoring, automated collections, and self-service portal.

## 🎯 Features

### 1. Service Management
- ✅ Automatic PPPoE/PPTP user creation in MikroTik
- ✅ Real-time service activation/deactivation
- ✅ Queue management and bandwidth throttling
- ✅ Speed limit adjustments (per-service)
- ✅ Service suspension/reactivation
- ✅ MikroTik integration (connect, test, manage)

### 2. Billing Models
- ✅ Recurring monthly billing
- ✅ Bandwidth-based overage charges
- ✅ Tiered packages (Basic/Standard/Premium/Enterprise)
- ✅ Prepaid and postpaid models
- ✅ Auto-suspend on unpaid invoices (configurable)
- ✅ Late fees (5% configurable)
- ✅ Service upgrades/downgrades with proration
- ✅ Promotional codes and discounts

### 3. Bandwidth Monitoring
- ✅ Real-time bandwidth monitoring per customer
- ✅ Daily usage tracking (download/upload)
- ✅ Monthly data limit enforcement
- ✅ Peak speed monitoring
- ✅ Usage alerts (80% and 100% of limit)
- ✅ Peak hour analysis
- ✅ Network health dashboard

### 4. Automation
- ✅ Auto-generate invoices on billing date
- ✅ Auto-suspend after 30+ days unpaid (configurable)
- ✅ Auto-reactivate on payment received
- ✅ Dunning management (payment reminders)
- ✅ SMS/Email notifications
- ✅ Late fee automation
- ✅ Scheduled cron jobs

### 5. Customer Features
- ✅ Customer self-service portal
- ✅ View active services and status
- ✅ Real-time usage dashboard
- ✅ Invoice history and details
- ✅ Payment history
- ✅ Package upgrade/downgrade
- ✅ Usage alerts and notifications

### 6. Reporting & Analytics
- ✅ Revenue reports (daily/monthly/yearly)
- ✅ Customer churn analysis
- ✅ Payment method breakdown
- ✅ Usage analytics (top users, peak hours)
- ✅ Service health reports
- ✅ Executive dashboard (KPIs)
- ✅ Overdue invoice tracking

## 📊 Database Schema

### Core ISP Tables
- `isp_packages` - Service packages with speed tiers
- `isp_services` - Active customer services/subscriptions
- `isp_billing_cycles` - Monthly billing records
- `isp_usage_logs` - Daily bandwidth usage tracking
- `isp_service_logs` - Service action history
- `isp_dunning_logs` - Payment reminder attempts
- `isp_overage_pricing` - Bandwidth overage rates
- `isp_service_changes` - Upgrade/downgrade history
- `isp_usage_alerts` - Data limit notifications
- `isp_promotions` - Discount codes
- `mikrotik_connections` - MikroTik API credentials
- `isp_performance_metrics` - Analytics data
- `isp_configurations` - ISP settings

## 🔌 API Endpoints

### Service Management (`/api/isp/mikrotik`)
- `POST /mikrotik/test-connection` - Test MikroTik connection
- `POST /services/create` - Create new PPP service
- `POST /services/{id}/suspend` - Suspend service
- `POST /services/{id}/reactivate` - Reactivate service
- `PUT /services/{id}/speed` - Update bandwidth limits
- `GET /services/{id}/status` - Check service status

### Billing (`/api/isp/billing`)
- `GET /cycles/{service_id}` - Get billing history
- `POST /generate-invoice` - Create invoice manually
- `POST /suspend-unpaid` - Suspend unpaid services
- `POST /reactivate-paid` - Reactivate paid services
- `POST /send-reminders` - Send dunning notices
- `GET /dashboard` - Billing dashboard stats

### Monitoring (`/api/isp/monitoring`)
- `POST /usage` - Log bandwidth usage
- `GET /usage/{service_id}` - Get usage stats
- `GET /bandwidth/{service_id}` - Real-time bandwidth
- `GET /alerts/{service_id}` - Usage alerts
- `PUT /alerts/{id}/acknowledge` - Acknowledge alert
- `GET /health` - Network health status

### Reporting (`/api/isp/reports`)
- `GET /revenue` - Revenue reports
- `GET /churn` - Customer churn analysis
- `GET /payments` - Payment analysis
- `GET /usage-analytics` - Usage statistics
- `GET /service-health` - Service distribution
- `GET /executive-summary` - KPI dashboard

### Customer Portal (`/api/customer/portal`)
- `GET /services` - List my services
- `GET /services/{id}` - Service details
- `GET /invoices` - My invoices
- `GET /invoices/{id}` - Invoice details
- `GET /usage-dashboard/{service_id}` - Usage dashboard
- `POST /services/{id}/change-package` - Upgrade/downgrade
- `GET /packages` - Available packages
- `GET /summary` - Account summary

## 🛠️ Setup & Configuration

### 1. Initialize ISP Module
```bash
# Add ISP schema to migrations
php database/migrate.php

# ISP schema automatically loads with main database schema
```

### 2. Configure MikroTik Connection
```env
# .env file
MIKROTIK_API_HOST=192.168.1.1
MIKROTIK_API_PORT=8728
MIKROTIK_API_USER=admin
MIKROTIK_API_PASSWORD=your_password
```

### 3. Set Up Cron Jobs
```bash
# Generate invoices daily at midnight
0 0 * * * /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=generate-invoices

# Suspend unpaid services (weekly, Monday at 2 AM)
0 2 * * 0 /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=suspend-unpaid

# Reactivate paid services (daily at 3 AM)
0 3 * * * /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=reactivate-paid

# Send payment reminders (daily at 9 AM)
0 9 * * * /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=send-reminders

# Record bandwidth usage (hourly)
0 * * * * /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=record-usage

# Apply late fees (monthly on 1st at 1 AM)
0 1 1 * * /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=apply-late-fees
```

### 4. Configure ISP Settings
Via API or database, set these configurations:
```
isp_suspension_days: 30 (days before suspension)
isp_late_fee_percent: 5 (% of invoice total)
isp_vat_percent: 16 (tax rate)
isp_billing_cycle: monthly (daily, weekly, monthly)
isp_dunning_levels: 3 (number of reminder levels)
```

## 📱 Usage Examples

### Create ISP Service
```bash
curl -X POST https://yourdomain.com/api/isp/mikrotik/services/create \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "package_id": 1,
    "username": "customer001",
    "password": "SecurePassword123",
    "mac_address": "00:1A:2B:3C:4D:5E"
  }'
```

### Generate Invoice
```bash
curl -X POST https://yourdomain.com/api/isp/billing/generate-invoice \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1
  }'
```

### Get Customer Usage
```bash
curl https://yourdomain.com/api/customer/portal/usage-dashboard/1 \
  -H "Authorization: Bearer TOKEN"
```

### Check Network Health
```bash
curl https://yourdomain.com/api/isp/monitoring/health \
  -H "Authorization: Bearer TOKEN"
```

## 📊 Admin Dashboard Sections

### ISP Operations Dashboard
- Active services overview
- Suspended services list
- Real-time bandwidth usage
- Network health status
- Recent service changes

### Billing Dashboard
- Monthly revenue
- Unpaid invoices
- Overdue invoices
- Payment status
- Late fee tracking

### Analytics Dashboard
- Revenue trends (charts)
- Customer churn rate
- Usage analytics
- Peak hour analysis
- Payment method breakdown

### Customer Management
- Service list (searchable)
- Customer profiles
- Service history
- Billing history
- Activity logs

## 👥 Customer Portal Pages

### Dashboard
- Service status
- Current usage (GB/limit)
- Next billing date
- Outstanding balance
- Quick actions

### Services
- List of active services
- Service details
- Usage progress
- Speed test results
- Upgrade/downgrade options

### Invoices
- Invoice list (paginated)
- Invoice PDF download
- Payment status
- Due date warnings
- Payment options

### Usage
- Daily usage graph
- Monthly usage breakdown
- Peak hour analysis
- Download/upload split
- Alert history

### Account
- Profile information
- Contact details
- Notification preferences
- Payment methods
- Service history

## 🔐 Security Features

- JWT authentication for all endpoints
- Role-based access (admin, user, customer)
- Input validation and sanitization
- SQL injection protection (parameterized queries)
- Rate limiting on API endpoints
- Audit logging for all changes
- Secure password hashing (bcrypt)
- HTTPS enforcement

## 🚀 Performance Optimization

- Indexed database queries
- Usage data caching
- Aggregated reports
- Efficient bandwidth tracking
- Batch processing for invoices
- Connection pooling

## 📈 Metrics & KPIs

- **Active Services**: Total active subscriptions
- **Monthly Revenue**: Total paid invoices
- **ARPU**: Average Revenue Per User
- **Churn Rate**: % of customers lost
- **Overdue Rate**: % of unpaid invoices
- **Bandwidth Usage**: Total network usage
- **Peak Bandwidth**: Maximum speed
- **Dunning Success**: % of reminders paid

## 🔄 Workflows

### Invoice Generation Workflow
1. Service's billing date arrives
2. Cron job triggers invoice generation
3. Calculate base charge + overage
4. Apply taxes
5. Create invoice record
6. Create billing cycle
7. Send notification to customer

### Service Suspension Workflow
1. Invoice becomes unpaid
2. Due date passes (configurable days)
3. Cron job checks for unpaid
4. Service marked suspended
5. MikroTik user disabled
6. Notification sent to customer
7. Service log created

### Service Reactivation Workflow
1. Customer pays outstanding balance
2. Payment recorded
3. Cron job checks for fully paid services
4. Service marked active
5. MikroTik user re-enabled
6. Service restored
7. Notification sent to customer

## 🆘 Troubleshooting

### MikroTik Connection Issues
- Verify API credentials in `.env`
- Check firewall allows port 8728
- Test connection via endpoint
- Check MikroTik user permissions

### Invoices Not Generating
- Verify cron job is running
- Check database connectivity
- Verify ISP schema is installed
- Check error logs

### Services Not Suspending
- Verify MikroTik API credentials
- Check suspension days configuration
- Verify cron job running
- Check service status in database

### Usage Not Tracking
- Verify usage data POST to API
- Check database permissions
- Verify service_id is valid
- Check usage log table

## 📝 Customization

All business logic is customizable:
- Late fee percentage
- Suspension delay days
- VAT/tax rates
- Billing cycle (daily/weekly/monthly)
- Overage pricing
- Dunning levels
- Email templates
- SMS templates

## 📚 Additional Resources

- [NetFlow Main Documentation](README.md)
- [API Documentation](API.md)
- [Configuration Guide](CONFIG.md)
- [cPanel Installation](CPANEL_INSTALLATION.md)

---

**ISP Module Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: ✅ Production Ready
