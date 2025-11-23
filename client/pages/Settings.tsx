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
  Edit,
  DollarSign,
  Trash,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getSmsSettings,
  saveSmsSettings,
  type SmsSettings,
} from "@/lib/sms-settings-storage";
import {
  getSmsTemplates,
  saveSmsTemplates,
  updateTemplate,
  resetSmsTemplates,
  type SmsTemplate,
} from "@/lib/sms-templates";
import {
  getDeductionSettings,
  saveDeductionSettings,
  resetDeductionSettings,
  type LateDeductionSettings,
} from "@/lib/deduction-settings-storage";
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  isWhatsAppConfigured,
  type WhatsAppConfig,
} from "@/lib/whatsapp-settings-storage";
import { testWhatsAppConnection } from "@/lib/whatsapp-client";
import {
  initializeWhatsAppWeb,
  getWhatsAppQRCode,
  checkWhatsAppWebStatus,
  logoutWhatsAppWeb,
  type WhatsAppMode,
} from "@/lib/whatsapp-unified-client";
import {
  getMpesaSettings,
  saveMpesaSettings,
  resetMpesaSettings,
  type MpesaConfig,
} from "@/lib/mpesa-settings-storage";
import {
  getCompanySettings,
  saveCompanySettings,
  type CompanySettings,
} from "@/lib/company-settings-storage";
import {
  getMikrotikInstances,
  saveMikrotikInstances,
  addMikrotikInstance,
  updateMikrotikInstance,
  deleteMikrotikInstance,
  setDefaultMikrotikInstance,
  type MikrotikInstance,
} from "@/lib/mikrotik-instances-storage";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sms");
  const [visibleKey, setVisibleKey] = useState<string | null>(null);

  // SMS Settings State
  const [smsSettings, setSmsSettings] = useState<
    SmsSettings & {
      apiKey?: string;
      partnerId?: string;
      shortcode?: string;
    }
  >({
    provider: "twilio",
    accountSid: "",
    authToken: "",
    fromNumber: "",
    apiKey: "",
    partnerId: "",
    shortcode: "",
    enabled: true,
  });

  // SMS Templates State
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(
    null,
  );
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  // WhatsApp Settings State
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppConfig>({
    enabled: false,
    phoneNumberId: "",
    accessToken: "",
    businessAccountId: "",
    webhookToken: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [whatsappWebQR, setWhatsappWebQR] = useState<string | null>(null);
  const [whatsappWebStatus, setWhatsappWebStatus] = useState(false);
  const [initializingWeb, setInitializingWeb] = useState(false);

  // Deduction Settings State
  const [deductionSettings, setDeductionSettings] = useState<LateDeductionSettings>({
    enabled: false,
    lateThresholdMinutes: 15,
    deductionType: "fixed",
    fixedDeductionAmount: 50,
    percentageDeduction: 2,
    scaledDeductions: [
      { minutesRange: { min: 15, max: 30 }, deductionAmount: 30 },
      { minutesRange: { min: 31, max: 60 }, deductionAmount: 60 },
      { minutesRange: { min: 61, max: 120 }, deductionAmount: 100 },
      { minutesRange: { min: 121, max: 999 }, deductionAmount: 150 },
    ],
    applyAfterDays: 1,
    excludeWeekends: true,
    excludeEmployeeIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [testingSms, setTestingSms] = useState(false);

  // MPESA Settings State
  const [mpesaSettings, setMpesaSettings] = useState<MpesaConfig>({
    enabled: false,
    consumerKey: "",
    consumerSecret: "",
    businessShortCode: "",
    passkey: "",
    callbackUrl: "",
    validationUrl: "",
    confirmationUrl: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Load SMS settings, templates, deduction settings, WhatsApp config, MPESA config, and Company settings from storage on mount
  useEffect(() => {
    const saved = getSmsSettings();
    if (saved) {
      setSmsSettings(saved);
    }
    const templates = getSmsTemplates();
    setSmsTemplates(templates);
    const deductions = getDeductionSettings();
    setDeductionSettings(deductions);
    const whatsappConfig = getWhatsAppConfig();
    setWhatsappSettings(whatsappConfig);
    const mpesaConfig = getMpesaSettings();
    setMpesaSettings(mpesaConfig);
    const companyConfig = getCompanySettings();
    setCompanySettings(companyConfig);
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
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "NetFlow ISP",
    email: "support@netflow-isp.com",
    phone: "+1 (555) 123-4567",
    address: "123 Tech Street, San Francisco, CA 94105",
    website: "https://netflow-isp.com",
    timezone: "America/Los_Angeles",
    prefix: "ACC",
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
    } else if (section === "WhatsApp") {
      try {
        saveWhatsAppConfig(whatsappSettings);
        toast({
          title: "Success",
          description: "WhatsApp settings saved successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save WhatsApp settings.",
          variant: "destructive",
        });
      }
    } else if (section === "MPESA") {
      try {
        saveMpesaSettings(mpesaSettings);
        toast({
          title: "Success",
          description: "MPESA settings saved successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save MPESA settings.",
          variant: "destructive",
        });
      }
    } else if (section === "Company") {
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
    } else {
      toast({
        title: "Success",
        description: `${section} settings saved successfully.`,
      });
    }
  };

  const handleTestWhatsApp = async () => {
    try {
      setTestingWhatsApp(true);

      if (!whatsappSettings.businessApi.phoneNumberId || !whatsappSettings.businessApi.accessToken) {
        toast({
          title: "Error",
          description: "Please configure WhatsApp Business API credentials first",
          variant: "destructive",
        });
        return;
      }

      const result = await testWhatsAppConnection(
        whatsappSettings.businessApi.phoneNumberId,
        whatsappSettings.businessApi.accessToken,
      );

      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to test WhatsApp connection",
        variant: "destructive",
      });
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleInitWhatsAppWeb = async () => {
    try {
      setInitializingWeb(true);
      const result = await initializeWhatsAppWeb();

      if (result.success && result.qrCode) {
        setWhatsappWebQR(result.qrCode);
        toast({
          title: "Success",
          description: "Scan the QR code with your phone to authenticate",
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to initialize Web",
        variant: "destructive",
      });
    } finally {
      setInitializingWeb(false);
    }
  };

  const handleCheckWebStatus = async () => {
    try {
      const status = await checkWhatsAppWebStatus();
      setWhatsappWebStatus(status.authenticated);
      toast({
        title: status.authenticated ? "Connected" : "Not Connected",
        description: status.message,
      });
      setWhatsappSettings({
        ...whatsappSettings,
        web: {
          ...whatsappSettings.web,
          authenticated: status.authenticated,
        },
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to check status",
        variant: "destructive",
      });
    }
  };

  const handleLogoutWeb = async () => {
    try {
      const result = await logoutWhatsAppWeb();
      if (result.success) {
        setWhatsappWebStatus(false);
        setWhatsappWebQR(null);
        setWhatsappSettings({
          ...whatsappSettings,
          web: {
            authenticated: false,
          },
        });
        toast({
          title: "Success",
          description: "Logged out from WhatsApp Web",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleTestSms = async () => {
    try {
      setTestingSms(true);

      // Check if settings are configured
      if (
        !smsSettings.accountSid &&
        !smsSettings.apiKey &&
        smsSettings.provider !== "custom"
      ) {
        toast({
          title: "Error",
          description: "Please configure SMS settings first",
          variant: "destructive",
        });
        return;
      }

      // Check provider-specific credentials
      if (smsSettings.provider === "twilio") {
        if (
          !smsSettings.accountSid ||
          !smsSettings.authToken ||
          !smsSettings.fromNumber
        ) {
          toast({
            title: "Error",
            description: "Please configure all Twilio credentials",
            variant: "destructive",
          });
          return;
        }
      } else if (smsSettings.provider === "advanta") {
        if (
          !smsSettings.apiKey ||
          !smsSettings.partnerId ||
          !smsSettings.shortcode
        ) {
          toast({
            title: "Error",
            description: "Please configure all Advanta SMS credentials",
            variant: "destructive",
          });
          return;
        }
      }

      // Send test SMS
      const { sendSmsToPhone } = await import("@/lib/sms-client");

      const testMessage = `SMS Test - This is a test message from your ISP CRM system. Provider: ${smsSettings.provider}. If you received this, SMS is working correctly! [${new Date().toLocaleTimeString()}]`;

      // Use a test phone number or the configured from number
      const testPhoneNumber = smsSettings.fromNumber || "+1234567890";

      await sendSmsToPhone(testPhoneNumber, testMessage);

      toast({
        title: "Success",
        description: "Test SMS sent successfully! Check your phone.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send test SMS";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTestingSms(false);
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2">
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare size={16} />
              <span className="hidden sm:inline">SMS</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare size={16} />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <MessageSquare size={16} />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="deductions" className="gap-2">
              <DollarSign size={16} />
              <span className="hidden sm:inline">Deductions</span>
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
            <TabsTrigger value="mpesa" className="gap-2">
              <DollarSign size={16} />
              <span className="hidden sm:inline">MPESA</span>
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
                        <SelectItem value="advanta">Advanta SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {smsSettings.provider === "twilio" && (
                    <>
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
                            type={
                              visibleKey === "authToken" ? "text" : "password"
                            }
                            value={smsSettings.authToken}
                            onChange={(e) =>
                              handleSmsSettingChange(
                                "authToken",
                                e.target.value,
                              )
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
                    </>
                  )}

                  {smsSettings.provider === "advanta" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          API Key
                        </label>
                        <div className="relative">
                          <Input
                            type={visibleKey === "apiKey" ? "text" : "password"}
                            value={smsSettings.apiKey}
                            onChange={(e) =>
                              handleSmsSettingChange("apiKey", e.target.value)
                            }
                            placeholder="Your Advanta API Key"
                          />
                          <button
                            onClick={() =>
                              setVisibleKey(
                                visibleKey === "apiKey" ? null : "apiKey",
                              )
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {visibleKey === "apiKey" ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Partner ID
                        </label>
                        <Input
                          type="text"
                          value={smsSettings.partnerId}
                          onChange={(e) =>
                            handleSmsSettingChange("partnerId", e.target.value)
                          }
                          placeholder="Your Advanta Partner ID"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Shortcode (Sender ID)
                        </label>
                        <Input
                          type="text"
                          value={smsSettings.shortcode}
                          onChange={(e) =>
                            handleSmsSettingChange("shortcode", e.target.value)
                          }
                          placeholder="Your sender ID / shortcode"
                        />
                      </div>
                    </>
                  )}

                  {(smsSettings.provider === "vonage" ||
                    smsSettings.provider === "aws" ||
                    smsSettings.provider === "nexmo") && (
                    <div className="col-span-full p-4 rounded-lg bg-muted/30 border border-border">
                      <p className="text-sm text-muted-foreground">
                        {smsSettings.provider === "vonage" &&
                          "Vonage credentials required: API Key and API Secret"}
                        {smsSettings.provider === "aws" &&
                          "AWS SNS requires: AWS Access Key ID, Secret Access Key, and Region"}
                        {smsSettings.provider === "nexmo" &&
                          "Nexmo credentials required: API Key and API Secret"}
                      </p>
                    </div>
                  )}

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

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSaveSettings("SMS")}
                    className="gap-2"
                  >
                    <Save size={16} />
                    Save SMS Settings
                  </Button>
                  <Button
                    onClick={handleTestSms}
                    variant="outline"
                    className="gap-2"
                    disabled={testingSms || !smsSettings.enabled}
                  >
                    <MessageSquare size={16} />
                    {testingSms ? "Testing..." : "Test SMS"}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* WhatsApp Settings */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    WhatsApp Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure WhatsApp using Business API, Web, or both with automatic failover
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Enable WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      {whatsappSettings.enabled
                        ? "WhatsApp is enabled and active"
                        : "WhatsApp is disabled"}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={whatsappSettings.enabled}
                    onChange={(e) =>
                      setWhatsappSettings({
                        ...whatsappSettings,
                        enabled: e.target.checked,
                      })
                    }
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                {whatsappSettings.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        WhatsApp Mode
                      </label>
                      <Select
                        value={whatsappSettings.mode}
                        onValueChange={(value) =>
                          setWhatsappSettings({
                            ...whatsappSettings,
                            mode: value as "business" | "web" | "both",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business">Business API Only</SelectItem>
                          <SelectItem value="web">Web Only</SelectItem>
                          <SelectItem value="both">Both (with Failover)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        • Business API: Official, recommended, requires Meta credentials
                        <br />• Web: Works when API unavailable, uses WhatsApp Web
                        <br />• Both: Try API first, failback to Web if needed
                      </p>
                    </div>

                    {(whatsappSettings.mode === "business" ||
                      whatsappSettings.mode === "both") && (
                      <>
                        <div className="border-t pt-6">
                          <h4 className="font-medium text-foreground mb-4">
                            Business API Configuration
                          </h4>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Business Account ID
                              </label>
                              <Input
                                type="text"
                                value={whatsappSettings.businessApi.businessAccountId}
                                onChange={(e) =>
                                  setWhatsappSettings({
                                    ...whatsappSettings,
                                    businessApi: {
                                      ...whatsappSettings.businessApi,
                                      businessAccountId: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Your Business Account ID"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Phone Number ID
                              </label>
                              <Input
                                type="text"
                                value={whatsappSettings.businessApi.phoneNumberId}
                                onChange={(e) =>
                                  setWhatsappSettings({
                                    ...whatsappSettings,
                                    businessApi: {
                                      ...whatsappSettings.businessApi,
                                      phoneNumberId: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Your Phone Number ID"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Access Token
                            </label>
                            <div className="relative">
                              <Input
                                type={visibleKey === "whatsappToken" ? "text" : "password"}
                                value={whatsappSettings.businessApi.accessToken}
                                onChange={(e) =>
                                  setWhatsappSettings({
                                    ...whatsappSettings,
                                    businessApi: {
                                      ...whatsappSettings.businessApi,
                                      accessToken: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Your WhatsApp Access Token"
                              />
                              <button
                                onClick={() =>
                                  setVisibleKey(
                                    visibleKey === "whatsappToken"
                                      ? null
                                      : "whatsappToken",
                                  )
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {visibleKey === "whatsappToken" ? (
                                  <EyeOff size={18} />
                                ) : (
                                  <Eye size={18} />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Get from Meta App Dashboard → Settings → System User Tokens
                            </p>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <p className="text-sm text-blue-900 mb-2">
                              <strong>Setup Instructions:</strong>
                            </p>
                            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                              <li>
                                Create Meta Business Account at{" "}
                                <a
                                  href="https://business.facebook.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline"
                                >
                                  business.facebook.com
                                </a>
                              </li>
                              <li>Create WhatsApp Business App</li>
                              <li>Get Phone Number ID from App Dashboard</li>
                              <li>Generate System User token with whatsapp_business_messaging scope</li>
                            </ul>
                          </div>
                        </div>
                      </>
                    )}

                    {(whatsappSettings.mode === "web" ||
                      whatsappSettings.mode === "both") && (
                      <>
                        <div className="border-t pt-6">
                          <h4 className="font-medium text-foreground mb-4">
                            WhatsApp Web Configuration
                          </h4>

                          <div className="space-y-4">
                            {whatsappWebQR && !whatsappWebStatus && (
                              <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
                                <p className="text-sm font-medium text-foreground mb-3">
                                  Scan QR Code with WhatsApp
                                </p>
                                <div className="bg-white p-4 rounded inline-block">
                                  {/* Placeholder for QR code - in production use qr library */}
                                  <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                                    <p className="text-xs text-gray-500">QR Code Image</p>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">
                                  Waiting for authentication...
                                </p>
                              </div>
                            )}

                            <div className="p-4 rounded-lg border border-border">
                              <p className="text-sm font-medium mb-2">
                                Status:{" "}
                                <Badge variant={whatsappWebStatus ? "default" : "secondary"}>
                                  {whatsappWebStatus ? "Connected" : "Not Connected"}
                                </Badge>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {whatsappWebStatus
                                  ? "WhatsApp Web is authenticated and ready to send messages"
                                  : "Click Initialize to start authentication"}
                              </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <p className="text-sm text-amber-900 mb-2">
                                <strong>⚠️ Important Notice:</strong>
                              </p>
                              <p className="text-xs text-amber-800">
                                WhatsApp Web automation may violate WhatsApp Terms of Service and can
                                result in account suspension. Use Business API when possible.
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {whatsappSettings.mode === "both" && (
                      <div className="p-4 rounded-lg border border-border bg-green-50">
                        <p className="text-sm text-green-900">
                          ✓ <strong>Failover Enabled:</strong> System will try Business API first,
                          then fall back to WhatsApp Web if needed
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleSaveSettings("WhatsApp")}
                    className="gap-2"
                  >
                    <Save size={16} />
                    Save Settings
                  </Button>
                  {whatsappSettings.enabled &&
                    (whatsappSettings.mode === "business" ||
                      whatsappSettings.mode === "both") && (
                      <Button
                        onClick={handleTestWhatsApp}
                        variant="outline"
                        className="gap-2"
                        disabled={testingWhatsApp}
                      >
                        <MessageSquare size={16} />
                        {testingWhatsApp ? "Testing..." : "Test Business API"}
                      </Button>
                    )}
                  {whatsappSettings.enabled &&
                    (whatsappSettings.mode === "web" ||
                      whatsappSettings.mode === "both") && (
                      <>
                        {!whatsappWebStatus ? (
                          <Button
                            onClick={handleInitWhatsAppWeb}
                            variant="outline"
                            className="gap-2"
                            disabled={initializingWeb}
                          >
                            <MessageSquare size={16} />
                            {initializingWeb ? "Initializing..." : "Initialize Web"}
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={handleCheckWebStatus}
                              variant="outline"
                              className="gap-2"
                            >
                              Check Status
                            </Button>
                            <Button
                              onClick={handleLogoutWeb}
                              variant="outline"
                              className="gap-2 text-destructive"
                            >
                              Logout Web
                            </Button>
                          </>
                        )}
                      </>
                    )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* SMS Templates */}
          <TabsContent value="templates" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      SMS Message Templates
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Customize SMS messages sent to customers and technicians
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetSmsTemplates();
                      setSmsTemplates(getSmsTemplates());
                      toast({
                        title: "Reset",
                        description: "SMS templates reset to defaults",
                      });
                    }}
                  >
                    Reset to Defaults
                  </Button>
                </div>

                <div className="space-y-4">
                  {smsTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {template.name}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {template.eventType.replace(/_/g, " ")}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs bg-accent/10"
                            >
                              {template.recipientType}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded p-3 text-sm text-foreground mb-3 font-mono whitespace-pre-wrap break-words">
                        {template.message}
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          Available variables:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {template.variables.map((variable) => (
                            <Badge
                              key={variable}
                              variant="outline"
                              className="text-xs"
                            >
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setTemplateDialogOpen(true);
                        }}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Late Attendance Deductions */}
          <TabsContent value="deductions" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Late Attendance Deductions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure automatic salary deductions for late arrivals
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Enable Late Deductions</p>
                    <p className="text-sm text-muted-foreground">
                      {deductionSettings.enabled
                        ? "Deductions are enabled and will be applied to payroll"
                        : "Deductions are disabled"}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={deductionSettings.enabled}
                    onChange={(e) =>
                      setDeductionSettings({
                        ...deductionSettings,
                        enabled: e.target.checked,
                      })
                    }
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                {deductionSettings.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Late Threshold (minutes)
                        </label>
                        <Input
                          type="number"
                          value={deductionSettings.lateThresholdMinutes}
                          onChange={(e) =>
                            setDeductionSettings({
                              ...deductionSettings,
                              lateThresholdMinutes: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="15"
                          min="1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Minutes after official time before deduction applies
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Apply After (days)
                        </label>
                        <Input
                          type="number"
                          value={deductionSettings.applyAfterDays}
                          onChange={(e) =>
                            setDeductionSettings({
                              ...deductionSettings,
                              applyAfterDays: parseInt(e.target.value) || 1,
                            })
                          }
                          placeholder="1"
                          min="1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum late days before applying deduction
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Deduction Type
                      </label>
                      <Select
                        value={deductionSettings.deductionType}
                        onValueChange={(value) =>
                          setDeductionSettings({
                            ...deductionSettings,
                            deductionType: value as "fixed" | "percentage" | "scaled",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="scaled">Scaled by Minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {deductionSettings.deductionType === "fixed" && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Deduction Amount
                        </label>
                        <Input
                          type="number"
                          value={deductionSettings.fixedDeductionAmount}
                          onChange={(e) =>
                            setDeductionSettings({
                              ...deductionSettings,
                              fixedDeductionAmount: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Fixed amount deducted per late day
                        </p>
                      </div>
                    )}

                    {deductionSettings.deductionType === "percentage" && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Deduction Percentage
                        </label>
                        <Input
                          type="number"
                          value={deductionSettings.percentageDeduction}
                          onChange={(e) =>
                            setDeductionSettings({
                              ...deductionSettings,
                              percentageDeduction: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="2"
                          step="0.1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Percentage of daily salary to deduct
                        </p>
                      </div>
                    )}

                    {deductionSettings.deductionType === "scaled" && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Scaled Deductions
                        </label>
                        <div className="space-y-3 mb-3">
                          {deductionSettings.scaledDeductions?.map((scaled, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg border border-border flex items-center justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {scaled.minutesRange.min}-{scaled.minutesRange.max} minutes late
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Deduct: ${scaled.deductionAmount}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const updated = [
                                    ...(deductionSettings.scaledDeductions || []),
                                  ];
                                  updated.splice(idx, 1);
                                  setDeductionSettings({
                                    ...deductionSettings,
                                    scaledDeductions: updated,
                                  });
                                }}
                              >
                                <Trash size={14} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          Exclude Weekends
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Don't count late arrivals on weekends
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={deductionSettings.excludeWeekends}
                        onChange={(e) =>
                          setDeductionSettings({
                            ...deductionSettings,
                            excludeWeekends: e.target.checked,
                          })
                        }
                        className="w-5 h-5 cursor-pointer"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Example:</strong> If a technician is 20 minutes late on 2 days
                        in a month with fixed $50 deduction, their total deduction will be $100.
                      </p>
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSaveSettings("Deductions")}
                    className="gap-2"
                  >
                    <Save size={16} />
                    Save Deduction Settings
                  </Button>
                  <Button
                    onClick={() => {
                      resetDeductionSettings();
                      setDeductionSettings(getDeductionSettings());
                      toast({
                        title: "Reset",
                        description:
                          "Deduction settings reset to defaults",
                      });
                    }}
                    variant="outline"
                  >
                    Reset to Defaults
                  </Button>
                </div>
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
                      Account Prefix
                    </label>
                    <Input
                      value={companySettings.prefix}
                      onChange={(e) =>
                        handleCompanySettingChange("prefix", e.target.value.toUpperCase())
                      }
                      placeholder="ACC"
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for generating account numbers (e.g., {companySettings.prefix}-1000)
                    </p>
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

          {/* MPESA Settings */}
          <TabsContent value="mpesa" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    MPESA Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure Safaricom M-Pesa Daraja API for C2B, B2B, and STK Push payments
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Enable MPESA</p>
                    <p className="text-sm text-muted-foreground">
                      {mpesaSettings.enabled
                        ? "MPESA integration is active"
                        : "MPESA integration is disabled"}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={mpesaSettings.enabled}
                    onChange={(e) =>
                      setMpesaSettings({
                        ...mpesaSettings,
                        enabled: e.target.checked,
                      })
                    }
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                {mpesaSettings.enabled && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900 mb-2">
                        <strong>📋 Get Your Credentials:</strong>
                      </p>
                      <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                        <li>
                          Visit{" "}
                          <a
                            href="https://developer.safaricom.co.ke"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-medium"
                          >
                            Safaricom Developer Portal
                          </a>
                        </li>
                        <li>Create a sandbox app in the M-Pesa category</li>
                        <li>
                          Get your Consumer Key and Consumer Secret from app
                          details
                        </li>
                        <li>Get your Business Short Code (test till number)</li>
                        <li>Get your Passkey from test credentials</li>
                      </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Consumer Key
                        </label>
                        <div className="relative">
                          <Input
                            type={visibleKey === "consumerKey" ? "text" : "password"}
                            value={mpesaSettings.consumerKey}
                            onChange={(e) =>
                              setMpesaSettings({
                                ...mpesaSettings,
                                consumerKey: e.target.value,
                              })
                            }
                            placeholder="Your Consumer Key"
                          />
                          <button
                            onClick={() =>
                              setVisibleKey(
                                visibleKey === "consumerKey"
                                  ? null
                                  : "consumerKey",
                              )
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {visibleKey === "consumerKey" ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Consumer Secret
                        </label>
                        <div className="relative">
                          <Input
                            type={
                              visibleKey === "consumerSecret"
                                ? "text"
                                : "password"
                            }
                            value={mpesaSettings.consumerSecret}
                            onChange={(e) =>
                              setMpesaSettings({
                                ...mpesaSettings,
                                consumerSecret: e.target.value,
                              })
                            }
                            placeholder="Your Consumer Secret"
                          />
                          <button
                            onClick={() =>
                              setVisibleKey(
                                visibleKey === "consumerSecret"
                                  ? null
                                  : "consumerSecret",
                              )
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {visibleKey === "consumerSecret" ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Business Short Code
                        </label>
                        <Input
                          value={mpesaSettings.businessShortCode}
                          onChange={(e) =>
                            setMpesaSettings({
                              ...mpesaSettings,
                              businessShortCode: e.target.value,
                            })
                          }
                          placeholder="174379 (sandbox) or your till number"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Your M-Pesa till/paybill number
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Passkey
                        </label>
                        <div className="relative">
                          <Input
                            type={visibleKey === "passkey" ? "text" : "password"}
                            value={mpesaSettings.passkey}
                            onChange={(e) =>
                              setMpesaSettings({
                                ...mpesaSettings,
                                passkey: e.target.value,
                              })
                            }
                            placeholder="Your M-Pesa Passkey"
                          />
                          <button
                            onClick={() =>
                              setVisibleKey(
                                visibleKey === "passkey" ? null : "passkey",
                              )
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {visibleKey === "passkey" ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          12-character passkey from test credentials
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Callback URL
                        </label>
                        <Input
                          value={mpesaSettings.callbackUrl}
                          onChange={(e) =>
                            setMpesaSettings({
                              ...mpesaSettings,
                              callbackUrl: e.target.value,
                            })
                          }
                          placeholder="https://yourdomain.com/api/mpesa/callback"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          URL to receive payment confirmations from MPESA
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Validation URL
                        </label>
                        <Input
                          value={mpesaSettings.validationUrl}
                          onChange={(e) =>
                            setMpesaSettings({
                              ...mpesaSettings,
                              validationUrl: e.target.value,
                            })
                          }
                          placeholder="https://yourdomain.com/api/mpesa/validation"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          URL for validating incoming payments
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Confirmation URL
                        </label>
                        <Input
                          value={mpesaSettings.confirmationUrl}
                          onChange={(e) =>
                            setMpesaSettings({
                              ...mpesaSettings,
                              confirmationUrl: e.target.value,
                            })
                          }
                          placeholder="https://yourdomain.com/api/mpesa/confirmation"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          URL to receive final payment confirmation
                        </p>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-900 mb-2">
                        <strong>⚠️ Important:</strong>
                      </p>
                      <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
                        <li>
                          These credentials are sensitive - store them securely
                        </li>
                        <li>
                          Never commit credentials to version control or public
                          code
                        </li>
                        <li>
                          Callback URLs must be publicly accessible for MPESA to
                          send notifications
                        </li>
                        <li>
                          Test your setup in sandbox before going to production
                        </li>
                      </ul>
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSaveSettings("MPESA")}
                    className="gap-2"
                  >
                    <Save size={16} />
                    Save MPESA Settings
                  </Button>
                  <Button
                    onClick={() => {
                      resetMpesaSettings();
                      setMpesaSettings(getMpesaSettings());
                      toast({
                        title: "Reset",
                        description: "MPESA settings reset to defaults",
                      });
                    }}
                    variant="outline"
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
