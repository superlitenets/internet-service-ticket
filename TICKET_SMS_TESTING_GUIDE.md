# Ticket SMS Notifications Testing Guide

This guide helps you verify that SMS notifications are being triggered for ticket lifecycle events from creation to closing.

## Prerequisites

Before testing SMS notifications, ensure:

1. **SMS is Enabled in Settings**
   - Navigate to Settings page
   - Configure an SMS provider (Advanta, Twilio, etc.)
   - Enable SMS and save settings
   - Note: Settings are saved to localStorage on the client side

2. **SMS Configuration in Database**
   - The `SmsConfig` table in the database must have at least one enabled SMS provider
   - Required fields for Advanta:
     - `apiKey`: Your API key
     - `partnerId`: Your partner ID
     - `shortcode`: Your SMS shortcode
     - `customApiUrl`: (Optional) Custom API endpoint
     - `enabled`: `true`

3. **Customer & Technician Phone Numbers**
   - Customers must have valid phone numbers (stored in `Customer.phone`)
   - Technicians/Employees must have valid phone numbers (stored in `Employee.phone`)

## SMS Events Triggered

The following ticket events now trigger SMS notifications:

### 1. **Ticket Created** (`ticket_created`)
- **When**: When a new ticket is created
- **Who Gets Notified**:
  - Customer (always)
  - Assigned technician (if assigned at creation)
- **Message Example**:
  - Customer: "Hi John, your support ticket #TKT-2024-001 has been created. Issue: Internet not working. Technician: Jane Doe will contact you shortly."
  - Technician: "New ticket #TKT-2024-001 for John Doe. Priority: high. Issue: Internet not working. Contact: +254712345678"

### 2. **Ticket Assigned** (`ticket_assigned`)
- **When**: A ticket is assigned to a technician or team
- **Who Gets Notified**:
  - Customer (always)
  - Assigned technician (if there is one)
- **Message Example**:
  - Customer: "Hi John, your ticket #TKT-2024-001 has been assigned to Jane Doe. They will contact you at +254798765432 shortly."
  - Technician: "Ticket #TKT-2024-001 assigned to you. Customer: John (254712345678). Priority: high. Internet not working"

### 3. **Ticket Status Changed** (`ticket_status_change`)
- **When**: Ticket status is updated (open → in-progress, waiting, bounced, etc.)
- **Who Gets Notified**:
  - Customer (always)
  - Assigned technician (if there is one)
- **Message Example**:
  - Customer: "Hi John, your ticket #TKT-2024-001 status has been updated to in-progress. We'll keep you posted on the progress."
  - Technician: "Ticket #TKT-2024-001 for John Doe status changed to in-progress."

