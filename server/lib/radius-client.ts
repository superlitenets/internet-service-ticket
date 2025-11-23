export interface RADIUSConfig {
  host: string;
  port: number;
  sharedSecret: string;
  enabled: boolean;
}

export interface RADIUSUser {
  username: string;
  password: string;
  userType: "pppoe" | "hotspot";
  attributes?: Record<string, any>;
}

export interface RADIUSResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * RADIUS Client for user authentication and management
 * Simulates RADIUS operations for demo purposes
 * In production, integrate with actual RADIUS server using `radius` npm package
 */
export class RADIUSClient {
  private config: RADIUSConfig;
  private users: Map<string, RADIUSUser> = new Map();

  constructor(config: RADIUSConfig) {
    this.config = config;
  }

  /**
   * Test connection to RADIUS server
   */
  async testConnection(): Promise<RADIUSResponse> {
    try {
      if (!this.config.enabled) {
        return {
          success: false,
          message: "RADIUS is not enabled",
          error: "RADIUS_DISABLED",
        };
      }

      if (!this.config.host || !this.config.port || !this.config.sharedSecret) {
        return {
          success: false,
          message: "RADIUS configuration is incomplete",
          error: "INCOMPLETE_CONFIG",
        };
      }

      // In production, this would make an actual RADIUS Access-Request packet
      // For demo, we simulate a successful connection test
      console.log(`Testing RADIUS connection to ${this.config.host}:${this.config.port}`);

      return {
        success: true,
        message: `Successfully connected to RADIUS server ${this.config.host}:${this.config.port}`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to connect to RADIUS server",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create or update RADIUS user accounts (both PPPoE and Hotspot)
   */
  async createUser(user: RADIUSUser): Promise<RADIUSResponse> {
    try {
      if (!this.config.enabled) {
        return {
          success: false,
          message: "RADIUS is not enabled",
          error: "RADIUS_DISABLED",
        };
      }

      if (!user.username || !user.password) {
        return {
          success: false,
          message: "Username and password are required",
          error: "MISSING_CREDENTIALS",
        };
      }

      // Validate username format (RADIUS usernames typically have restrictions)
      if (!/^[a-zA-Z0-9._-]+$/.test(user.username)) {
        return {
          success: false,
          message: "Invalid username format. Use only alphanumeric characters, dots, hyphens, and underscores",
          error: "INVALID_USERNAME",
        };
      }

      // In production, this would send RADIUS packets to create/update user
      // For demo, we store in memory
      this.users.set(user.username, user);

      console.log(`RADIUS: Created/updated user ${user.username} (${user.userType})`);

      return {
        success: true,
        message: `User ${user.username} created/updated in RADIUS server`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to create/update RADIUS user",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create multiple users at once (for batch operations)
   */
  async createUsers(users: RADIUSUser[]): Promise<RADIUSResponse> {
    try {
      if (!this.config.enabled) {
        return {
          success: false,
          message: "RADIUS is not enabled",
          error: "RADIUS_DISABLED",
        };
      }

      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const user of users) {
        const result = await this.createUser(user);
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(`${user.username}: ${result.message}`);
        }
      }

      return {
        success: results.failed === 0,
        message: `Created ${results.successful} users, ${results.failed} failed`,
        error: results.errors.length > 0 ? results.errors.join("; ") : undefined,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to create RADIUS users",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete RADIUS user account
   */
  async deleteUser(username: string, userType: "pppoe" | "hotspot"): Promise<RADIUSResponse> {
    try {
      if (!this.config.enabled) {
        return {
          success: false,
          message: "RADIUS is not enabled",
          error: "RADIUS_DISABLED",
        };
      }

      if (!username) {
        return {
          success: false,
          message: "Username is required",
          error: "MISSING_USERNAME",
        };
      }

      // In production, this would send RADIUS packets to delete user
      // For demo, we remove from in-memory storage
      const deleted = this.users.delete(username);

      if (deleted) {
        console.log(`RADIUS: Deleted user ${username} (${userType})`);
        return {
          success: true,
          message: `User ${username} deleted from RADIUS server`,
        };
      } else {
        return {
          success: true,
          message: `User ${username} not found in RADIUS server (may already be deleted)`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Failed to delete RADIUS user",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Disable user account (without deleting)
   */
  async disableUser(username: string): Promise<RADIUSResponse> {
    try {
      if (!this.config.enabled) {
        return {
          success: false,
          message: "RADIUS is not enabled",
          error: "RADIUS_DISABLED",
        };
      }

      const user = this.users.get(username);
      if (user) {
        user.attributes = user.attributes || {};
        user.attributes.disabled = true;
      }

      console.log(`RADIUS: Disabled user ${username}`);

      return {
        success: true,
        message: `User ${username} disabled in RADIUS server`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to disable RADIUS user",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Enable user account
   */
  async enableUser(username: string): Promise<RADIUSResponse> {
    try {
      if (!this.config.enabled) {
        return {
          success: false,
          message: "RADIUS is not enabled",
          error: "RADIUS_DISABLED",
        };
      }

      const user = this.users.get(username);
      if (user) {
        user.attributes = user.attributes || {};
        user.attributes.disabled = false;
      }

      console.log(`RADIUS: Enabled user ${username}`);

      return {
        success: true,
        message: `User ${username} enabled in RADIUS server`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to enable RADIUS user",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Authenticate user (PAP - Password Authentication Protocol)
   */
  async authenticateUser(username: string, password: string): Promise<RADIUSResponse> {
    try {
      if (!this.config.enabled) {
        return {
          success: false,
          message: "RADIUS is not enabled",
          error: "RADIUS_DISABLED",
        };
      }

      // In production, this would send actual RADIUS Access-Request
      const user = this.users.get(username);

      if (!user) {
        console.log(`RADIUS: Authentication failed for ${username} (user not found)`);
        return {
          success: false,
          message: "User not found",
          error: "USER_NOT_FOUND",
        };
      }

      if (user.attributes?.disabled) {
        console.log(`RADIUS: Authentication failed for ${username} (user disabled)`);
        return {
          success: false,
          message: "User account is disabled",
          error: "USER_DISABLED",
        };
      }

      if (user.password !== password) {
        console.log(`RADIUS: Authentication failed for ${username} (invalid password)`);
        return {
          success: false,
          message: "Invalid password",
          error: "INVALID_PASSWORD",
        };
      }

      console.log(`RADIUS: Authentication successful for ${username}`);

      return {
        success: true,
        message: `User ${username} authenticated successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Authentication failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(username: string, newPassword: string): Promise<RADIUSResponse> {
    try {
      if (!this.config.enabled) {
        return {
          success: false,
          message: "RADIUS is not enabled",
          error: "RADIUS_DISABLED",
        };
      }

      const user = this.users.get(username);
      if (!user) {
        return {
          success: false,
          message: "User not found",
          error: "USER_NOT_FOUND",
        };
      }

      user.password = newPassword;

      console.log(`RADIUS: Updated password for user ${username}`);

      return {
        success: true,
        message: `Password updated for user ${username}`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update password",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all users (for debugging/monitoring)
   */
  getUsers(): RADIUSUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Clear all users (for testing)
   */
  clearUsers(): void {
    this.users.clear();
  }
}

// Global RADIUS client instances per configuration
const radiusClients: Map<string, RADIUSClient> = new Map();

/**
 * Get or create RADIUS client for a configuration
 */
export function getRADIUSClient(config: RADIUSConfig): RADIUSClient {
  const key = `${config.host}:${config.port}`;
  if (!radiusClients.has(key)) {
    radiusClients.set(key, new RADIUSClient(config));
  }
  return radiusClients.get(key)!;
}

/**
 * Clear all RADIUS clients
 */
export function clearRADIUSClients(): void {
  radiusClients.clear();
}
