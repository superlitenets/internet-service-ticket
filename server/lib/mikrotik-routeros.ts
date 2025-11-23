/**
 * Mikrotik RouterOS API Client
 * Allows connection and interaction with Mikrotik RouterOS devices
 */

export interface RouterOSCredentials {
  apiUrl: string;
  username: string;
  password: string;
  useSsl: boolean;
  port?: number;
}

export interface RouterOSInterfaceStats {
  interfaceName: string;
  running: boolean;
  disabled: boolean;
  bytes_in: number;
  bytes_out: number;
  packets_in: number;
  packets_out: number;
  errors_in: number;
  errors_out: number;
  drops_in: number;
  drops_out: number;
  collisions: number;
}

export interface RouterOSUserInfo {
  username: string;
  uptime: string; // format: 00:00:00
  uploadsPerConnection: number;
  downloadsPerConnection: number;
  uploadLimit?: number;
  downloadLimit?: number;
  uploadCurrent?: number;
  downloadCurrent?: number;
}

export interface RouterOSDeviceInfo {
  systemIdentity: string;
  firmwareVersion: string;
  boardName: string;
  cpuCount: number;
  uptime: string;
  cpuLoad: number;
  totalMemory: number;
  freeMemory: number;
  diskSize?: number;
  diskFree?: number;
}

export interface RouterOSQueueInfo {
  name: string;
  target: string;
  maxLimit: string;
  burst: string;
  parentQueue?: string;
  totalBytes: number;
  totalPackets: number;
  droppedBytes: number;
  droppedPackets: number;
}

export class MikrotikRouterOSClient {
  private credentials: RouterOSCredentials;
  private cachedDeviceInfo: RouterOSDeviceInfo | null = null;
  private cacheExpiry: number = 0;

  constructor(credentials: RouterOSCredentials) {
    this.credentials = {
      ...credentials,
      port: credentials.port || 8728,
    };
  }

