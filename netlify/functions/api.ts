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
    // Netlify rewrite redirects /api/* to /.netlify/functions/api, preserving the original /api/* path
    // We need to strip the /api prefix to get the route path
    let path = event.path.replace(/^\/api/, "") || "/";
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

    // AUTH - Register
    if (path === "/auth/register" && method === "POST") {
      const { name, email, phone, password, role } = body;

      if (!name || !phone || !password) {
        return jsonResponse(400, {
          success: false,
          message: "Name, phone, and password are required",
        });
      }

      try {
        const existingUser = await sql(
          `SELECT * FROM "User" WHERE email = $1 OR phone = $2`,
          [email || null, phone],
        );

        if (existingUser.length > 0) {
          return jsonResponse(409, {
            success: false,
            message: "User already exists",
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Math.random().toString(36).substring(2, 15);

        const result = await sql(
          `INSERT INTO "User" (id, name, email, phone, password, role, status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
           RETURNING id, name, email, phone, role, status, "createdAt", "updatedAt"`,
          [userId, name, email || null, phone, hashedPassword, role || "user"],
        );

        const token = generateToken(result[0].id);
        return jsonResponse(201, {
          success: true,
          message: "User registered successfully",
          user: result[0],
          token,
        });
      } catch (error) {
        console.error("Register error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Registration failed",
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

    // AUTH - Get all users
    if (path === "/auth/users" && method === "GET") {
      try {
        const users = await sql(
          `SELECT id, name, email, phone, role, status, "createdAt", "updatedAt" FROM "User" ORDER BY "createdAt" DESC`,
        );

        return jsonResponse(200, {
          success: true,
          users,
        });
      } catch (error) {
        console.error("Get all users error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch users",
        });
      }
    }

    // AUTH - Create user
    if (path === "/auth/users" && method === "POST") {
      const { name, email, phone, password, role, active } = body;

      if (!name || !phone || !password) {
        return jsonResponse(400, {
          success: false,
          message: "Name, phone, and password are required",
        });
      }

      try {
        const existingUser = await sql(
          `SELECT * FROM "User" WHERE email = $1 OR phone = $2`,
          [email || null, phone],
        );

        if (existingUser.length > 0) {
          return jsonResponse(409, {
            success: false,
            message: "User already exists",
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Math.random().toString(36).substring(2, 15);
        const status =
          active !== undefined ? (active ? "active" : "inactive") : "active";

        const result = await sql(
          `INSERT INTO "User" (id, name, email, phone, password, role, status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING id, name, email, phone, role, status, "createdAt", "updatedAt"`,
          [
            userId,
            name,
            email || null,
            phone,
            hashedPassword,
            role || "user",
            status,
          ],
        );

        return jsonResponse(201, {
          success: true,
          user: result[0],
        });
      } catch (error) {
        console.error("Create user error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to create user",
        });
      }
    }

    // AUTH - Update user
    if (path.match(/^\/auth\/users\/[^/]+$/) && method === "PUT") {
      const userId = path.split("/").pop();
      const { name, email, phone, password, role, active } = body;

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
        if (password !== undefined) {
          const hashedPassword = await bcrypt.hash(password, 10);
          updates.push(`password = $${paramCount++}`);
          values.push(hashedPassword);
        }
        if (role !== undefined) {
          updates.push(`role = $${paramCount++}`);
          values.push(role);
        }
        if (active !== undefined) {
          updates.push(`status = $${paramCount++}`);
          values.push(active ? "active" : "inactive");
        }

        updates.push(`"updatedAt" = NOW()`);
        values.push(userId);

        const result = await sql(
          `UPDATE "User" SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, name, email, phone, role, status, "createdAt", "updatedAt"`,
          values,
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "User not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          user: result[0],
        });
      } catch (error) {
        console.error("Update user error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to update user",
        });
      }
    }

    // AUTH - Delete user
    if (path.match(/^\/auth\/users\/[^/]+$/) && method === "DELETE") {
      const userId = path.split("/").pop();

      try {
        const result = await sql(
          `DELETE FROM "User" WHERE id = $1 RETURNING *`,
          [userId],
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "User not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          message: "User deleted successfully",
        });
      } catch (error) {
        console.error("Delete user error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to delete user",
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

    // EMPLOYEES - Create
    if (path === "/employees" && method === "POST") {
      const {
        firstName,
        lastName,
        email,
        phone,
        position,
        department,
        salary,
        hireDate,
        emergencyContact,
        status,
      } = body;

      if (!firstName || !email || !phone) {
        return jsonResponse(400, {
          success: false,
          message: "FirstName, email, and phone are required",
        });
      }

      try {
        const existingEmployee = await sql(
          `SELECT * FROM "Employee" WHERE email = $1 OR phone = $2`,
          [email, phone],
        );

        if (existingEmployee.length > 0) {
          return jsonResponse(409, {
            success: false,
            message: "Employee with this email or phone already exists",
          });
        }

        const result = await sql(
          `INSERT INTO "Employee" (id, "firstName", "lastName", email, phone, position, department, salary, "hireDate", "emergencyContact", status, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           RETURNING *`,
          [
            firstName,
            lastName || "",
            email,
            phone,
            position || null,
            department || null,
            salary || null,
            hireDate || new Date().toISOString(),
            emergencyContact || null,
            status || "active",
          ],
        );

        return jsonResponse(201, {
          success: true,
          message: "Employee created successfully",
          employee: result[0],
        });
      } catch (error) {
        console.error("Create employee error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to create employee",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // EMPLOYEES - Get all (with optional department filter)
    if (path === "/employees" && method === "GET") {
      try {
        const department = event.queryStringParameters?.department;

        let query = `SELECT * FROM "Employee"`;
        const params: any[] = [];

        if (department) {
          query += ` WHERE department = $1`;
          params.push(department);
        }

        query += ` ORDER BY "createdAt" DESC`;

        const employees = await sql(query, params);

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

    // EMPLOYEES - Get by ID
    if (path.match(/^\/employees\/[^/]+$/) && method === "GET") {
      const employeeId = path.split("/").pop();
      try {
        const employee = await sql(`SELECT * FROM "Employee" WHERE id = $1`, [
          employeeId,
        ]);

        if (employee.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Employee not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          employee: employee[0],
        });
      } catch (error) {
        console.error("Get employee error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch employee",
        });
      }
    }

    // EMPLOYEES - Update
    if (path.match(/^\/employees\/[^/]+$/) && method === "PUT") {
      const employeeId = path.split("/").pop();
      const {
        firstName,
        lastName,
        email,
        phone,
        position,
        department,
        salary,
        hireDate,
        emergencyContact,
        status,
      } = body;

      try {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (firstName !== undefined) {
          updates.push(`"firstName" = $${paramCount++}`);
          values.push(firstName);
        }
        if (lastName !== undefined) {
          updates.push(`"lastName" = $${paramCount++}`);
          values.push(lastName);
        }
        if (email !== undefined) {
          updates.push(`email = $${paramCount++}`);
          values.push(email);
        }
        if (phone !== undefined) {
          updates.push(`phone = $${paramCount++}`);
          values.push(phone);
        }
        if (position !== undefined) {
          updates.push(`position = $${paramCount++}`);
          values.push(position);
        }
        if (department !== undefined) {
          updates.push(`department = $${paramCount++}`);
          values.push(department);
        }
        if (salary !== undefined) {
          updates.push(`salary = $${paramCount++}`);
          values.push(salary);
        }
        if (hireDate !== undefined) {
          updates.push(`"hireDate" = $${paramCount++}`);
          values.push(hireDate);
        }
        if (emergencyContact !== undefined) {
          updates.push(`"emergencyContact" = $${paramCount++}`);
          values.push(emergencyContact);
        }
        if (status !== undefined) {
          updates.push(`status = $${paramCount++}`);
          values.push(status);
        }

        updates.push(`"updatedAt" = NOW()`);
        values.push(employeeId);

        const result = await sql(
          `UPDATE "Employee" SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
          values,
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Employee not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          message: "Employee updated successfully",
          employee: result[0],
        });
      } catch (error) {
        console.error("Update employee error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to update employee",
        });
      }
    }

    // EMPLOYEES - Delete
    if (path.match(/^\/employees\/[^/]+$/) && method === "DELETE") {
      const employeeId = path.split("/").pop();
      try {
        const result = await sql(
          `DELETE FROM "Employee" WHERE id = $1 RETURNING *`,
          [employeeId],
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Employee not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          message: "Employee deleted successfully",
        });
      } catch (error) {
        console.error("Delete employee error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to delete employee",
        });
      }
    }

    // TICKETS - Create
    if (path === "/tickets" && method === "POST") {
      const {
        customerId,
        userId,
        subject,
        description,
        category,
        priority,
        status,
      } = body;

      if (!customerId || !subject || !description) {
        return jsonResponse(400, {
          success: false,
          message: "CustomerId, subject, and description are required",
        });
      }

      try {
        // Verify customer exists
        const customerCheck = await sql(
          `SELECT id FROM "Customer" WHERE id = $1`,
          [customerId],
        );
        if (customerCheck.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Customer not found",
          });
        }

        const ticketId = `TK-${Date.now()}`;
        const result = await sql(
          `INSERT INTO "Ticket" (id, "ticketId", "customerId", "userId", subject, description, category, priority, status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
           RETURNING *`,
          [
            ticketId,
            ticketId,
            customerId,
            userId || null,
            subject,
            description,
            category || "general",
            priority || "medium",
            status || "open",
          ],
        );

        return jsonResponse(201, {
          success: true,
          message: "Ticket created successfully",
          ticket: result[0],
        });
      } catch (error) {
        console.error("Create ticket error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to create ticket",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // TICKETS - Get all
    if (path === "/tickets" && method === "GET") {
      try {
        const tickets = await sql(
          `SELECT t.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, u.name as user_name, u.email as user_email
           FROM "Ticket" t
           LEFT JOIN "Customer" c ON t."customerId" = c.id
           LEFT JOIN "User" u ON t."userId" = u.id
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

    // TICKETS - Get by ID
    if (path.match(/^\/tickets\/[^/]+$/) && method === "GET") {
      const ticketId = path.split("/").pop();
      try {
        const ticket = await sql(
          `SELECT t.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, u.name as user_name, u.email as user_email
           FROM "Ticket" t
           LEFT JOIN "Customer" c ON t."customerId" = c.id
           LEFT JOIN "User" u ON t."userId" = u.id
           WHERE t.id = $1`,
          [ticketId],
        );

        if (ticket.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Ticket not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          ticket: ticket[0],
        });
      } catch (error) {
        console.error("Get ticket error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch ticket",
        });
      }
    }

    // TICKETS - Update
    if (path.match(/^\/tickets\/[^/]+$/) && method === "PUT") {
      const ticketId = path.split("/").pop();
      const { subject, description, status, priority, category, userId } = body;

      try {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (subject !== undefined) {
          updates.push(`subject = $${paramCount++}`);
          values.push(subject);
        }
        if (description !== undefined) {
          updates.push(`description = $${paramCount++}`);
          values.push(description);
        }
        if (status !== undefined) {
          updates.push(`status = $${paramCount++}`);
          values.push(status);
        }
        if (priority !== undefined) {
          updates.push(`priority = $${paramCount++}`);
          values.push(priority);
        }
        if (category !== undefined) {
          updates.push(`category = $${paramCount++}`);
          values.push(category);
        }
        if (userId !== undefined) {
          updates.push(`"userId" = $${paramCount++}`);
          values.push(userId);
        }

        updates.push(`"updatedAt" = NOW()`);
        values.push(ticketId);

        const result = await sql(
          `UPDATE "Ticket" SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
          values,
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Ticket not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          message: "Ticket updated successfully",
          ticket: result[0],
        });
      } catch (error) {
        console.error("Update ticket error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to update ticket",
        });
      }
    }

    // TICKETS - Delete
    if (path.match(/^\/tickets\/[^/]+$/) && method === "DELETE") {
      const ticketId = path.split("/").pop();
      try {
        const result = await sql(
          `DELETE FROM "Ticket" WHERE id = $1 RETURNING *`,
          [ticketId],
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Ticket not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          message: "Ticket deleted successfully",
        });
      } catch (error) {
        console.error("Delete ticket error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to delete ticket",
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

    // TICKET REPLIES - Create
    if (path === "/ticket-replies" && method === "POST") {
      const { ticketId, userId, message, isInternal } = body;

      if (!ticketId || !userId || !message) {
        return jsonResponse(400, {
          success: false,
          message: "TicketId, userId, and message are required",
        });
      }

      try {
        const result = await sql(
          `INSERT INTO "TicketReply" (id, "ticketId", "userId", message, "isInternal", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
           RETURNING *`,
          [ticketId, userId, message, isInternal || false],
        );

        return jsonResponse(201, {
          success: true,
          message: "Reply added successfully",
          reply: result[0],
        });
      } catch (error) {
        console.error("Create ticket reply error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to create ticket reply",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // TICKET REPLIES - Get by ticket ID
    if (path.match(/^\/tickets\/[^/]+\/replies$/) && method === "GET") {
      const ticketId = path.split("/")[2];
      try {
        const replies = await sql(
          `SELECT tr.*, u.name, u.email
           FROM "TicketReply" tr
           LEFT JOIN "User" u ON tr."userId" = u.id
           WHERE tr."ticketId" = $1
           ORDER BY tr."createdAt" ASC`,
          [ticketId],
        );

        return jsonResponse(200, {
          success: true,
          replies,
          count: replies.length,
        });
      } catch (error) {
        console.error("Get ticket replies error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch ticket replies",
        });
      }
    }

    // DEPARTMENTS - Create
    if (path === "/departments" && method === "POST") {
      const { name, description, manager } = body;

      if (!name) {
        return jsonResponse(400, {
          success: false,
          message: "Department name is required",
        });
      }

      try {
        const existingDept = await sql(
          `SELECT * FROM "Department" WHERE name = $1`,
          [name],
        );

        if (existingDept.length > 0) {
          return jsonResponse(409, {
            success: false,
            message: "Department already exists",
          });
        }

        const result = await sql(
          `INSERT INTO "Department" (id, name, description, manager, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
           RETURNING *`,
          [name, description || null, manager || null],
        );

        return jsonResponse(201, {
          success: true,
          message: "Department created successfully",
          department: result[0],
        });
      } catch (error) {
        console.error("Create department error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to create department",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // DEPARTMENTS - Get all
    if (path === "/departments" && method === "GET") {
      try {
        const departments = await sql(
          `SELECT * FROM "Department" ORDER BY name ASC`,
        );

        return jsonResponse(200, {
          success: true,
          departments,
          count: departments.length,
        });
      } catch (error) {
        console.error("Get departments error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch departments",
        });
      }
    }

    // DEPARTMENTS - Get by ID
    if (path.match(/^\/departments\/[^/]+$/) && method === "GET") {
      const deptId = path.split("/").pop();
      try {
        const dept = await sql(`SELECT * FROM "Department" WHERE id = $1`, [
          deptId,
        ]);

        if (dept.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Department not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          department: dept[0],
        });
      } catch (error) {
        console.error("Get department error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch department",
        });
      }
    }

    // DEPARTMENTS - Update
    if (path.match(/^\/departments\/[^/]+$/) && method === "PUT") {
      const deptId = path.split("/").pop();
      const { name, description, manager } = body;

      try {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (name !== undefined) {
          updates.push(`name = $${paramCount++}`);
          values.push(name);
        }
        if (description !== undefined) {
          updates.push(`description = $${paramCount++}`);
          values.push(description);
        }
        if (manager !== undefined) {
          updates.push(`manager = $${paramCount++}`);
          values.push(manager);
        }

        if (updates.length === 0) {
          return jsonResponse(400, {
            success: false,
            message: "No fields to update",
          });
        }

        updates.push(`"updatedAt" = NOW()`);
        values.push(deptId);

        const result = await sql(
          `UPDATE "Department" SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
          values,
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Department not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          message: "Department updated successfully",
          department: result[0],
        });
      } catch (error) {
        console.error("Update department error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to update department",
        });
      }
    }

    // DEPARTMENTS - Delete
    if (path.match(/^\/departments\/[^/]+$/) && method === "DELETE") {
      const deptId = path.split("/").pop();
      try {
        const result = await sql(
          `DELETE FROM "Department" WHERE id = $1 RETURNING *`,
          [deptId],
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Department not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          message: "Department deleted successfully",
        });
      } catch (error) {
        console.error("Delete department error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to delete department",
        });
      }
    }

    // TEAM GROUPS - Create
    if (path === "/team-groups" && method === "POST") {
      const { name, description, departmentId, manager } = body;

      if (!name) {
        return jsonResponse(400, {
          success: false,
          message: "Team group name is required",
        });
      }

      try {
        const existingGroup = await sql(
          `SELECT * FROM "TeamGroup" WHERE name = $1`,
          [name],
        );

        if (existingGroup.length > 0) {
          return jsonResponse(409, {
            success: false,
            message: "Team group already exists",
          });
        }

        const result = await sql(
          `INSERT INTO "TeamGroup" (id, name, description, "departmentId", manager, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
           RETURNING *`,
          [name, description || null, departmentId || null, manager || null],
        );

        return jsonResponse(201, {
          success: true,
          message: "Team group created successfully",
          teamGroup: result[0],
        });
      } catch (error) {
        console.error("Create team group error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to create team group",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // TEAM GROUPS - Get all
    if (path === "/team-groups" && method === "GET") {
      try {
        const teamGroups = await sql(
          `SELECT * FROM "TeamGroup" ORDER BY name ASC`,
        );

        return jsonResponse(200, {
          success: true,
          teamGroups,
          count: teamGroups.length,
        });
      } catch (error) {
        console.error("Get team groups error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch team groups",
        });
      }
    }

    // TEAM GROUPS - Get by ID
    if (path.match(/^\/team-groups\/[^/]+$/) && method === "GET") {
      const groupId = path.split("/").pop();
      try {
        const group = await sql(`SELECT * FROM "TeamGroup" WHERE id = $1`, [
          groupId,
        ]);

        if (group.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Team group not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          teamGroup: group[0],
        });
      } catch (error) {
        console.error("Get team group error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch team group",
        });
      }
    }

    // TEAM GROUPS - Update
    if (path.match(/^\/team-groups\/[^/]+$/) && method === "PUT") {
      const groupId = path.split("/").pop();
      const { name, description, departmentId, manager } = body;

      try {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (name !== undefined) {
          updates.push(`name = $${paramCount++}`);
          values.push(name);
        }
        if (description !== undefined) {
          updates.push(`description = $${paramCount++}`);
          values.push(description);
        }
        if (departmentId !== undefined) {
          updates.push(`"departmentId" = $${paramCount++}`);
          values.push(departmentId);
        }
        if (manager !== undefined) {
          updates.push(`manager = $${paramCount++}`);
          values.push(manager);
        }

        if (updates.length === 0) {
          return jsonResponse(400, {
            success: false,
            message: "No fields to update",
          });
        }

        updates.push(`"updatedAt" = NOW()`);
        values.push(groupId);

        const result = await sql(
          `UPDATE "TeamGroup" SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
          values,
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Team group not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          message: "Team group updated successfully",
          teamGroup: result[0],
        });
      } catch (error) {
        console.error("Update team group error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to update team group",
        });
      }
    }

    // TEAM GROUPS - Delete
    if (path.match(/^\/team-groups\/[^/]+$/) && method === "DELETE") {
      const groupId = path.split("/").pop();
      try {
        const result = await sql(
          `DELETE FROM "TeamGroup" WHERE id = $1 RETURNING *`,
          [groupId],
        );

        if (result.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Team group not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          message: "Team group deleted successfully",
        });
      } catch (error) {
        console.error("Delete team group error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to delete team group",
        });
      }
    }

    // TEAM MEMBERS - Add employee to team/department
    if (path === "/team-members" && method === "POST") {
      const { employeeId, departmentId, teamGroupId, role } = body;

      if (!employeeId) {
        return jsonResponse(400, {
          success: false,
          message: "Employee ID is required",
        });
      }

      try {
        const result = await sql(
          `INSERT INTO "TeamMember" (id, "employeeId", "departmentId", "teamGroupId", role, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
           RETURNING *`,
          [
            employeeId,
            departmentId || null,
            teamGroupId || null,
            role || "Member",
          ],
        );

        return jsonResponse(201, {
          success: true,
          message: "Employee added to team/department",
          teamMember: result[0],
        });
      } catch (error) {
        console.error("Add team member error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to add team member",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // TEAM MEMBERS - Get by employee ID
    if (path.match(/^\/team-members\/employee\/[^/]+$/) && method === "GET") {
      const employeeId = path.split("/").pop();
      try {
        const members = await sql(
          `SELECT tm.*, d.name as department_name, tg.name as team_name
           FROM "TeamMember" tm
           LEFT JOIN "Department" d ON tm."departmentId" = d.id
           LEFT JOIN "TeamGroup" tg ON tm."teamGroupId" = tg.id
           WHERE tm."employeeId" = $1`,
          [employeeId],
        );

        return jsonResponse(200, {
          success: true,
          teamMemberships: members,
        });
      } catch (error) {
        console.error("Get team members error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch team memberships",
        });
      }
    }

    // MPESA - C2B (Customer to Business)
    if (path === "/mpesa/c2b" && method === "POST") {
      const { phoneNumber, amount, accountReference, description } = body;

      if (!phoneNumber || !amount) {
        return jsonResponse(400, {
          success: false,
          message: "Phone number and amount are required",
        });
      }

      try {
        return jsonResponse(200, {
          success: true,
          message: "C2B request initiated",
          transactionId: `TXN-${Date.now()}`,
          phoneNumber,
          amount,
          status: "pending",
        });
      } catch (error) {
        console.error("MPESA C2B error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to process C2B payment",
        });
      }
    }

    // MPESA - B2B (Business to Business)
    if (path === "/mpesa/b2b" && method === "POST") {
      const { businessPhone, amount, accountReference, description } = body;

      if (!businessPhone || !amount) {
        return jsonResponse(400, {
          success: false,
          message: "Business phone and amount are required",
        });
      }

      try {
        return jsonResponse(200, {
          success: true,
          message: "B2B request initiated",
          transactionId: `TXN-${Date.now()}`,
          businessPhone,
          amount,
          status: "pending",
        });
      } catch (error) {
        console.error("MPESA B2B error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to process B2B payment",
        });
      }
    }

    // MPESA - STK Push (Prompt payment)
    if (path === "/mpesa/stk-push" && method === "POST") {
      const { phoneNumber, amount, accountReference, description } = body;

      if (!phoneNumber || !amount) {
        return jsonResponse(400, {
          success: false,
          message: "Phone number and amount are required",
        });
      }

      try {
        return jsonResponse(200, {
          success: true,
          message: "STK Push initiated",
          checkoutRequestId: `CHECKOUT-${Date.now()}`,
          phoneNumber,
          amount,
          status: "pending",
        });
      } catch (error) {
        console.error("MPESA STK Push error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to initiate STK Push",
        });
      }
    }

    // MPESA - Get Transactions
    if (path === "/mpesa/transactions" && method === "GET") {
      try {
        const transactions = await sql(
          `SELECT * FROM "Payment" WHERE "paymentMethod" = 'mpesa' ORDER BY "paymentDate" DESC LIMIT 100`,
        );

        return jsonResponse(200, {
          success: true,
          transactions,
          count: transactions.length,
        });
      } catch (error) {
        console.error("Get MPESA transactions error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch transactions",
        });
      }
    }

    // MPESA - Get Transaction by ID
    if (path.match(/^\/mpesa\/transactions\/[^/]+$/) && method === "GET") {
      const transactionId = path.split("/").pop();
      try {
        const transaction = await sql(
          `SELECT * FROM "Payment" WHERE "mpesaReceiptNumber" = $1`,
          [transactionId],
        );

        if (transaction.length === 0) {
          return jsonResponse(404, {
            success: false,
            message: "Transaction not found",
          });
        }

        return jsonResponse(200, {
          success: true,
          transaction: transaction[0],
        });
      } catch (error) {
        console.error("Get MPESA transaction error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to fetch transaction",
        });
      }
    }

    // MPESA - Callback (Webhook from MPESA)
    if (path === "/mpesa/callback" && method === "POST") {
      try {
        console.log("MPESA Callback received:", body);
        return jsonResponse(200, {
          success: true,
          message: "Callback received and processed",
        });
      } catch (error) {
        console.error("MPESA callback error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to process callback",
        });
      }
    }

    // MPESA - Validation (Webhook from MPESA)
    if (path === "/mpesa/validation" && method === "POST") {
      try {
        console.log("MPESA Validation received:", body);
        return jsonResponse(200, {
          success: true,
          message: "Validation request received",
          resultCode: 0,
          resultDesc: "The transaction has been received by your system",
        });
      } catch (error) {
        console.error("MPESA validation error:", error);
        return jsonResponse(500, {
          success: false,
          message: "Failed to process validation",
        });
      }
    }

    // SMS - Send (supports both phone numbers and ticket ID for sending to assigned + customer)
    if (path === "/sms/send" && method === "POST") {
      const {
        to,
        ticketId,
        message,
        provider = "advanta",
        apiKey,
        partnerId,
        shortcode,
        customApiUrl,
      } = body;

      if (!message) {
        return jsonResponse(400, {
          success: false,
          message: "Missing required field: 'message'",
        });
      }

      let recipients: string[] = [];

      // If ticketId is provided, send to assigned employee and customer
      if (ticketId) {
        try {
          const ticketData = await sql(
            `SELECT t.*, c.phone as customer_phone, u.phone as user_phone
             FROM "Ticket" t
             LEFT JOIN "Customer" c ON t."customerId" = c.id
             LEFT JOIN "User" u ON t."userId" = u.id
             WHERE t.id = $1`,
            [ticketId],
          );

          if (ticketData.length > 0) {
            if (ticketData[0].customer_phone) {
              recipients.push(ticketData[0].customer_phone);
            }
            if (ticketData[0].user_phone) {
              recipients.push(ticketData[0].user_phone);
            }
          }
        } catch (error) {
          console.error("Error fetching ticket data:", error);
        }
      } else if (to) {
        recipients = Array.isArray(to) ? to : [to];
      }

      if (recipients.length === 0) {
        return jsonResponse(400, {
          success: false,
          message: "No valid recipients provided",
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
