# SMS API Documentation

## Overview

The SMS API provides a simple POST endpoint for sending SMS messages through configured SMS providers (Twilio, Vonage, AWS SNS, Nexmo).

## Endpoint

```
POST /api/sms/send
```

## Request Format

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "to": "+1234567890",
  "message": "Your SMS message content",
  "provider": "twilio",
  "accountSid": "AC1234567890abcdef1234567890abcde",
  "authToken": "your_auth_token_here",
  "fromNumber": "+1234567890"
}
```

### Parameters

| Parameter    | Type               | Required | Description                                                                                                 |
| ------------ | ------------------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| `to`         | string \| string[] | Yes      | Phone number(s) to send SMS to. Can be single number or array of numbers. Format: +1234567890 or 1234567890 |
| `message`    | string             | Yes      | SMS message content. Max 1600 characters                                                                    |
| `provider`   | string             | No       | SMS provider: "twilio", "vonage", "aws", "nexmo". Default: "twilio"                                         |
| `accountSid` | string             | Yes      | Account SID/API Key from your SMS provider                                                                  |
| `authToken`  | string             | Yes      | Auth Token/API Secret from your SMS provider                                                                |
| `fromNumber` | string             | Yes      | Sender phone number registered with your SMS provider                                                       |

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "message": "SMS sent successfully to 1 recipient(s)",
  "messageIds": ["msg_1705339200000_abc123def"],
  "recipients": 1,
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "message": "Failed to send SMS",
  "error": "Missing required fields: 'to' and 'message'",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

## Usage Examples

### Using JavaScript Client Library

```typescript
import { sendSms, sendSmsToPhone, sendSmsBatch } from "@/lib/sms-client";

// Send single SMS
const response = await sendSmsToPhone(
  "+1234567890",
  "Hello! Your support ticket has been created.",
  {
    provider: "twilio",
    accountSid: "AC1234567890abcdef1234567890abcde",
    authToken: "your_auth_token_here",
    fromNumber: "+1234567890",
  },
);

// Send bulk SMS
const bulkResponse = await sendSmsBatch(
  ["+1234567890", "+0987654321"],
  "Maintenance window: 2AM-4AM UTC",
  {
    provider: "twilio",
    accountSid: "AC1234567890abcdef1234567890abcde",
    authToken: "your_auth_token_here",
    fromNumber: "+1234567890",
  },
);

// Using generic sendSms function
const customResponse = await sendSms({
  to: ["+1234567890", "+0987654321"],
  message: "Your ticket has been assigned",
  provider: "vonage",
  accountSid: "api_key",
  authToken: "api_secret",
  fromNumber: "NetFlow",
});
```

### Using cURL

```bash
curl -X POST http://localhost:8080/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Test SMS from NetFlow CRM",
    "provider": "twilio",
    "accountSid": "AC1234567890abcdef1234567890abcde",
    "authToken": "your_auth_token_here",
    "fromNumber": "+1234567890"
  }'
```

### Sending to Multiple Recipients

```typescript
import { sendSmsBatch } from "@/lib/sms-client";

const recipients = ["+1234567890", "+0987654321", "+5555555555"];

const response = await sendSmsBatch(
  recipients,
  "Important: Service update scheduled for tonight",
  {
    provider: "twilio",
    accountSid: "AC1234567890abcdef1234567890abcde",
    authToken: "your_auth_token_here",
    fromNumber: "+1234567890",
  },
);

console.log(`Sent to ${response.recipients} recipients`);
console.log(`Message IDs: ${response.messageIds.join(", ")}`);
```

## Validation Rules

1. **Phone Numbers**: Must be 9-15 digits, optionally with + prefix
   - Valid: `+1234567890`, `1234567890`, `+44 1234 567890`
   - Invalid: `123`, `abcdefghij`

2. **Message**: Must be 1-1600 characters
   - Empty messages are rejected
   - Very long messages should be split by client

3. **Provider Credentials**: All required for actual SMS sending
   - accountSid/authToken vary by provider
   - fromNumber must be registered with provider

## Error Handling

### Common Errors

| Error                            | Status | Cause                                        | Solution                       |
| -------------------------------- | ------ | -------------------------------------------- | ------------------------------ |
| Missing required fields          | 400    | 'to' or 'message' not provided               | Include both fields in request |
| Missing SMS provider credentials | 400    | Missing accountSid, authToken, or fromNumber | Provide all credentials        |
| No valid phone numbers           | 400    | All phone numbers failed validation          | Use E.164 format               |
| Invalid message length           | 400    | Message > 1600 chars                         | Split into multiple messages   |
| Internal server error            | 500    | Server-side error during API call            | Check logs and credentials     |

## Integration with Settings Page

The SMS API integrates with the Settings page SMS Provider Configuration:

1. **Configure Provider** in Settings > SMS tab
   - Select provider (Twilio, Vonage, AWS SNS, Nexmo)
   - Enter Account SID and Auth Token
   - Set From Phone Number

2. **Send SMS** using the saved credentials
   - Retrieve settings from app state
   - Call sendSms() with credentials
   - Handle success/error responses

## Production Deployment Notes

1. **Actual Provider Integration**: The current implementation is mock/stub
   - To use actual SMS sending, uncomment provider-specific code in `server/routes/sms.ts`
   - Install provider SDK (e.g., `twilio`, `vonage`)
   - Implement actual API calls instead of mock logging

2. **Environment Variables**: Store credentials securely

   ```
   SMS_PROVIDER=twilio
   SMS_ACCOUNT_SID=your_account_sid
   SMS_AUTH_TOKEN=your_auth_token
   SMS_FROM_NUMBER=your_phone_number
   ```

3. **Rate Limiting**: Add rate limiting to prevent abuse

   ```typescript
   app.post(
     "/api/sms/send",
     rateLimit({ windowMs: 60000, max: 100 }),
     handleSendSms,
   );
   ```

4. **Logging**: Enhanced logging for audit trail
   - Log all SMS attempts (success/failure)
   - Track message IDs for delivery confirmation
   - Monitor costs and usage

## Testing

### Manual Testing

Use the Settings page to configure SMS credentials, then use the provided client library to send test messages.

### Automated Testing

```typescript
import { describe, it, expect } from "vitest";
import { sendSmsToPhone } from "@/lib/sms-client";

describe("SMS API", () => {
  it("should send SMS to valid phone number", async () => {
    const response = await sendSmsToPhone("+1234567890", "Test message", {
      /* credentials */
    });
    expect(response.success).toBe(true);
    expect(response.recipients).toBe(1);
  });
});
```
