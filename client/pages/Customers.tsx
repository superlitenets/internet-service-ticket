import Placeholder from "./Placeholder";
import { Users } from "lucide-react";

export default function CustomersPage() {
  return (
    <Placeholder
      title="Customer Management"
      description="Manage customer accounts, contact information, service plans, and billing details."
      icon={
        <div className="p-4 rounded-lg bg-primary/10">
          <Users size={40} className="text-primary" />
        </div>
      }
    />
  );
}
