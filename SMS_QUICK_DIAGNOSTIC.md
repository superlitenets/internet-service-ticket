# SMS Quick Diagnostic Guide

## Check if SMS is Being Triggered

### 1. Check Server Logs
When you create a ticket, look at the server console for these messages:
```
[TICKET SMS] Successfully sent ticket_created SMS for ticket ...
```

If you don't see any `[TICKET SMS]` messages, check these logs:
```
[TICKET SMS] SMS not enabled or configured
[TICKET SMS] SMS configuration incomplete
[TICKET SMS] No valid phone numbers to notify
[SMS SERVICE] ...
```

---

## Diagnostic Steps

### Step 1: Verify SMS Configuration
Run this SQL query to check if SMS is configured:
```sql
SELECT * FROM "SmsConfig" WHERE enabled = true;
```

**Expected result:**
- At least one row with `enabled = true`
- `provider` should be "advanta" (or your provider)
- `apiKey`, `partnerId`, `shortcode` should NOT be empty
- `customApiUrl` should have your SMS API endpoint

**If empty:**
- Go to Settings page
- Configure SMS provider with credentials
- Click Save

---

### Step 2: Verify Customer & Employee Phone Numbers
When creating a ticket, both customer and technician must have phone numbers.

Check customers:
```sql
SELECT id, name, phone FROM "Customer" LIMIT 5;
```

Check employees:
```sql
SELECT id, "firstName", "lastName", phone FROM "Employee" LIMIT 5;
```

**Issue:** If phone numbers are empty or `NULL`, SMS won't be sent.

**Fix:** 
1. Add phone numbers to customer profiles
2. Add phone numbers to employee profiles
3. Then create a ticket

---

### Step 3: Test Ticket Creation
1. Go to **Tickets** page
2. Click **New Ticket**
3. **IMPORTANT** - Make sure:
   - **Customer**: Has a phone number (not empty)
   - **Subject**: Fill it
   - **Description**: Fill it
   - **Priority**: Select one
   - **Assign To (Individual)**: Select an employee with a phone number
4. Click **Create**

---

### Step 4: Check Console Output
**In your browser DevTools (F12):**
- Open **Console** tab
- Create a ticket
- Look for any error messages

**In the server console:**
Look for:
```
[TICKET SMS] Successfully sent ticket_created SMS for ticket ...
```

---

## Common Issues & Fixes

### Issue 1: "SMS not enabled or configured"
```
[TICKET SMS] SMS not enabled or configured
```

**Fix:**
1. Go to Settings page
2. Make sure SMS toggle is **ON**
3. Verify SMS provider is selected
4. Save settings
5. Check database: `SELECT * FROM "SmsConfig" WHERE enabled = true;`

---

### Issue 2: "SMS configuration incomplete"
```
[TICKET SMS] SMS configuration incomplete
```

**Fix:**
1. Go to Settings page
2. Fill in ALL SMS credentials:
   - API Key (or Account SID)
   - Partner ID
   - Shortcode
   - Custom API URL (if using Advanta)
3. Save settings
4. Check database fields are NOT NULL

---

### Issue 3: "No valid phone numbers to notify"
```
[TICKET SMS] No valid phone numbers to notify
```

**Fix:**
1. Check customer phone number is set
2. Check employee phone number is set
3. Ensure phone numbers are valid format (9-15 digits)

**Database check:**
```sql
-- Check customer
SELECT phone FROM "Customer" WHERE id = 'CUSTOMER_ID';

-- Check employee  
SELECT phone FROM "Employee" WHERE id = 'EMPLOYEE_ID';
```

---

### Issue 4: SMS Service Error
```
[SMS SERVICE] Error calling Advanta API
```

**Fix:**
1. Verify SMS API endpoint (customApiUrl) is correct
2. Check credentials (apiKey, partnerId, shortcode) are correct
3. Test API endpoint directly with Postman or curl
4. Check network connectivity

---

### Issue 5: No Server Logs at All
The SMS code might not be executing.

**Check:**
1. Confirm server restarted after code changes
2. Check for TypeScript compilation errors
3. Look at dev server console for errors
4. Verify imports are correct in `server/routes/tickets.ts`

---

## Testing Steps (Complete)

```
1. Go to Settings
2. Configure SMS (enable + add credentials)
3. Add phone numbers to Customer and Employee
4. Create a new ticket with assigned technician
5. Look for [TICKET SMS] logs in server console
6. If SMS was sent successfully, you'll see:
   [TICKET SMS] Successfully sent ticket_created SMS for ticket ABC-123 to X recipient(s)
```

---

## SMS Flow Verification

The SMS should flow like this:

```
User Creates Ticket
        ↓
Server receives request
        ↓
Ticket created in database
        ↓
SMS service starts (async, non-blocking)
        ↓
Fetch SMS config from database
  - Check: enabled = true? ✓
  - Check: apiKey, partnerId, shortcode? ✓
  - Check: customApiUrl? ✓
        ↓
Fetch customer details
  - Check: customer exists? ✓
  - Check: customer.phone is set? ✓
        ↓
Fetch technician details
  - Check: employee exists? ✓
  - Check: employee.phone is set? ✓
        ↓
Generate SMS message
        ↓
Send to Advanta API
        ↓
Log result
```

At each step, errors are logged with `[TICKET SMS]` prefix.

---

## Quick Test

Copy and paste this entire flow into your terminal:

```bash
# 1. Check SMS config exists
sqlite3 database.db "SELECT COUNT(*) FROM \"SmsConfig\" WHERE enabled = true;"

# 2. Check customer has phone
sqlite3 database.db "SELECT id, name, phone FROM \"Customer\" LIMIT 1;"

# 3. Check employee has phone  
sqlite3 database.db "SELECT id, \"firstName\", \"lastName\", phone FROM \"Employee\" LIMIT 1;"
```

---

## Need More Help?

Check these files for implementation details:
- `server/lib/ticket-notification-service.ts` - SMS notification logic
- `server/lib/sms-service.ts` - Direct SMS sending
- `server/routes/tickets.ts` - Ticket handlers with SMS integration
- `TICKET_SMS_TESTING_GUIDE.md` - Detailed testing guide
