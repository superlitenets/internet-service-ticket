export interface MikrotikInstance {
  id: string;
  name: string;
  apiUrl: string;
  username: string;
  password: string;
  port: number;
  useSsl: boolean;
  isDefault: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const MIKROTIK_INSTANCES_KEY = "mikrotik_instances";
const DEFAULT_INSTANCE_KEY = "mikrotik_default_instance";

export function getMikrotikInstances(): MikrotikInstance[] {
  try {
    const stored = localStorage.getItem(MIKROTIK_INSTANCES_KEY);
    if (!stored) {
      return getDefaultInstances();
    }
    return JSON.parse(stored) as MikrotikInstance[];
  } catch {
    return getDefaultInstances();
  }
}

export function getDefaultInstances(): MikrotikInstance[] {
  return [
    {
      id: "default-1",
      name: "Main Router",
      apiUrl: "192.168.1.1",
      username: "admin",
      password: "",
      port: 8728,
      useSsl: false,
      isDefault: true,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function saveMikrotikInstances(instances: MikrotikInstance[]): void {
  try {
    // Ensure only one instance is marked as default
    const defaultCount = instances.filter((i) => i.isDefault).length;
    if (defaultCount === 0 && instances.length > 0) {
      instances[0].isDefault = true;
    } else if (defaultCount > 1) {
      instances.forEach((i, idx) => {
        i.isDefault = idx === 0;
      });
    }

    localStorage.setItem(MIKROTIK_INSTANCES_KEY, JSON.stringify(instances));
  } catch (error) {
    throw new Error("Failed to save Mikrotik instances");
  }
}

export function addMikrotikInstance(instance: Omit<MikrotikInstance, "id" | "createdAt" | "updatedAt">): MikrotikInstance {
  try {
    const instances = getMikrotikInstances();
    const newInstance: MikrotikInstance = {
      ...instance,
      id: `instance-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    instances.push(newInstance);
    saveMikrotikInstances(instances);

    return newInstance;
  } catch (error) {
    throw new Error("Failed to add Mikrotik instance");
  }
}

export function updateMikrotikInstance(
  id: string,
  updates: Partial<MikrotikInstance>
): MikrotikInstance {
  try {
    const instances = getMikrotikInstances();
    const index = instances.findIndex((i) => i.id === id);

    if (index === -1) {
      throw new Error("Instance not found");
    }

    instances[index] = {
      ...instances[index],
      ...updates,
      id: instances[index].id,
      createdAt: instances[index].createdAt,
      updatedAt: new Date().toISOString(),
    };

    saveMikrotikInstances(instances);
    return instances[index];
  } catch (error) {
    throw new Error("Failed to update Mikrotik instance");
  }
}

export function deleteMikrotikInstance(id: string): void {
  try {
    const instances = getMikrotikInstances();
    const filtered = instances.filter((i) => i.id !== id);

    if (filtered.length === 0) {
      // Keep at least one default instance
      filtered.push(getDefaultInstances()[0]);
    }

    saveMikrotikInstances(filtered);
  } catch (error) {
    throw new Error("Failed to delete Mikrotik instance");
  }
}

export function getDefaultMikrotikInstance(): MikrotikInstance | null {
  try {
    const instances = getMikrotikInstances();
    return instances.find((i) => i.isDefault) || instances[0] || null;
  } catch {
    return null;
  }
}

export function setDefaultMikrotikInstance(id: string): void {
  try {
    const instances = getMikrotikInstances();
    instances.forEach((i) => {
      i.isDefault = i.id === id;
    });
    saveMikrotikInstances(instances);
    localStorage.setItem(DEFAULT_INSTANCE_KEY, id);
  } catch (error) {
    throw new Error("Failed to set default Mikrotik instance");
  }
}
