# Docker PostgreSQL Testing Procedure

Use this template to systematically test your local Docker PostgreSQL setup.

---

## PHASE 1: SERVICE STARTUP

### Step 1.1: Stop Current Dev Server
- [ ] Stop running dev server (Ctrl+C if running)
- [ ] Verify no process on port 5173
- [ ] Verify no process on port 9000

### Step 1.2: Start Docker Services
```bash
docker-compose up --build
```

**Expected Output:**
```
Creating netflow-postgres ... done
Creating netflow-redis ... done
Creating netflow-pgadmin ... done
Creating netflow-app ... done
```

### Step 1.3: Verify All Services Running
```bash
docker-compose ps
```

**Expected Result:**
| Service | Status | Ports |
|---------|--------|-------|
| netflow-postgres | Up (healthy) | 5432 |
| netflow-redis | Up | 6379 |
| netflow-pgadmin | Up | 5050 |
| netflow-app | Up | 5173, 9000 |

- [ ] PostgreSQL status: ✓ Up (healthy)
- [ ] Redis status: ✓ Up
- [ ] pgAdmin status: ✓ Up
- [ ] App status: ✓ Up

---

## PHASE 2: DATABASE CONNECTIVITY

### Step 2.1: PostgreSQL Health Check
```bash
docker-compose exec postgres pg_isready -U netflow_user -d netflow_db
```

**Expected Output:**
```
accepting connections
```

- [ ] PostgreSQL responding to health check

### Step 2.2: Direct Database Connection
```bash
docker-compose exec postgres psql -U netflow_user -d netflow_db -c "SELECT version();"
```

**Expected Output:**
```
PostgreSQL 16.x on ...
```

- [ ] Database connection successful
- [ ] PostgreSQL version displays

### Step 2.3: List Database Tables
```bash
docker-compose exec postgres psql -U netflow_user -d netflow_db -c "\dt"
```

**Expected Output:**
```
(List of tables including: users, customers, accounts, tickets, etc.)
```

- [ ] Tables present in database
- [ ] Schema created by Prisma

---

## PHASE 3: PRISMA MIGRATIONS

### Step 3.1: Check Migration Status
```bash
docker-compose exec app pnpm prisma migrate status
```

**Expected Output:**
```
Migrations:
  [applied] 0_init
  [applied] add_biometric_integrations
  [applied] add_customer_location_fields
  ... (etc)
```

- [ ] All migrations marked as "applied"
- [ ] No pending migrations

### Step 3.2: Generate Prisma Client
```bash
docker-compose exec app pnpm prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client (x.y.z) to ./generated/prisma in XXms
```

- [ ] Prisma client generated successfully

---

## PHASE 4: APPLICATION STARTUP

### Step 4.1: Check App Build Logs
```bash
docker-compose logs app | tail -50
```

**Expected Contains:**
```
✔ Frontend compiled successfully
✔ Backend server running on port 9000
```

- [ ] Frontend compiled
- [ ] Backend API running
- [ ] No TypeScript errors

### Step 4.2: Test API Endpoint
```bash
curl http://localhost:9000/api/health
```

**Expected Output:**
```json
{"status":"ok"}
```

Or check browser at http://localhost:9000

- [ ] API responds
- [ ] Server is accessible

---

## PHASE 5: WEB INTERFACE

### Step 5.1: Frontend Access
- Open browser: http://localhost:5173
- [ ] Page loads without errors
- [ ] Landing page displays
- [ ] No console errors (F12 → Console tab)

### Step 5.2: pgAdmin Access
- Open browser: http://localhost:5050
- [ ] pgAdmin login page appears
- [ ] Login with:
  - Email: `admin@netflow.local`
  - Password: `admin_password`
- [ ] Dashboard displays

### Step 5.3: Add Database Server in pgAdmin
1. Right-click "Servers" → Register → Server
2. **Name:** `netflow-local`
3. **Host name/address:** `postgres`
4. **Port:** `5432`
5. **Maintenance database:** `netflow_db`
6. **Username:** `netflow_user`
7. **Password:** `secure_password`
8. Click Save

