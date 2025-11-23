import Placeholder from "./Placeholder";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <Placeholder
      title="Settings"
      description="Configure SMS notification settings, API keys, user permissions, and company preferences."
      icon={
        <div className="p-4 rounded-lg bg-accent/10">
          <Settings size={40} className="text-accent" />
        </div>
      }
    />
  );
}