### 4. **Ticket Closed/Resolved** (`ticket_closed`)
- **When**: Ticket is marked as resolved or closed
- **Who Gets Notified**:
  - Customer (always)
  - Technician (notification disabled for closure as it's informational)
- **Message Example**:
  - Customer: "Hi John, your ticket #TKT-2024-001 has been resolved and closed. Resolution: Issue was resolved by restarting the modem. Thank you for choosing us!"

## Testing Steps

### Test 1: Create a New Ticket

1. Go to **Tickets** page
2. Click **New Ticket** button
3. Fill in the form:
   - **Customer**: Select a customer with a phone number
   - **Subject**: "Test ticket for SMS"
   - **Description**: "Testing SMS notification on creation"
   - **Priority**: "high"
   - **Assign To (Individual)**: Select a technician with a phone number
4. Click **Create**
5. **Verify SMS**:
   - Check server console logs for `[TICKET SMS]` messages
   - You should see:
     ```
     [TICKET SMS] Successfully sent ticket_created SMS for ticket [TICKET_ID]
     ```

### Test 2: Assign Ticket to Technician

1. Go to **Tickets** page
2. Open an existing unassigned ticket (or create one without assignment)
3. Click **Edit Ticket**
4. In **Assign To (Individual)** dropdown, select a technician
5. Click **Save**
6. **Verify SMS**:
   - Check console logs for:
     ```
     [TICKET SMS] Successfully sent ticket_assigned SMS for ticket [TICKET_ID]
     ```

### Test 3: Change Ticket Status

1. Go to **Tickets** page
2. Open an existing ticket
3. Click **Edit Ticket**
4. Change **Status** to a different value (e.g., "in-progress", "waiting", "bounced")
5. Click **Save**
6. **Verify SMS**:
   - Check console logs for:
     ```
     [TICKET SMS] Successfully sent ticket_status_change SMS for ticket [TICKET_ID]
     ```

### Test 4: Close/Resolve Ticket

1. Go to **Tickets** page
2. Open an existing ticket
3. Click **Edit Ticket**
4. Change **Status** to "resolved" or "closed"
5. Optionally add a **Resolution** message
6. Click **Save**
7. **Verify SMS**:
   - Check console logs for:
     ```
     [TICKET SMS] Successfully sent ticket_closed SMS for ticket [TICKET_ID]
     ```

## Debugging

### Check Server Logs

Monitor the server console for SMS-related logs:

```bash
# All SMS logs
[SMS] Sending via advanta...
[TICKET SMS] Successfully sent ticket_created SMS for ticket ABC-123

# Errors
[TICKET SMS] SMS not enabled or configured
[TICKET SMS] SMS configuration incomplete
[TICKET SMS] No valid phone numbers to notify
[TICKET SMS] Error sending ticket notification SMS
```

### Common Issues

**1. "SMS not enabled or configured"**
- Solution: Check that SMS is enabled in the Settings page and configuration exists in the database

**2. "SMS configuration incomplete"**
- Solution: Ensure all required SMS provider credentials are filled in:
  - For Advanta: apiKey, partnerId, shortcode, customApiUrl
  - For Twilio: accountSid, authToken, fromNumber

**3. "No valid phone numbers to notify"**
- Solution: Verify that:
  - Customer has a phone number in their profile
  - Technician/Employee has a phone number in their profile
  - Phone numbers are in valid format

**4. "Failed to send SMS" (HTTP errors)**
- Solution:
  - Check that SMS API endpoint is reachable
  - Verify SMS provider credentials are correct
  - Check SMS provider API documentation for rate limits

### Check Database Configuration

Run this SQL query to verify SMS configuration:

```sql
SELECT * FROM "SmsConfig" WHERE enabled = true;
```

Expected output:
```
 id  | provider | enabled | apiKey | partnerId | shortcode | customApiUrl
-----+----------+---------+--------+-----------+-----------+-----------
 xyz | advanta  | true    | xxxx   | xxxx      | xxxx      | https://...
```

### Check Customer & Employee Data

```sql
-- Check customers have phone numbers
SELECT id, name, phone FROM "Customer" LIMIT 5;

-- Check employees have phone numbers
SELECT id, "firstName", "lastName", phone FROM "Employee" LIMIT 5;
```

## SMS Message Customization

SMS message templates are generated in the `generateTicketSmsMessage()` function in `server/lib/ticket-notification-service.ts`.

To customize messages, edit the switch statement in that function and redeploy.

### Message Variables

Messages use these variables:
- `{{ticketRef}}` / `#TKT-XXXX`: Ticket number
- `{{customerName}}`: Customer name
- `{{subject}}`: Ticket subject
- `{{priority}}`: Priority level
- `{{status}}`: Current status
- `{{assignedTechnicianName}}`: Technician name
- `{{assignedTechnicianPhone}}`: Technician phone

## Monitoring

### Real-Time Monitoring

1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Create/update a ticket
4. Look for POST request to `/api/sms/send`
5. Check response in the **Response** tab

### Logs to Check

**Client-side** (Browser Console):
- No logs (notifications happen server-side)

**Server-side** (Node.js Console):
- `[SMS]` messages: SMS provider calls
- `[TICKET SMS]` messages: Ticket notification flow

## Testing Complete Lifecycle

Follow these steps to test a complete ticket lifecycle with SMS:

```
1. CREATE ticket (notifies customer + technician)
   ↓
2. ASSIGN to technician (notifies customer + technician)
   ↓
3. UPDATE status to in-progress (notifies customer + technician)
   ↓
4. UPDATE status to waiting (notifies customer + technician)
   ↓
5. UPDATE status to in-progress (notifies customer + technician)
   ↓
6. UPDATE status to resolved/closed (notifies customer only)
```

Each step should trigger corresponding SMS notifications as logged in the server console.

## Verifying SMS Was Actually Sent

### With Real SMS Provider

If using a real SMS provider (Advanta, Twilio, etc.):
1. Check your provider's dashboard for sent messages
2. Verify message count increased
3. Check actual phone receiving SMS (if test numbers configured)

### With Custom API

If using `customApiUrl`:
1. Your API should receive POST request with:
   ```json
   {
     "apikey": "YOUR_API_KEY",
     "partnerID": "YOUR_PARTNER_ID",
     "shortcode": "YOUR_SHORTCODE",
     "mobile": "254712345678,254798765432",
     "message": "Hi John, your support ticket #TKT-2024-001 has been created..."
   }
   ```

## Next Steps

After verifying SMS is working:

1. **Configure Production SMS Provider**: Update database with production credentials
2. **Test with Real Phone Numbers**: Use actual customer/employee numbers
3. **Monitor Sent Messages**: Keep track of SMS volumes in provider dashboard
4. **Adjust Templates**: Customize messages in `ticket-notification-service.ts` as needed
5. **Add Opt-Out Option**: Consider adding SMS preference to customer profiles
