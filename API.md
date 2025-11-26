# NetFlow API Documentation

## Base URL

```
https://yourdomain.com/api
```

## Authentication

All API requests (except login and register) require a JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format

All responses are in JSON format with the following structure:

```json
{
  "success": true|false,
  "data": { /* response data */ },
  "message": "error message (if applicable)"
}
```

## HTTP Status Codes

- **200**: OK - Request successful
- **201**: Created - Resource created successfully
- **400**: Bad Request - Invalid parameters
- **401**: Unauthorized - Authentication required or invalid token
- **404**: Not Found - Resource not found
- **500**: Internal Server Error - Server error

---

## 🔐 Authentication Endpoints

### POST /auth/login

Login with email and password to receive a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user"
    }
  }
}
```

### POST /auth/register

Register a new user account.

**Request:**
```json
{
  "username": "john_doe",
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user"
    }
  }
}
```

### GET /auth/me

Get current authenticated user details.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "status": "active"
  }
}
```

---

## 👥 Customer Endpoints

### GET /customers

Get list of all customers.

**Query Parameters:**
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+254712345678",
      "address": "123 Main St",
      "city": "Nairobi",
      "country": "Kenya",
      "account_number": "CUST-001",
      "status": "active",
      "balance": 1500.00,
      "created_at": "2024-01-15 10:30:00"
    }
  ]
}
```

### POST /customers

Create a new customer.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "address": "123 Main St",
  "city": "Nairobi",
  "country": "Kenya",
  "account_type": "retail",
  "status": "active"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+254712345678",
    "created_at": "2024-01-15 10:30:00"
  }
}
```

### GET /customers/{id}

Get customer details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+254712345678",
    "address": "123 Main St",
    "city": "Nairobi",
    "country": "Kenya",
    "account_number": "CUST-001",
    "status": "active",
    "balance": 1500.00,
    "created_at": "2024-01-15 10:30:00",
    "updated_at": "2024-01-16 14:20:00"
  }
}
```

### PUT /customers/{id}

Update customer information.

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+254712345679",
  "status": "inactive"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "updated_at": "2024-01-17 10:00:00"
  }
}
```

---

## 💰 Invoice Endpoints

### GET /invoices

Get list of invoices.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "invoice_number": "INV-202401-0001",
      "customer_id": 1,
      "customer_name": "John Doe",
      "amount": 5000.00,
      "tax": 500.00,
      "total": 5500.00,
      "status": "unpaid",
      "due_date": "2024-02-15",
      "created_at": "2024-01-15 10:30:00"
    }
  ]
}
```

### POST /invoices

Create a new invoice.

**Request:**
```json
{
  "customer_id": 1,
  "amount": 5000.00,
  "tax": 500.00,
  "total": 5500.00,
  "status": "unpaid",
  "due_date": "2024-02-15"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoice_number": "INV-202401-0001",
    "customer_id": 1,
    "total": 5500.00,
    "status": "unpaid"
  }
}
```

### GET /invoices/{id}

Get invoice details.

---

## 🎟️ Ticket Endpoints

### GET /tickets

Get list of support tickets.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ticket_number": "TKT-202401-0001",
      "customer_id": 1,
      "subject": "Connection issue",
      "description": "Internet keeps disconnecting",
      "priority": "high",
      "status": "open",
      "created_at": "2024-01-15 10:30:00"
    }
  ]
}
```

### POST /tickets

Create a new support ticket.

**Request:**
```json
{
  "customer_id": 1,
  "subject": "Connection issue",
  "description": "Internet keeps disconnecting",
  "priority": "high",
  "category": "technical"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticket_number": "TKT-202401-0001",
    "status": "open"
  }
}
```

### GET /tickets/{id}

Get ticket details with replies.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticket_number": "TKT-202401-0001",
    "subject": "Connection issue",
    "status": "open",
    "replies": [
      {
        "id": 1,
        "user_id": 2,
        "message": "We are investigating the issue",
        "is_internal": false,
        "created_at": "2024-01-15 11:00:00"
      }
    ]
  }
}
```

### POST /tickets/{id}/replies

Add reply to ticket.

**Request:**
```json
{
  "message": "We found the issue. Please restart your modem.",
  "is_internal": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "ticket_id": 1,
    "message": "We found the issue. Please restart your modem.",
    "is_internal": false
  }
}
```

---

## 💳 Payment Endpoints

### GET /payments

Get list of payments.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "invoice_id": 1,
      "customer_id": 1,
      "amount": 5500.00,
      "payment_method": "mpesa",
      "status": "completed",
      "created_at": "2024-01-15 10:30:00"
    }
  ]
}
```