- [ ] Server connection successful
- [ ] Database visible in pgAdmin tree
- [ ] Tables visible under Schemas → Public → Tables

---

## PHASE 6: DATA OPERATIONS

### Step 6.1: Query Sample Data
In pgAdmin query tool or CLI:
```sql
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Customer";
SELECT COUNT(*) FROM "Ticket";
```

**Expected:** Tables may be empty (0 rows) initially

- [ ] Queries execute without errors
- [ ] Tables accessible

### Step 6.2: Database Backup Test
```bash
docker-compose exec postgres pg_dump -U netflow_user -d netflow_db > test_backup.sql
```

- [ ] Backup file created
- [ ] File size > 0 bytes

**Check file:**
```bash
ls -lh test_backup.sql
```

---

## PHASE 7: TROUBLESHOOTING CHECKLIST

### If PostgreSQL Won't Start

```bash
# View detailed logs
docker-compose logs postgres

# Check if port 5432 is available
lsof -i :5432

# Solution: Stop conflicting service or change docker-compose port mapping
```

- [ ] Issue identified and resolved

### If App Container Exits

```bash
# Check logs
docker-compose logs app

# Check for dependency issues
docker-compose exec postgres pg_isready

# Rebuild
docker-compose down
docker-compose up --build
```

- [ ] App running

### If Connection Timeout

```bash
# Verify network
docker network inspect netflow-network

# Check hostname resolution
docker-compose exec app ping postgres
```

- [ ] Services on same network
- [ ] Hostname resolution working

---

## PHASE 8: CLEANUP & DOCUMENTATION

### Step 8.1: Document Credentials
Create a local `.env.docker.local` (DO NOT COMMIT):
```env
DATABASE_URL=postgresql://netflow_user:secure_password@localhost:5432/netflow_db
PGADMIN_EMAIL=admin@netflow.local
PGADMIN_PASSWORD=admin_password
```

- [ ] Credentials documented locally

### Step 8.2: Record Test Results

**Test Date:** ________________

**Tester:** ________________

**Overall Status:**
- [ ] ✅ All services running
- [ ] ✅ Database connected
- [ ] ✅ Migrations applied
- [ ] ✅ API responding
- [ ] ✅ Frontend accessible
- [ ] ✅ pgAdmin accessible

**Notes:**
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## PHASE 9: OPTIONAL - ADVANCED TESTING

### Step 9.1: Monitor Resource Usage
```bash
docker stats
```

- [ ] CPU usage reasonable (< 50%)
- [ ] Memory usage acceptable (< 500MB per service)

### Step 9.2: Restart Services Test
```bash
# Restart app
docker-compose restart app

# Verify recovery
docker-compose ps
curl http://localhost:9000/api/health
```

- [ ] Services restart cleanly
- [ ] API recovers

### Step 9.3: Volume Persistence Test
```bash
# Stop containers (data persists)
docker-compose stop

# Verify data volume
docker volume ls | grep postgres_data

# Restart
docker-compose start

# Verify data still there
docker-compose exec postgres psql -U netflow_user -d netflow_db -c "SELECT COUNT(*) FROM \"User\";"
```

- [ ] Data persists after stop/start

---

## FINAL VERIFICATION

| Component | Status | Notes |
|-----------|--------|-------|
| PostgreSQL | [ ] ✓ | |
| Redis | [ ] ✓ | |
| Node.js App | [ ] ✓ | |
| Frontend UI | [ ] ✓ | |
| Backend API | [ ] ✓ | |
| pgAdmin | [ ] ✓ | |
| Migrations | [ ] ✓ | |
| Data Persistence | [ ] ✓ | |

---

## ROLLBACK INSTRUCTIONS

If you need to revert to Neon:

```bash
# Stop Docker services
docker-compose down

# Update .env with Neon connection
# DATABASE_URL=postgresql://[neon-connection-string]

# Run normally
pnpm install
pnpm run dev
```

---

**✅ If all phases pass, Docker setup with local PostgreSQL is working correctly!**

For issues, see `DOCKER_LOCAL_POSTGRES_SETUP.md` troubleshooting section.
