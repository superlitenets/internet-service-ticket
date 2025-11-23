/**
 * ZKteco40 Biometric Device Integration
 * Handles communication with ZKteco40 attendance devices
 */

export interface ZKtecoDevice {
  ipAddress: string;
  port: number;
  username: string;
  password: string;
}

export interface BiometricAttendance {
  userId: string;
  userPin: string;
  userName: string;
  checkInTime: string;
  checkOutTime?: string;
  workCode: number;
  type: number; // 0: check-in, 1: check-out
  deviceSerialNumber: string;
}

/**
 * Connect to ZKteco device and retrieve attendance data
 */
export async function connectZKtecoDevice(
  device: ZKtecoDevice,
): Promise<BiometricAttendance[]> {
  try {
    const response = await fetch("/api/hrm/zkteco/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "fetch",
        device,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to connect to ZKteco device: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as { attendance: BiometricAttendance[] };
    return data.attendance;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to connect to ZKteco device";
    throw new Error(errorMessage);
  }
}

/**
 * Sync attendance from ZKteco device
 */
export async function syncZKtecoAttendance(
  deviceId: string,
): Promise<{
  success: boolean;
  recordsImported: number;
  message: string;
  timestamp: string;
}> {
  try {
    const response = await fetch("/api/hrm/zkteco/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deviceId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync ZKteco device: ${response.statusText}`);
    }

    return (await response.json()) as {
      success: boolean;
      recordsImported: number;
      message: string;
      timestamp: string;
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to sync ZKteco device";
    throw new Error(errorMessage);
  }
}

/**
 * Test ZKteco device connection
 */
export async function testZKtecoConnection(
  device: ZKtecoDevice,
): Promise<{ success: boolean; message: string; version?: string }> {
  try {
    const response = await fetch("/api/hrm/zkteco/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(device),
    });

    if (!response.ok) {
      throw new Error(`Connection failed: ${response.statusText}`);
    }

    return (await response.json()) as {
      success: boolean;
      message: string;
      version?: string;
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to test ZKteco connection";
    throw new Error(errorMessage);
  }
}

/**
 * Get real-time attendance from ZKteco device
 */
export async function getRealTimeAttendance(
  deviceId: string,
): Promise<BiometricAttendance[]> {
  try {
    const response = await fetch(`/api/hrm/zkteco/realtime/${deviceId}`);

    if (!response.ok) {
      throw new Error(`Failed to get real-time data: ${response.statusText}`);
    }

    const data = (await response.json()) as { attendance: BiometricAttendance[] };
    return data.attendance;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to get real-time attendance";
    throw new Error(errorMessage);
  }
}
