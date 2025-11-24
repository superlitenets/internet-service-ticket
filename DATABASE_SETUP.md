# Database Setup Guide

## Overview

This project uses **Prisma ORM** with **PostgreSQL** for persistent data storage. Previously, the application was using in-memory storage (JavaScript Maps) which meant all data was lost when the server restarted.

## Changes Made

### 1. **Created Prisma Client Utility** (`server/lib/db.ts`)

- Initializes and manages the Prisma client connection
- Provides a singleton instance for database operations across the application

### 2. **Updated Route Handlers to Use Prisma**

The following routes have been updated to use PostgreSQL instead of in-memory storage:

- **Authentication** (`server/routes/auth.ts`)
  - Login, register, user creation, updates, and deletions now persist to the database
  - Password hashing implemented with SHA256 (consider upgrading to bcrypt in production)
  - Session tokens stored in memory (consider using JWT with database sessions in production)

- **Sales Leads** (`server/routes/leads.ts`)
  - All lead CRUD operations now persist to the database
  - Lead-to-ticket conversion functionality integrated with database
  - Search and filtering with database queries

- **HRM - Employees** (`server/routes/hrm.ts`)
  - Employee creation and retrieval now use the Employee model
  - Employees are linked to User accounts via foreign keys
  - Support for pagination and filtering

### 3. **Created Database Migration** (`prisma/migrations/0_init/migration.sql`)

- Contains full schema for all application tables
- Includes proper indexes for performance
- Foreign key relationships defined

## Database Configuration

The database connection is configured via the `DATABASE_URL` environment variable in `.env`:

```
DATABASE_URL="postgresql://netflow:Mgathoni.2016%23@localhost:5432/netflow"
```

**Note**: The password contains a URL-encoded character (`%23` is `#`). When connecting, the actual password is `Mgathoni.2016#`.

## Running Migrations

### Prerequisites

- PostgreSQL database server must be running
- Node.js and pnpm installed

### Steps to Apply Migrations

1. **Ensure database is running** (locally or on your VPS):

   ```bash
   # Example: Start PostgreSQL locally
   sudo systemctl start postgresql
   ```

2. **Apply migrations**:

   ```bash
   npx prisma migrate deploy
   ```

3. **Verify schema was created**:

   ```bash
   npx prisma db push
   ```

4. **View the database schema**:
   ```bash
   npx prisma studio  # Opens a visual database browser
   ```

## Testing Data Persistence

### 1. Create a User via API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "0722000000",
    "password": "password123"
  }'
```

### 2. Verify the user was saved:

```bash
curl http://localhost:3000/api/auth/users
```

### 3. Restart the server and verify user still exists:

- User should still appear in the API response (previously would disappear)

## Important Notes

### Session Management

- Session tokens are currently stored in memory and will be lost on server restart
- For production, implement JWT or store sessions in a database table

### Password Security

- Currently using SHA256 for password hashing
- **For production, upgrade to bcrypt**: `npm install bcrypt`
- Update `server/lib/db.ts` and `server/routes/auth.ts` accordingly

### Additional Routes Needing Updates

The following routes still use in-memory or stub implementations:

- `server/routes/accounting.ts` - Needs Prisma integration
- `server/routes/mpesa.ts` - Needs Prisma integration
- `server/routes/mikrotik.ts` - Needs Prisma integration
- `server/routes/sms.ts` - Needs Prisma integration
- `server/routes/whatsapp.ts` - Needs Prisma integration
- `server/routes/whatsapp-unified.ts` - Needs Prisma integration

## Database Schema Highlights

### Core Models

- **User**: Application users with authentication
- **Customer**: ISP customers
- **Employee**: Team members linked to User accounts
- **Account**: ISP accounts with billing information
- **Ticket**: Support tickets
- **Lead**: Sales leads

### Related Models

- **Invoice**: Billing invoices for accounts
- **Payment**: Payment records
- **AuditLog**: System audit trail
- **AppSettings**: Application configuration
- **Configs**: SMS, M-Pesa, Mikrotik configurations

## Troubleshooting

### "Can't reach database server" Error

- Ensure PostgreSQL is running on localhost:5432
- Check DATABASE_URL is correct
- Verify no firewall blocking the connection

### "relation does not exist" Error

- Migrations may not have been applied
- Run: `npx prisma migrate deploy`
- Or reset (WARNING: deletes data): `npx prisma migrate reset`

### Performance Issues

- Check if indexes were created correctly
- Verify Prisma client is using connection pooling
- Consider adding more indexes for frequently queried fields

## Next Steps

1. Ensure PostgreSQL is running and the migration is applied
2. Update remaining route handlers to use Prisma
3. Implement proper JWT-based session management
4. Upgrade password hashing to bcrypt
5. Add database backup strategy
6. Configure database replication for high availability

## Documentation

For more Prisma documentation:

- https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma
- https://www.prisma.io/docs/orm/prisma-client/queries/crud
- https://www.prisma.io/docs/orm/tools-and-interfaces/prisma-migrate
