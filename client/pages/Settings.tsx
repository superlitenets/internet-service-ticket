import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  Bell,
  Building2,
  DollarSign,
  Lock,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getCompanySettings,
  saveCompanySettings,
  type CompanySettings,
} from "@/lib/company-settings-storage";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "NetFlow",
    email: "support@netflow.com",
    phone: "+254700000000",
    website: "https://netflow.com",
    address: "Nairobi, Kenya",
    timezone: "EAT",
  });

  const handleSaveCompanySettings = () => {
    try {
      saveCompanySettings(companySettings);
      toast({
        title: "Success",
        description: "Company settings saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save company settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage application settings and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="company" className="gap-2">
              <Building2 size={16} />
              <span className="hidden sm:inline">Company</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell size={16} />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock size={16} />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Company Information
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Update your company details and contact information
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Name
                    </label>
                    <Input
                      value={companySettings.name}
                      onChange={(e) =>
                        setCompanySettings({
                          ...companySettings,
                          name: e.target.value,
                        })
                      }
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={companySettings.email}
                      onChange={(e) =>
                        setCompanySettings({
                          ...companySettings,
                          email: e.target.value,
                        })
                      }
                      placeholder="company@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone
                    </label>
                    <Input
                      value={companySettings.phone}
                      onChange={(e) =>
                        setCompanySettings({
                          ...companySettings,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+254700000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Website
                    </label>
                    <Input
                      value={companySettings.website}
                      onChange={(e) =>
                        setCompanySettings({
                          ...companySettings,
                          website: e.target.value,
                        })
                      }
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Address
                    </label>
                    <Input
                      value={companySettings.address}
                      onChange={(e) =>
                        setCompanySettings({
                          ...companySettings,
                          address: e.target.value,
                        })
                      }
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Timezone
                    </label>
                    <Input
                      value={companySettings.timezone}
                      onChange={(e) =>
                        setCompanySettings({
                          ...companySettings,
                          timezone: e.target.value,
                        })
                      }
                      placeholder="EAT"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveCompanySettings}
                  className="w-full md:w-auto"
                >
                  <Save size={16} className="mr-2" />
                  Save Company Settings
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Notification Preferences
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Configure how you receive notifications
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <div>
                      <p className="font-medium text-foreground">
                        Email Notifications
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Receive email alerts for important events
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <div>
                      <p className="font-medium text-foreground">
                        In-App Notifications
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Show notifications within the application
                      </p>
                    </div>
                  </label>
                </div>

                <Button className="w-full md:w-auto">
                  <Save size={16} className="mr-2" />
                  Save Preferences
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Security Settings
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Manage your account security and access
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Change Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Current password"
                      className="mb-2"
                    />
                    <Input
                      type="password"
                      placeholder="New password"
                      className="mb-2"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>

                <Button className="w-full md:w-auto">
                  <Save size={16} className="mr-2" />
                  Update Password
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
