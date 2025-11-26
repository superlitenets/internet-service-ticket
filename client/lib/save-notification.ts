/**
 * Save Notification Utility
 * Provides consistent "item saved" notifications across the entire system
 */

import { Toast } from "@/hooks/use-toast";

export interface SaveNotificationOptions {
  itemName?: string;
  action?: "created" | "updated" | "deleted" | "synced";
  duration?: number;
}

/**
 * Generate a save success notification
 */
export function getSaveNotification(
  options: SaveNotificationOptions = {}
): Toast {
  const { itemName = "Item", action = "updated", duration = 2000 } = options;

  const actionLabels = {
    created: "created",
    updated: "saved",
    deleted: "deleted",
    synced: "synced",
  };

  const actionLabel = actionLabels[action];

  return {
    title: "Success",
    description: `✓ ${itemName} ${actionLabel}`,
    duration,
  };
}

/**
 * Generate a delete success notification
 */
export function getDeleteNotification(itemName: string = "Item"): Toast {
  return {
    title: "Success",
    description: `✓ ${itemName} deleted`,
    duration: 2000,
  };
}

/**
 * Generate a sync success notification
 */
export function getSyncNotification(
  count: number = 1,
  itemType: string = "records"
): Toast {
  return {
    title: "Success",
    description: `✓ ${count} ${itemType} synced successfully`,
    duration: 2000,
  };
}

/**
 * Generate an error notification
 */
export function getErrorNotification(
  error: string,
  itemName: string = "Item"
): Toast {
  return {
    title: "Error",
    description: `Failed to save ${itemName}: ${error}`,
    variant: "destructive",
  };
}
