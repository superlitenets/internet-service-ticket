import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

/**
 * Get setting by key
 */
router.get("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await db.appSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      return res.json({ setting: null });
    }

    return res.json({
      setting: {
        ...setting,
        value: setting.value ? JSON.parse(setting.value) : null,
      },
    });
  } catch (error) {
    console.error("Error fetching setting:", error);
    res.status(500).json({
      error: "Failed to fetch setting",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get all settings
 */
router.get("/", async (req, res) => {
  try {
    const settings = await db.appSettings.findMany();

    const parsed = settings.map((s) => ({
      ...s,
      value: s.value ? JSON.parse(s.value) : null,
    }));

    res.json({ settings: parsed });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      error: "Failed to fetch settings",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Save or update setting
 */
router.post("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value, category } = req.body;

    const stringValue = typeof value === "string" ? value : JSON.stringify(value);

    const setting = await db.appSettings.upsert({
      where: { key },
      create: {
        key,
        value: stringValue,
        category,
      },
      update: {
        value: stringValue,
        category,
      },
    });

    return res.json({
      setting: {
        ...setting,
        value: setting.value ? JSON.parse(setting.value) : null,
      },
    });
  } catch (error) {
    console.error("Error saving setting:", error);
    res.status(500).json({
      error: "Failed to save setting",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Delete setting
 */
router.delete("/:key", async (req, res) => {
  try {
    const { key } = req.params;

    await db.appSettings.delete({
      where: { key },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting setting:", error);
    res.status(500).json({
      error: "Failed to delete setting",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
