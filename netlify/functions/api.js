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
          message: "Token is valid",
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
