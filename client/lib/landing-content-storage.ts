// Landing content stored in localStorage for persistence
const LANDING_CONTENT_KEY = "landing_content";

export interface LandingContent {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
  featuresTitle: string;
  featuresDescription: string;
  packagesTitle: string;
  packagesDescription: string;
  ctaSectionTitle: string;
  ctaSectionDescription: string;
  email: string;
  phone: string;
  companyName: string;
}

const defaultContent: LandingContent = {
  heroTitle: "Manage Your ISP Business",
  heroSubtitle: "with Confidence",
  heroDescription:
    "NetFlow CRM is the complete solution for managing ISP customers, billing, support tickets, and network monitoring all in one place.",
  ctaPrimary: "Get Started",
  ctaSecondary: "Learn More",
  featuresTitle: "Cloud Hosting & Server Deployment",
  featuresDescription:
    "Enterprise infrastructure designed for high-performance ISP operations",
  packagesTitle: "Our Internet Packages",
  packagesDescription: "Choose the perfect internet speed for your needs",
  ctaSectionTitle: "Ready to Transform Your ISP Business?",
  ctaSectionDescription:
    "Join hundreds of ISP providers who trust NetFlow to manage their operations",
  email: "support@superlite.co.ke",
  phone: "0709367600",
  companyName: "NetFlow",
};

export function getLandingContent(): LandingContent {
  try {
    const stored = localStorage.getItem(LANDING_CONTENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load landing content:", error);
  }
  return defaultContent;
}

export function saveLandingContent(content: LandingContent): void {
  try {
    localStorage.setItem(LANDING_CONTENT_KEY, JSON.stringify(content));
  } catch (error) {
    console.error("Failed to save landing content:", error);
    throw error;
  }
}

export function resetLandingContent(): void {
  try {
    localStorage.removeItem(LANDING_CONTENT_KEY);
  } catch (error) {
    console.error("Failed to reset landing content:", error);
  }
}
