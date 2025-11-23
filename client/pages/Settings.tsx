import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Bell,
  Building2,
  User,
  Key,
  Users,
  Save,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getSmsSettings,
  saveSmsSettings,
  type SmsSettings,
} from "@/lib/sms-settings-storage";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sms");
  const [visibleKey, setVisibleKey] = useState<string | null>(null);

  // SMS Settings State
  const [smsSettings, setSmsSettings] = useState<SmsSettings>({
    provider: "twilio",
    accountSid: "",
    authToken: "",
    fromNumber: "",
    enabled: true,
  });

  // Load SMS settings from storage on mount
  useEffect(() => {
    const saved = getSmsSettings();
    if (saved) {
      setSmsSettings(saved);
    }
  }, []);

  // Notification Preferences State
  const [notificationPrefs, setNotificationPrefs] = useState({
    ticketAssigned: { email: true, sms: true },
    ticketStatusChange: { email: true, sms: false },
    ticketClosed: { email: true, sms: false },
    customerMessage: { email: true, sms: true },
    slaWarning: { email: true, sms: true },
    systemAlert: { email: true, sms: false },
  });

  // Company Settings State
  const [companySettings, setCompanySettings] = useState({
    name: "NetFlow ISP",
    email: "support@netflow-isp.com",
    phone: "+1 (555) 123-4567",
    address: "123 Tech Street, San Francisco, CA 94105",
    website: "https://netflow-isp.com",
    timezone: "America/Los_Angeles",
    slaResponse: "4",
    slaResolution: "24",
  });

  // User Account Settings State
  const [userSettings, setUserSettings] = useState({
    fullName: "John Doe",
    email: "john.doe@netflow-isp.com",
    role: "admin",
    department: "Operations",
    phone: "+1 (555) 987-6543",
    language: "en",
  });

  // API Keys State
  const [apiKeys] = useState([
    {
      id: "key_1",
      name: "Production API Key",
      key: "sk_live_51234567890abcdef1234567890ab",
      created: "2024-01-10",
      lastUsed: "2024-01-15",
      status: "active",
    },
    {
      id: "key_2",
      name: "Development API Key",
      key: "sk_test_51234567890abcdef1234567890ab",
      created: "2024-01-05",
      lastUsed: "2024-01-15",
      status: "active",
    },
  ]);

  // Team Permissions State
  const [teamMembers] = useState([
    {
      id: "user_1",
      name: "Mike Johnson",
      email: "mike@netflow-isp.com",
      role: "technician",
      permissions: ["view_tickets", "update_tickets", "send_sms"],
      joinedDate: "2024-01-01",
    },
    {
      id: "user_2",
      name: "Sarah Smith",
      email: "sarah@netflow-isp.com",
      role: "manager",
      permissions: [
        "view_tickets",
        "update_tickets",
        "send_sms",
        "manage_team",
      ],
      joinedDate: "2024-01-05",
    },
    {
      id: "user_3",
      name: "Alex Chen",
      email: "alex@netflow-isp.com",
      role: "technician",
      permissions: ["view_tickets", "update_tickets"],
      joinedDate: "2024-01-08",
    },
  ]);

  const handleSmsSettingChange = (key: string, value: any) => {
    setSmsSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleCompanySettingChange = (key: string, value: string) => {
    setCompanySettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleUserSettingChange = (key: string, value: string) => {
    setUserSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleNotificationToggle = (type: string, channel: "email" | "sms") => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [type]: {
        ...prev[type as keyof typeof notificationPrefs],
        [channel]: !prev[type as keyof typeof notificationPrefs][channel],
      },
    }));
  };

  const handleSaveSettings = (section: string) => {
    if (section === "SMS") {
      try {
        saveSmsSettings(smsSettings);
        toast({
          title: "Success",
          description: "SMS settings saved successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save SMS settings.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Success",
        description: `${section} settings saved successfully.`,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard.",
    });
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your CRM configuration, integrations, and team permissions
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare size={16} />
              <span className="hidden sm:inline">SMS</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell size={16} />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 size={16} />
              <span className="hidden sm:inline">Company</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <User size={16} />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key size={16} />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users size={16} />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
          </TabsList>

          {/* SMS Notification Settings */}
          <TabsContent value="sms" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    SMS Provider Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Configure your SMS service provider for sending
                    notifications to customers and technicians
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SMS Provider
                    </label>
                    <Select
                      value={smsSettings.provider}
                      onValueChange={(value) =>
                        handleSmsSettingChange("provider", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="vonage">Vonage</SelectItem>
                        <SelectItem value="aws">AWS SNS</SelectItem>
                        <SelectItem value="nexmo">Nexmo</SelectItem>
                        <SelectItem value="custom">Custom SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Account SID
                    </label>
                    <Input
                      type="text"
                      value={smsSettings.accountSid}
                      onChange={(e) =>
                        handleSmsSettingChange("accountSid", e.target.value)
                      }
                      placeholder="Your account SID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Auth Token
                    </label>
                    <div className="relative">
                      <Input
                        type={visibleKey === "authToken" ? "text" : "password"}
                        value={smsSettings.authToken}
                        onChange={(e) =>
                          handleSmsSettingChange("authToken", e.target.value)
                        }
                        placeholder="Your auth token"
                      />
                      <button
                        onClick={() =>
                          setVisibleKey(
                            visibleKey === "authToken" ? null : "authToken",
                          )
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {visibleKey === "authToken" ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      From Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={smsSettings.fromNumber}
                      onChange={(e) =>
                        handleSmsSettingChange("fromNumber", e.target.value)
                      }
                      placeholder="+1234567890"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">
                        SMS Notifications Status
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enable or disable SMS notifications globally
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={smsSettings.enabled ? "default" : "secondary"}
                        className="gap-1.5"
                      >
                        {smsSettings.enabled ? (
                          <>
                            <CheckCircle2 size={14} />
                            Enabled
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} />
                            Disabled
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveSettings("SMS")}
                  className="gap-2"
                >
                  <Save size={16} />
                  Save SMS Settings
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notification Preferences */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Notification Preferences
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Choose how you want to be notified for different events
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: "ticketAssigned",
                      label: "Ticket Assigned",
                      description: "When a new ticket is assigned to you",
                    },
                    {
                      key: "ticketStatusChange",
                      label: "Ticket Status Change",
                      description: "When a ticket status is updated",
                    },
                    {
                      key: "ticketClosed",
                      label: "Ticket Closed",
                      description: "When a customer closes a ticket",
                    },
                    {
                      key: "customerMessage",
                      label: "Customer Message",
                      description: "When a customer sends a new message",
                    },
                    {
                      key: "slaWarning",
                      label: "SLA Warning",
                      description: "When SLA time is running out",
                    },
                    {
                      key: "systemAlert",
                      label: "System Alert",
                      description: "Critical system notifications",
                    },
                  ].map(({ key, label, description }) => (
                    <div
                      key={key}
                      className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              notificationPrefs[
                                key as keyof typeof notificationPrefs
                              ].email
                            }
                            onChange={() =>
                              handleNotificationToggle(key, "email")
                            }
                            className="w-4 h-4 rounded border-border"
                          />
                          <span className="text-sm text-foreground">Email</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              notificationPrefs[
                                key as keyof typeof notificationPrefs
                              ].sms
                            }
                            onChange={() =>
                              handleNotificationToggle(key, "sms")
                            }
                            className="w-4 h-4 rounded border-border"
                          />
                          <span className="text-sm text-foreground">SMS</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleSaveSettings("Notifications")}
                  className="gap-2"
                >
                  <Save size={16} />
                  Save Preferences
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Company Settings */}
          <TabsContent value="company" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Company Information
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Update your company details and SLA targets
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Name
                    </label>
                    <Input
                      value={companySettings.name}
                      onChange={(e) =>
                        handleCompanySettingChange("name", e.target.value)
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
                        handleCompanySettingChange("email", e.target.value)
                      }
                      placeholder="support@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      value={companySettings.phone}
                      onChange={(e) =>
                        handleCompanySettingChange("phone", e.target.value)
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Website
                    </label>
                    <Input
                      type="url"
                      value={companySettings.website}
                      onChange={(e) =>
                        handleCompanySettingChange("website", e.target.value)
                      }
                      placeholder="https://company.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Address
                    </label>
                    <Input
                      value={companySettings.address}
                      onChange={(e) =>
                        handleCompanySettingChange("address", e.target.value)
                      }
                      placeholder="123 Street, City, State ZIP"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Timezone
                    </label>
                    <Select
                      value={companySettings.timezone}
                      onValueChange={(value) =>
                        handleCompanySettingChange("timezone", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">
                          Eastern Time
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain Time
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time
                        </SelectItem>
                        <SelectItem value="Europe/London">
                          London (GMT)
                        </SelectItem>
                        <SelectItem value="Europe/Paris">
                          Central European
                        </SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SLA Response Time (hours)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={companySettings.slaResponse}
                      onChange={(e) =>
                        handleCompanySettingChange(
                          "slaResponse",
                          e.target.value,
                        )
                      }
                      placeholder="4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SLA Resolution Time (hours)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={companySettings.slaResolution}
                      onChange={(e) =>
                        handleCompanySettingChange(
                          "slaResolution",
                          e.target.value,
                        )
                      }
                      placeholder="24"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveSettings("Company")}
                  className="gap-2"
                >
                  <Save size={16} />
                  Save Company Settings
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* User Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Account Settings
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Manage your personal account information
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <Input
                      value={userSettings.fullName}
                      onChange={(e) =>
                        handleUserSettingChange("fullName", e.target.value)
                      }
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={userSettings.email}
                      onChange={(e) =>
                        handleUserSettingChange("email", e.target.value)
                      }
                      placeholder="your.email@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={userSettings.phone}
                      onChange={(e) =>
                        handleUserSettingChange("phone", e.target.value)
                      }
                      placeholder="+1 (555) 987-6543"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Department
                    </label>
                    <Input
                      value={userSettings.department}
                      onChange={(e) =>
                        handleUserSettingChange("department", e.target.value)
                      }
                      placeholder="Your department"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Role
                    </label>
                    <Select
                      value={userSettings.role}
                      onValueChange={(value) =>
                        handleUserSettingChange("role", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="technician">Technician</SelectItem>
                        <SelectItem value="support">Support Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Language
                    </label>
                    <Select
                      value={userSettings.language}
                      onValueChange={(value) =>
                        handleUserSettingChange("language", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-4">
                    Security
                  </h4>
                  <Button variant="outline" className="gap-2">
                    <Key size={16} />
                    Change Password
                  </Button>
                </div>

                <Button
                  onClick={() => handleSaveSettings("Account")}
                  className="gap-2"
                >
                  <Save size={16} />
                  Save Account Settings
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      API Keys
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage API keys for integrations and third-party apps
                    </p>
                  </div>
                  <Button className="gap-2">
                    <Plus size={16} />
                    New API Key
                  </Button>
                </div>

                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {apiKey.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-accent/10">
                              {apiKey.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              Created: {apiKey.created}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded p-3 font-mono text-xs text-foreground mb-3 flex items-center justify-between">
                        <span className="overflow-hidden text-ellipsis">
                          {apiKey.key}
                        </span>
                        <button
                          onClick={() => copyToClipboard(apiKey.key)}
                          className="ml-2 p-1.5 hover:bg-muted/50 rounded transition-colors flex-shrink-0"
                        >
                          <Copy size={16} />
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground mb-3">
                        Last used: {apiKey.lastUsed}
                      </p>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Rotate Key
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Team Permissions */}
          <TabsContent value="team" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Team Members
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage team member roles and permissions
                    </p>
                  </div>
                  <Button className="gap-2">
                    <Plus size={16} />
                    Add Member
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Role
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Permissions
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Joined
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr
                          key={member.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-foreground font-medium">
                            {member.name}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {member.email}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">
                              {member.role.charAt(0).toUpperCase() +
                                member.role.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1 flex-wrap">
                              {member.permissions.slice(0, 2).map((perm) => (
                                <Badge
                                  key={perm}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {perm}
                                </Badge>
                              ))}
                              {member.permissions.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{member.permissions.length - 2}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">
                            {member.joinedDate}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