  /**
   * Test connection to RouterOS device
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    deviceInfo?: RouterOSDeviceInfo;
  }> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      return {
        success: true,
        message: `Successfully connected to ${deviceInfo.systemIdentity}`,
        deviceInfo,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to RouterOS",
      };
    }
  }

  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<RouterOSDeviceInfo> {
    // Check cache
    if (this.cachedDeviceInfo && Date.now() < this.cacheExpiry) {
      return this.cachedDeviceInfo;
    }

    try {
      const data = await this.executeCommand("/system/identity/print");
      const routerInfo = data[0] || {};

      const resourceData = await this.executeCommand("/system/resource/print");
      const resources = resourceData[0] || {};

      const deviceInfo: RouterOSDeviceInfo = {
        systemIdentity: routerInfo.name || "Unknown",
        firmwareVersion: resources.version || "Unknown",
        boardName: resources.board_name || "Unknown",
        cpuCount: parseInt(resources.cpu_count || "1", 10),
        uptime: resources.uptime || "00:00:00",
        cpuLoad: parseInt(resources.cpu_load || "0", 10),
        totalMemory: parseInt(resources.total_memory || "0", 10),
        freeMemory: parseInt(resources.free_memory || "0", 10),
        diskSize: resources.disk_size ? parseInt(resources.disk_size, 10) : undefined,
        diskFree: resources.disk_free ? parseInt(resources.disk_free, 10) : undefined,
      };

      // Cache for 5 minutes
      this.cachedDeviceInfo = deviceInfo;
      this.cacheExpiry = Date.now() + 5 * 60 * 1000;

      return deviceInfo;
    } catch (error) {
      throw new Error(
        `Failed to get device info: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get interface statistics
   */
  async getInterfaceStats(
    interfaceName?: string
  ): Promise<RouterOSInterfaceStats[]> {
    try {
      const data = await this.executeCommand("/interface/print");
      const allInterfaces = Array.isArray(data)
        ? data
        : [data];

      let interfaces = allInterfaces;
      if (interfaceName) {
        interfaces = allInterfaces.filter(
          (iface: any) => iface.name === interfaceName
        );
      }

      return interfaces.map((iface: any) => ({
        interfaceName: iface.name,
        running: iface.running === true,
        disabled: iface.disabled === true,
        bytes_in: parseInt(iface["rx-byte"] || "0", 10),
        bytes_out: parseInt(iface["tx-byte"] || "0", 10),
        packets_in: parseInt(iface["rx-packet"] || "0", 10),
        packets_out: parseInt(iface["tx-packet"] || "0", 10),
        errors_in: parseInt(iface["rx-error"] || "0", 10),
        errors_out: parseInt(iface["tx-error"] || "0", 10),
        drops_in: parseInt(iface["rx-drop"] || "0", 10),
        drops_out: parseInt(iface["tx-drop"] || "0", 10),
        collisions: parseInt(iface.collisions || "0", 10),
      }));
    } catch (error) {
      throw new Error(
        `Failed to get interface stats: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get PPPoE active connections
   */
  async getPPPoEConnections(): Promise<RouterOSUserInfo[]> {
    try {
      const data = await this.executeCommand("/ppp/active/print");
      const connections = Array.isArray(data) ? data : [data];

      return connections.map((conn: any) => ({
        username: conn.name || "Unknown",
        uptime: conn.uptime || "00:00:00",
        uploadsPerConnection: parseInt(conn.limit_bytes_out || "0", 10),
        downloadsPerConnection: parseInt(conn.limit_bytes_in || "0", 10),
        uploadCurrent: parseInt(conn["bytes-out"] || "0", 10),
        downloadCurrent: parseInt(conn["bytes-in"] || "0", 10),
      }));
    } catch (error) {
      throw new Error(
        `Failed to get PPPoE connections: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get Hotspot active users
   */
  async getHotspotUsers(): Promise<RouterOSUserInfo[]> {
    try {
      const data = await this.executeCommand("/ip/hotspot/active/print");
      const users = Array.isArray(data) ? data : [data];

      return users.map((user: any) => ({
        username: user.user || "Unknown",
        uptime: user.uptime || "00:00:00",
        uploadsPerConnection: parseInt(user["bytes-out"] || "0", 10),
        downloadsPerConnection: parseInt(user["bytes-in"] || "0", 10),
        uploadCurrent: parseInt(user["bytes-out"] || "0", 10),
        downloadCurrent: parseInt(user["bytes-in"] || "0", 10),
      }));
    } catch (error) {
      throw new Error(
        `Failed to get Hotspot users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get queue configuration and statistics
   */
  async getQueues(): Promise<RouterOSQueueInfo[]> {
    try {
      const data = await this.executeCommand("/queue/simple/print");
      const queues = Array.isArray(data) ? data : [data];

      return queues.map((queue: any) => ({
        name: queue.name,
        target: queue.target,
        maxLimit: queue["max-limit"] || "unlimited",
        burst: queue.burst || "0",
        parentQueue: queue.parent,
        totalBytes: parseInt(queue["total-bytes"] || "0", 10),
        totalPackets: parseInt(queue["total-packets"] || "0", 10),
        droppedBytes: parseInt(queue["dropped-bytes"] || "0", 10),
        droppedPackets: parseInt(queue["dropped-packets"] || "0", 10),
      }));
    } catch (error) {
      throw new Error(
        `Failed to get queues: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Set user bandwidth limit
   */
  async setUserBandwidthLimit(
    username: string,
    downloadLimit: number,
    uploadLimit: number
  ): Promise<boolean> {
    try {
      // This would require finding the user queue and updating it
      // Implementation depends on your queue naming convention
      await this.executeCommand("/queue/simple/set", {
        numbers: username,
        "max-limit": `${downloadLimit}M/${uploadLimit}M`,
      });
      return true;
    } catch (error) {
      throw new Error(
        `Failed to set bandwidth limit: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Disable/Enable user account
   */
  async disableUser(username: string): Promise<boolean> {
    try {
      await this.executeCommand("/ppp/secret/set", {
        numbers: username,
        disabled: true,
      });
      return true;
    } catch (error) {
      throw new Error(
        `Failed to disable user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async enableUser(username: string): Promise<boolean> {
    try {
      await this.executeCommand("/ppp/secret/set", {
        numbers: username,
        disabled: false,
      });
      return true;
    } catch (error) {
      throw new Error(
        `Failed to enable user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Execute command on RouterOS
   * This is a simplified mock implementation
   * In production, you would use the actual RouterOS API protocol
   */
  private async executeCommand(
    path: string,
    params?: Record<string, any>
  ): Promise<any> {
    // For demo purposes, return mock data
    // In production, implement actual RouterOS API communication
    console.log(`[RouterOS] ${path}`, params);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return mock data based on command
    if (path === "/system/identity/print") {
      return [{ name: "MikroTik-Router" }];
    }
    if (path === "/system/resource/print") {
      return [
        {
          version: "7.10.1",
          board_name: "RB5009",
          cpu_count: 4,
          uptime: "42d10:30:00",
          cpu_load: 12,
          total_memory: 4294967296,
          free_memory: 2147483648,
        },
      ];
    }
    if (path === "/interface/print") {
      return [
        {
          name: "ether1",
          running: true,
          disabled: false,
          "rx-byte": 1000000000,
          "tx-byte": 500000000,
          "rx-packet": 1000000,
          "tx-packet": 500000,
        },
      ];
    }
    if (path === "/ppp/active/print") {
      return [
        {
          name: "user@example.com",
          uptime: "12:30:45",
          "bytes-out": 5000000,
          "bytes-in": 10000000,
        },
      ];
    }

    return [];
  }
}

/**
 * Create RouterOS client from config
 */
export function createRouterOSClient(
  credentials: RouterOSCredentials
): MikrotikRouterOSClient {
  return new MikrotikRouterOSClient(credentials);
}
