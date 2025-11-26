import { Handler } from "@netlify/functions";
import { neon } from "@neondatabase/serverless";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL || "");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper to create JSON response
function jsonResponse(statusCode: number, data: any) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}

// Extract token from Authorization header
function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  return parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;
}

// Verify JWT token
function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

// Generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" });
}

// Parse request body
async function parseBody(event: any): Promise<any> {
  if (!event.body) return {};
  if (typeof event.body === "string") {
    try {
      return JSON.parse(event.body);
    } catch {
      return {};
    }
  }
  return event.body;
}

// Main handler
const handler: Handler = async (event) => {
  console.log("API Request:", { path: event.path, method: event.httpMethod });

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, "OK");
  }

  try {
    const body = await parseBody(event);
    // Netlify redirects /api/* to /.netlify/functions/api, so the path won't have /api prefix
    let path = event.path.replace("/.netlify/functions/api", "") || "/";
    // Ensure path starts with /
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
    const method = event.httpMethod;

    // AUTH - Login
    if (path === "/auth/login" && method === "POST") {
      const { identifier, password } = body;

      if (!identifier || !password) {
        return jsonResponse(400, {
          success: false,
          message: "Identifier and password are required",
        });
      }

      try {
        const user = await sql(
          `SELECT * FROM "User" WHERE email = $1 OR phone = $1`,
          [identifier],
        );

        if (user.length === 0 || user[0].status !== "active") {
          return jsonResponse(401, {
            success: false,
            message: "Invalid credentials",
          });
        }

        const passwordValid = await bcrypt.compare(password, user[0].password);
        if (!passwordValid) {
          return jsonResponse(401, {
            success: false,
            message: "Invalid credentials",
          });
        }

        const token = generateToken(user[0].id);
        const { password: _, ...userWithoutPassword } = user[0];

        return jsonResponse(200, {
          success: true,
          message: `Login successful. Welcome ${user[0].name}!`,
          user: userWithoutPassword,
          token,
        });
      } catch (error) {
        console.error("Login error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Login failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // AUTH - Get current user
    if (path === "/auth/me" && method === "GET") {
      const token = extractToken(event.headers.authorization);
      if (!token) {
        return jsonResponse(401, {
          success: false,
          message: "Not authenticated",
        });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return jsonResponse(401, {
          success: false,
          message: "Invalid or expired token",
        });
      }

      try {
        const user = await sql(`SELECT * FROM "User" WHERE id = $1`, [
          decoded.userId,
        ]);

        if (user.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "User not found",
          });
        }

        const { password: _, ...userWithoutPassword } = user[0];
        return jsonResponse(200, {
          success: true,
          user: userWithoutPassword,
        });
      } catch (error) {
        console.error("Get user error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to get user",
        });
      }
    }

    // CUSTOMERS - Get all
    if (path === "/customers" && method === "GET") {
      try {
        const customers = await sql(
          `SELECT * FROM "Customer" ORDER BY "registeredAt" DESC`,
        );
        return jsonResponse(200, {
          success: true,
          customers,
          count: customers.length,
        });
      } catch (error) {
        console.error("Get customers error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch customers",
        });
      }
    }

    // CUSTOMERS - Create
    if (path === "/customers" && method === "POST") {
      const { name, email, phone, accountType } = body;

      if (!name || !phone) {
        return jsonResponse(400, {
          success: false,
          message: "Name and phone are required",
        });
      }

      try {
        const result = await sql(
          `INSERT INTO "Customer" (id, name, email, phone, "accountType", status, "registeredAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, 'active', NOW(), NOW()) 
           RETURNING *`,
          [name, email || "", phone, accountType || "residential"],
        );

        return jsonResponse(201, {
          success: true,
          message: "Customer created successfully",
          customer: result[0],
        });
      } catch (error) {
        console.error("Create customer error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to create customer",
        });
      }
    }

    // CUSTOMERS - Get by ID
    if (path.match(/^\/customers\/[^/]+$/) && method === "GET") {
      const customerId = path.split("/").pop();
      try {
        const result = await sql(`SELECT * FROM "Customer" WHERE id = $1`, [
          customerId,
        ]);

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Customer not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          customer: result[0],
        });
      } catch (error) {
        console.error("Get customer error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch customer",
        });
      }
    }

    // CUSTOMERS - Update
    if (path.match(/^\/customers\/[^/]+$/) && method === "PUT") {
      const customerId = path.split("/").pop();
      const { name, email, phone, accountType, status } = body;

      try {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (name !== undefined) {
          updates.push(`name = $${paramCount++}`);
          values.push(name);
        }
        if (email !== undefined) {
          updates.push(`email = $${paramCount++}`);
          values.push(email);
        }
        if (phone !== undefined) {
          updates.push(`phone = $${paramCount++}`);
          values.push(phone);
        }
        if (accountType !== undefined) {
          updates.push(`"accountType" = $${paramCount++}`);
          values.push(accountType);
        }
        if (status !== undefined) {
          updates.push(`status = $${paramCount++}`);
          values.push(status);
        }

        updates.push(`"updatedAt" = NOW()`);
        values.push(customerId);

        const result = await sql(
          `UPDATE "Customer" SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
          values,
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Customer not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          message: "Customer updated successfully",
          customer: result[0],
        });
      } catch (error) {
        console.error("Update customer error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to update customer",
        });
      }
    }

    // CUSTOMERS - Delete
    if (path.match(/^\/customers\/[^/]+$/) && method === "DELETE") {
      const customerId = path.split("/").pop();
      try {
        const result = await sql(
          `DELETE FROM "Customer" WHERE id = $1 RETURNING *`,
          [customerId],
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Customer not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          message: "Customer deleted successfully",
        });
      } catch (error) {
        console.error("Delete customer error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to delete customer",
        });
      }
    }

    // EMPLOYEES - Get all
    if (path === "/employees" && method === "GET") {
      try {
        const employees = await sql(
          `SELECT * FROM "Employee" ORDER BY "createdAt" DESC`,
        );
        return jsonResponse(200, {
          success: true,
          employees,
          count: employees.length,
        });
      } catch (error) {
        console.error("Get employees error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch employees",
        });
      }
    }

    // TICKETS - Get all
    if (path === "/tickets" && method === "GET") {
      try {
        const tickets = await sql(
          `SELECT t.*, c.name as customer_name FROM "Ticket" t 
           LEFT JOIN "Customer" c ON t."customerId" = c.id
           ORDER BY t."createdAt" DESC`,
        );
        return jsonResponse(200, {
          success: true,
          tickets,
          count: tickets.length,
        });
      } catch (error) {
        console.error("Get tickets error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch tickets",
        });
      }
    }

    // TICKETS - Get stats
    if (path === "/tickets/stats" && method === "GET") {
      try {
        const stats = await sql(
          `SELECT 
             COUNT(*) as total,
             COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
             COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as "inProgress",
             COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
             COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
           FROM "Ticket"`,
        );
        return jsonResponse(200, {
          success: true,
          stats: stats[0],
        });
      } catch (error) {
        console.error("Get ticket stats error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch ticket stats",
        });
      }
    }

    // SMS - Send
    if (path === "/sms/send" && method === "POST") {
      const {
        to,
        message,
        provider = "advanta",
        apiKey,
        partnerId,
        shortcode,
        customApiUrl,
      } = body;

      if (!to || !message) {
        return jsonResponse(400, {
          success: false,
          message: "Missing required fields: 'to' and 'message'",
        });
      }

      if (provider === "advanta") {
        if (!apiKey || !partnerId || !shortcode) {
          return jsonResponse(400, {
            success: false,
            message:
              "Missing Advanta SMS credentials: apiKey, partnerId, shortcode",
          });
        }
      }

      const recipients = Array.isArray(to) ? to : [to];
      const validPhoneNumbers = recipients.filter((phone: string) => {
        return /^\+?1?\d{9,15}$/.test(phone.replace(/\D/g, ""));
      });

      if (validPhoneNumbers.length === 0) {
        return jsonResponse(400, {
          success: false,
          message: "No valid phone numbers provided",
        });
      }

      if (message.length === 0 || message.length > 1600) {
        return jsonResponse(400, {
          success: false,
          message: "Message must be between 1 and 1600 characters",
        });
      }

      try {
        if (provider === "advanta" && customApiUrl) {
          const formattedPhones = validPhoneNumbers.map((phone: string) => {
            const digits = phone.replace(/\D/g, "");
            if (digits.startsWith("0")) {
              return "254" + digits.substring(1);
            }
            if (!digits.startsWith("254")) {
              return "254" + digits;
            }
            return digits;
          });

          const advantaPayload = {
            apikey: apiKey,
            partnerID: partnerId,
            shortcode: shortcode,
            mobile: formattedPhones.join(","),
            message: message,
          };

          const response = await fetch(customApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(advantaPayload),
          });

          if (!response.ok) {
            const error = await response.text();
            return jsonResponse(400, {
              success: false,
              message: "Failed to send SMS via Advanta API",
              error,
            });
          }
        }

        const messageIds = validPhoneNumbers.map(
          () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        );

        return jsonResponse(200, {
          success: true,
          message: `SMS sent successfully to ${validPhoneNumbers.length} recipient(s)`,
          messageIds,
          recipients: validPhoneNumbers.length,
        });
      } catch (error) {
        console.error("SMS error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to send SMS",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return jsonResponse(404, {
      error: "Not found",
      debug: { path, method },
    });
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse(500, {
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export { handler };
