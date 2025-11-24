import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLandingContent,
  saveLandingContent,
  resetLandingContent,
  LandingContent,
} from "@/lib/landing-content-storage";

export default function LandingContentEditor() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<LandingContent | null>(null);

  useEffect(() => {
    const loadedContent = getLandingContent();
    setContent(loadedContent);
  }, []);

  const handleSave = async () => {
    if (!content) return;

    try {
      setLoading(true);
      saveLandingContent(content);
      toast({
        title: "Success",
        description: "Landing page content updated successfully. Changes are live!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save landing content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all content to defaults? This cannot be undone.",
      )
    ) {
      resetLandingContent();
      const loadedContent = getLandingContent();
      setContent(loadedContent);
      toast({
        title: "Success",
        description: "Landing content reset to defaults",
      });
    }
  };

  const handleChange = (field: keyof LandingContent, value: string) => {
    if (content) {
      setContent({
        ...content,
        [field]: value,
      });
    }
  };

  if (!content) {
    return <Layout>Loading...</Layout>;
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Landing Page Content
          </h1>
          <p className="text-muted-foreground mt-2">
            Edit the content displayed on your landing page
          </p>
        </div>

        {/* Save Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="gap-2"
            size="lg"
          >
            <Save size={18} />
            Save Changes
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="gap-2"
            size="lg"
          >
            <Eye size={18} />
            View Landing Page
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="gap-2"
            size="lg"
          >
            <RotateCcw size={18} />
            Reset to Defaults
          </Button>
        </div>

        {/* Company Information */}
        <Card className="p-6 border-0 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Company Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Company Name
              </label>
              <Input
                value={content.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="e.g., NetFlow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                type="email"
                value={content.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="support@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Support Phone
              </label>
              <Input
                value={content.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="0709367600"
              />
            </div>
          </div>
        </Card>

        {/* Hero Section */}
        <Card className="p-6 border-0 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Hero Section
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Main Title
            </label>
            <Input
              value={content.heroTitle}
              onChange={(e) => handleChange("heroTitle", e.target.value)}
              placeholder="e.g., Manage Your ISP Business"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title Highlight (Colored Text)
            </label>
            <Input
              value={content.heroSubtitle}
              onChange={(e) => handleChange("heroSubtitle", e.target.value)}
              placeholder="e.g., with Confidence"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={content.heroDescription}
              onChange={(e) => handleChange("heroDescription", e.target.value)}
              placeholder="Enter hero section description"
              rows={3}
              className="w-full p-2 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Card>

        {/* Features Section */}
        <Card className="p-6 border-0 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Features Section
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Section Title
            </label>
            <Input
              value={content.featuresTitle}
              onChange={(e) => handleChange("featuresTitle", e.target.value)}
              placeholder="e.g., Cloud Hosting & Server Deployment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Section Description
            </label>
            <textarea
              value={content.featuresDescription}
              onChange={(e) =>
                handleChange("featuresDescription", e.target.value)
              }
              placeholder="Enter features section description"
              rows={2}
              className="w-full p-2 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Card>

        {/* Internet Packages Section */}
        <Card className="p-6 border-0 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Internet Packages Section
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Section Title
            </label>
            <Input
              value={content.packagesTitle}
              onChange={(e) => handleChange("packagesTitle", e.target.value)}
              placeholder="e.g., Our Internet Packages"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Section Description
            </label>
            <textarea
              value={content.packagesDescription}
              onChange={(e) =>
                handleChange("packagesDescription", e.target.value)
              }
              placeholder="Enter packages section description"
              rows={2}
              className="w-full p-2 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Card>

        {/* Call to Action Section */}
        <Card className="p-6 border-0 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Call to Action Section
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Section Title
            </label>
            <Input
              value={content.ctaSectionTitle}
              onChange={(e) => handleChange("ctaSectionTitle", e.target.value)}
              placeholder="e.g., Ready to Transform Your ISP Business?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Section Description
            </label>
            <textarea
              value={content.ctaSectionDescription}
              onChange={(e) =>
                handleChange("ctaSectionDescription", e.target.value)
              }
              placeholder="Enter CTA section description"
              rows={2}
              className="w-full p-2 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Primary Button Text
              </label>
              <Input
                value={content.ctaPrimary}
                onChange={(e) => handleChange("ctaPrimary", e.target.value)}
                placeholder="e.g., Get Started"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Secondary Button Text
              </label>
              <Input
                value={content.ctaSecondary}
                onChange={(e) => handleChange("ctaSecondary", e.target.value)}
                placeholder="e.g., Learn More"
              />
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
