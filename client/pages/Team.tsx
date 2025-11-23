import Placeholder from "./Placeholder";
import { Users } from "lucide-react";

export default function TeamPage() {
  return (
    <Placeholder
      title="Team Management"
      description="Manage team members, assign tickets, track technician performance, and set availability."
      icon={
        <div className="p-4 rounded-lg bg-secondary/10">
          <Users size={40} className="text-secondary" />
        </div>
      }
    />
  );
}
