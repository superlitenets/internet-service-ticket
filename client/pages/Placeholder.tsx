import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function Placeholder({
  title,
  description,
  icon,
}: PlaceholderProps) {
  return (
    <Layout>
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[calc(100vh-140px)]">
        <Card className="p-12 border-0 shadow-md text-center max-w-md">
          <div className="flex justify-center mb-6">{icon}</div>
          <h1 className="text-2xl font-bold text-foreground mb-3">{title}</h1>
          <p className="text-muted-foreground mb-8">{description}</p>
          <p className="text-sm text-muted-foreground mb-6">
            This page is ready to be developed. Continue building this feature
            by asking the chat to implement the{" "}
            <span className="font-semibold">{title}</span> functionality.
          </p>
          <Button className="w-full gap-2">
            Start Building <ArrowRight size={16} />
          </Button>
        </Card>
      </div>
    </Layout>
  );
}
