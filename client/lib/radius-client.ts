/**
 * Get RADIUS configuration
 */
export async function getRADIUSConfig(instanceId?: string): Promise<any> {
  try {
    const url = new URL("/api/mikrotik/radius/config", window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch RADIUS configuration");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch RADIUS configuration"
    );
  }
}

/**
 * Update RADIUS configuration
 */
export async function updateRADIUSConfig(data: {
  instanceId?: string;
  host: string;
  port: number;
  sharedSecret: string;
  syncOnCreate?: boolean;
  syncOnUpdate?: boolean;
  syncOnDelete?: boolean;
}): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/radius/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update RADIUS configuration");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update RADIUS configuration"
    );
  }
}

/**
 * Test RADIUS connection
 */
export async function testRADIUSConnection(data: {
  instanceId?: string;
  host: string;
  port: number;
  sharedSecret: string;
}): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/radius/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to test RADIUS connection");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to test RADIUS connection"
    );
  }
}

/**
 * Sync account to RADIUS
 */
export async function syncAccountToRADIUS(data: {
  accountId: string;
  instanceId?: string;
}): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/radius/sync-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to sync account to RADIUS");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to sync account to RADIUS"
    );
  }
}

/**
 * Remove account from RADIUS
 */
export async function removeAccountFromRADIUS(data: {
  accountId: string;
  instanceId?: string;
}): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/radius/remove-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to remove account from RADIUS");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to remove account from RADIUS"
    );
  }
}

/**
 * Suspend account in RADIUS
 */
export async function suspendAccountInRADIUS(data: {
  accountId: string;
  instanceId?: string;
}): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/radius/suspend-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to suspend account in RADIUS");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to suspend account in RADIUS"
    );
  }
}

/**
 * Resume account in RADIUS
 */
export async function resumeAccountInRADIUS(data: {
  accountId: string;
  instanceId?: string;
}): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/radius/resume-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to resume account in RADIUS");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to resume account in RADIUS"
    );
  }
}
