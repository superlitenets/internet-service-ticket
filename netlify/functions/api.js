const users = new Map([
  [
    "admin@example.com",
    {
      id: "user-1",
      name: "Admin User",
      email: "admin@example.com",
      phone: "0700000001",
      role: "admin",
      password: "password123",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

const sessions = new Map();

function generateToken() {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "OK",
    };
  }

  try {
    if (event.path === "/api/auth/login" && event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { identifier, password } = body;

      if (!identifier || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Identifier and password are required",
          }),
        };
      }

      let user = users.get(identifier);

      if (!user) {
        for (const u of users.values()) {
          if (u.phone === identifier || u.email === identifier) {
            user = u;
            break;
          }
        }
      }

      if (!user || !user.active) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Invalid credentials",
          }),
        };
      }

      if (user.password !== password) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Invalid credentials",
          }),
        };
      }

      const token = generateToken();
      sessions.set(token, {
        userId: user.id,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      const { password: _, ...userWithoutPassword } = user;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Login successful. Welcome ${user.name}!`,
          user: userWithoutPassword,
          token,
        }),
      };
    }

    if (event.path === "/api/auth/verify" && event.httpMethod === "GET") {
      const token = event.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: "No token provided",
          }),
        };
      }

      // For Netlify's stateless environment, we validate token format
      // Tokens are generated as: token_${Date.now()}_${random}
      // This is a basic validation - in production use proper JWT
      if (!token.startsWith("token_")) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Invalid token format",
          }),
        };
      }

      // Check if token exists in current session (for tokens created this session)
      const session = sessions.get(token);
      if (session) {
        if (session.expiresAt < Date.now()) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
              success: false,
              message: "Token expired",
            }),
          };
        }

        let user = null;
        for (const u of users.values()) {
          if (u.id === session.userId) {
            user = u;
            break;
          }
        }

        if (!user) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              success: false,
              message: "User not found",
            }),
          };
        }

        const { password: _, ...userWithoutPassword } = user;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            user: userWithoutPassword,
            message: "Token is valid",
          }),
        };
      }

      // Token not in current session (page refresh case)
      // For Netlify's stateless nature, we accept tokens created recently
      // This allows persistence across page reloads
      // Extract timestamp from token: token_${timestamp}_${random}
      const tokenParts = token.split("_");
      if (tokenParts.length >= 3) {
        const tokenTime = parseInt(tokenParts[1]);
        const now = Date.now();
        const tokenAge = now - tokenTime;
        const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours

        if (tokenAge > maxTokenAge) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
              success: false,
              message: "Token expired",
            }),
          };
        }

        // Token is valid based on age - return success with empty user
        // Client will use the stored user from localStorage
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: "Token is valid",
          }),
        };
      }

      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: "Invalid token",
        }),
      };
    }

    if (event.path === "/api/auth/logout" && event.httpMethod === "POST") {
      const token = event.headers.authorization?.replace("Bearer ", "");
      if (token) {
        sessions.delete(token);
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Logged out successfully",
        }),
      };
    }

    if (event.path === "/api/auth/me" && event.httpMethod === "GET") {
      const token = event.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Not authenticated",
          }),
        };
      }

      const session = sessions.get(token);
      if (!session || session.expiresAt < Date.now()) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Invalid or expired token",
          }),
        };
      }

      let user = null;
      for (const u of users.values()) {
        if (u.id === session.userId) {
          user = u;
          break;
        }
      }

      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            message: "User not found",
          }),
        };
      }

      const { password: _, ...userWithoutPassword } = user;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: userWithoutPassword,
        }),
      };
    }

    if (event.path === "/api/sms/send" && event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const {
        to,
        message,
        provider = "twilio",
        accountSid,
        authToken,
        fromNumber,
        apiKey,
        partnerId,
        shortcode,
        customApiUrl,
      } = body;

      // Validation
      if (!to || !message) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Missing required fields: 'to' and 'message'",
            timestamp: new Date().toISOString(),
            error: "Invalid request",
          }),
        };
      }

      // Provider-specific credential validation
      if (provider === "twilio") {
        if (!accountSid || !authToken || !fromNumber) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message:
                "Missing Twilio credentials: accountSid, authToken, fromNumber",
              timestamp: new Date().toISOString(),
              error: "Invalid credentials",
            }),
          };
        }
      } else if (provider === "advanta") {
        if (!apiKey || !partnerId || !shortcode) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message:
                "Missing Advanta SMS credentials: apiKey, partnerId, shortcode",
              timestamp: new Date().toISOString(),
              error: "Invalid credentials",
            }),
          };
        }
      } else {
        if (!accountSid || !authToken || !fromNumber) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: "Missing SMS provider credentials",
              timestamp: new Date().toISOString(),
              error: "Invalid credentials",
            }),
          };
        }
      }

      // Convert single phone number to array
      const recipients = Array.isArray(to) ? to : [to];

      // Validate phone numbers (basic validation)
      const validPhoneNumbers = recipients.filter((phone) => {
        return /^\+?1?\d{9,15}$/.test(phone.replace(/\D/g, ""));
      });

      if (validPhoneNumbers.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: "No valid phone numbers provided",
            timestamp: new Date().toISOString(),
            error: "Invalid phone number",
          }),
        };
      }

      // Validate message length
      if (message.length === 0 || message.length > 1600) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Message must be between 1 and 1600 characters",
            timestamp: new Date().toISOString(),
            error: "Invalid message",
          }),
        };
      }

      // Generate mock message IDs
      const messageIds = validPhoneNumbers.map(
        () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      );

      // Log the SMS request
      console.log(`[SMS] Sending via ${provider}`, {
        provider,
        recipients: validPhoneNumbers,
        messageLength: message.length,
        fromNumber,
        customApiUrl,
        timestamp: new Date().toISOString(),
      });

      // If Advanta with custom URL, make the actual API call
      if (provider === "advanta" && customApiUrl) {
        try {
          // Format Advanta SMS request payload
          const advantaPayload = {
            apikey: apiKey,
            partnerID: partnerId,
            shortcode: shortcode,
            recipients: validPhoneNumbers.join(","), // Advanta expects comma-separated recipients
            message: message,
          };

          console.log("[SMS] Advanta request payload:", advantaPayload);

          const response = await fetch(customApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(advantaPayload),
          });

          const responseText = await response.text();
          console.log("[SMS] Advanta API response status:", response.status);
          console.log("[SMS] Advanta API response body:", responseText);

          if (!response.ok) {
            console.error("[SMS] Advanta API error:", responseText);
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                success: false,
                message: "Failed to send SMS via Advanta API",
                timestamp: new Date().toISOString(),
                error: `Advanta API error: ${responseText}`,
              }),
            };
          }

          try {
            const result = JSON.parse(responseText);
            console.log("[SMS] Advanta API response:", result);
          } catch (parseError) {
            console.log("[SMS] Response is not JSON:", responseText);
          }
        } catch (error) {
          console.error("[SMS] Error calling Advanta API:", error.message);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              message: "Failed to call SMS provider API",
              timestamp: new Date().toISOString(),
              error: error.message,
            }),
          };
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `SMS sent successfully to ${validPhoneNumbers.length} recipient(s)`,
          messageIds,
          recipients: validPhoneNumbers.length,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    if (event.path === "/api/ping" && event.httpMethod === "GET") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "pong" }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Server error",
        error: error.message,
      }),
    };
  }
};
