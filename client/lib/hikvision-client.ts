/**
 * Hikvision Device Integration
 * Handles communication with Hikvision devices (cameras, access control)
 */

export interface HikvisionDevice {
  ipAddress: string;
  port: number;
  username: string;
  password: string;
  deviceType: "camera" | "access_control" | "nvr";
  deviceName?: string;
  location?: string;
}

export interface AccessControlEvent {
  id: string;
  deviceId: string;
  employeeId?: string;
  eventType: string;
  accessPoint?: string;
  eventTime: string;
  cardNumber?: string;
  personName?: string;
  status?: string;
}


/**
 * Test Hikvision device connection
 */
export async function testHikvisionConnection(
  device: HikvisionDevice,
): Promise<{ success: boolean; message: string; deviceType?: string }> {
  try {
    const response = await fetch("/api/hrm/hikvision/test", {
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
      deviceType?: string;
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to test Hikvision connection";
    throw new Error(errorMessage);
  }
}

/**
 * Get access control events from Hikvision device
 */
export async function getAccessControlEvents(
  deviceId: string,
): Promise<{ success: boolean; events: AccessControlEvent[]; message: string }> {
  try {
    const response = await fetch(`/api/hrm/hikvision/access-events/${deviceId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    return (await response.json()) as {
      success: boolean;
      events: AccessControlEvent[];
      message: string;
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch access control events";
    throw new Error(errorMessage);
  }
}

/**
 * Get surveillance events from Hikvision camera
 */
export async function getSurveillanceEvents(
  cameraId: string,
): Promise<{ success: boolean; events: SurveillanceEvent[]; message: string }> {
  try {
    const response = await fetch(`/api/hrm/hikvision/surveillance/${cameraId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    return (await response.json()) as {
      success: boolean;
      events: SurveillanceEvent[];
      message: string;
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch surveillance events";
    throw new Error(errorMessage);
  }
}
