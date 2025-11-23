import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[calc(100vh-140px)]">
        <Card className="p-12 border-0 shadow-md text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-lg bg-destructive/10">
              <AlertCircle size={40} className="text-destructive" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">404</h1>
          <p className="text-lg text-muted-foreground mb-2">Page not found</p>
          <p className="text-sm text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/" className="block">
            <Button className="w-full gap-2">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    </Layout>
  );
};

export default NotFound;