### POST /payments

Create a new payment.

**Request:**
```json
{
  "invoice_id": 1,
  "customer_id": 1,
  "amount": 5500.00,
  "payment_method": "bank_transfer",
  "reference_number": "TRF-12345"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "pending"
  }
}
```

---

## 📊 Statistics & Reports

### GET /stats/dashboard

Get dashboard statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_customers": 150,
    "total_invoices": 450,
    "unpaid_invoices": 45,
    "total_payments": 125000.00,
    "open_tickets": 12,
    "recent_leads": []
  }
}
```

### GET /reports/revenue

Get revenue report.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "total": 15000.00
    }
  ]
}
```

---

## 🔌 Integration Endpoints

### POST /integrations/mpesa/payment

Initiate M-Pesa STK push payment.

**Request:**
```json
{
  "phone": "+254712345678",
  "amount": 5500,
  "invoice_id": 1,
  "customer_id": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "CheckoutRequestID": "ws_CO_15112023123456789",
    "ResponseCode": "0",
    "ResponseDescription": "Success"
  }
}
```

### POST /api/sms/send

Send SMS via configured provider (Advanta SMS).

**Request:**
```json
{
  "to": "+254712345678",
  "message": "Your invoice is due on 2024-02-15",
  "provider": "advanta",
  "apiKey": "your-api-key",
  "partnerId": "your-partner-id",
  "shortcode": "your-sender-id",
  "customApiUrl": "https://api.advantasms.com/send"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "SMS sent successfully to 1 recipient(s)",
  "messageIds": ["msg_1234567890_abc123"],
  "recipients": 1
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Missing Advanta SMS credentials: apiKey, partnerId, shortcode"
}
```

**Advanta SMS Configuration:**
- **Provider**: advanta
- **Required Fields**: apiKey, partnerId, shortcode, customApiUrl
- **Phone Format**: Automatically converts to E.164 format (e.g., 254712345678)
- **Message Length**: 1-1600 characters

**Example Test Request:**
```bash
curl -X POST https://yourdomain.com/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0712345678",
    "message": "Test SMS from CRM",
    "provider": "advanta",
    "apiKey": "your-api-key",
    "partnerId": "your-partner-id",
    "shortcode": "MYSHORTCODE",
    "customApiUrl": "https://api.advantasms.com/send"
  }'
```

### GET /integrations/mikrotik/interfaces

Get MikroTik router interfaces.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "name": "ether1",
      "running": true,
      "rx-byte": 1024000,
      "tx-byte": 512000
    }
  ]
}
```

---

## 📱 SMS Settings Endpoints

### GET /api/sms-settings

Get current SMS provider configuration.

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "provider": "advanta",
    "enabled": true,
    "apiKey": "***hidden***",
    "partnerId": "PARTNER123",
    "shortcode": "MYSHORTCODE",
    "customApiUrl": "https://api.advantasms.com/send"
  }
}
```

### POST /api/sms-settings

Update SMS provider configuration.

**Request:**
```json
{
  "provider": "advanta",
  "enabled": true,
  "apiKey": "your-api-key",
  "partnerId": "PARTNER123",
  "shortcode": "MYSHORTCODE",
  "customApiUrl": "https://api.advantasms.com/send"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "SMS settings saved successfully"
}
```

---

## 🔍 Lead Endpoints

### GET /leads

Get list of leads.

### POST /leads

Create a new lead.

### GET /leads/{id}

Get lead details.

---

## Error Handling

### Authentication Error

**Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or expired token"
}
```

### Validation Error

**Response (400):**
```json
{
  "success": false,
  "message": "Email is required"
}
```

### Server Error

**Response (500):**
```json
{
  "success": false,
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. Future versions will include rate limiting.

## Version

Current API Version: **1.0.0**

Last Updated: **January 2024**
