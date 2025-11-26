import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { FileText, BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Reports
          </h1>
          <p className="text-muted-foreground">
            Generate and view business reports
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Financial Reports
                </p>
                <p className="text-lg font-semibold text-foreground mt-2">
                  Coming Soon
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <BarChart3 size={24} className="text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-8 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Custom Reports
                </p>
                <p className="text-lg font-semibold text-foreground mt-2">
                  Coming Soon
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/10">
                <FileText size={24} className="text-secondary" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
