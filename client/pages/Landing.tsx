import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Wifi,
  Zap,
  Shield,
  BarChart3,
  Users,
  Clock,
  ArrowRight,
  Check,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wifi size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold">NetFlow</span>
          </div>
          <Button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Manage Your ISP Business
                <span className="text-blue-400"> with Confidence</span>
              </h1>
              <p className="text-xl text-slate-300">
                NetFlow CRM is the complete solution for managing ISP customers,
                billing, support tickets, and network monitoring all in one place.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => navigate("/login")}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                Get Started
                <ArrowRight size={18} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-800"
              >
                Learn More
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-8">
              <div>
                <div className="text-3xl font-bold text-blue-400">500+</div>
                <p className="text-slate-400">ISP Providers</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">50K+</div>
                <p className="text-slate-400">Customers Managed</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">99.9%</div>
                <p className="text-slate-400">Uptime</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-lg">
                    <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                      <BarChart3 size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Real-time Analytics</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Track revenue and customer metrics in real-time
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-lg">
                    <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center flex-shrink-0">
                      <Clock size={24} className="text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold">24/7 Support</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Manage support tickets efficiently
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-lg">
                    <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <Shield size={24} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Secure & Reliable</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Enterprise-grade security for your data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-slate-700/50 py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-400">
              Everything you need to run your ISP business efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Customer Management",
                description:
                  "Manage customer accounts, profiles, and service subscriptions all in one place",
              },
              {
                icon: BarChart3,
                title: "Billing & Invoicing",
                description:
                  "Automated billing, invoicing, and payment tracking with detailed reports",
              },
              {
                icon: Wifi,
                title: "Network Monitoring",
                description:
                  "Real-time monitoring of bandwidth, connections, and network health",
              },
              {
                icon: Clock,
                title: "Ticket Management",
                description:
                  "Efficient support ticket system with automatic assignment and tracking",
              },
              {
                icon: Zap,
                title: "Fast Integration",
                description:
                  "Easy integration with Mikrotik, RADIUS, and WhatsApp services",
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                description:
                  "Enterprise-grade security with automatic backups and 99.9% uptime",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 border border-slate-700/50 rounded-xl bg-slate-800/50 hover:border-blue-500/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-slate-400">
              Choose the plan that fits your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "$299",
                description: "Perfect for small ISPs",
                features: [
                  "Up to 100 customers",
                  "Basic billing",
                  "Email support",
                  "Monthly reports",
                ],
              },
              {
                name: "Professional",
                price: "$599",
                description: "For growing ISPs",
                features: [
                  "Up to 500 customers",
                  "Advanced billing",
                  "Priority support",
                  "Real-time analytics",
                  "Custom reports",
                  "API access",
                ],
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "For large networks",
                features: [
                  "Unlimited customers",
                  "Full automation",
                  "24/7 dedicated support",
                  "Custom integrations",
                  "SLA guarantee",
                  "On-premise option",
                ],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`p-8 rounded-xl border transition-all ${
                  plan.highlighted
                    ? "border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-500/20"
                    : "border-slate-700/50 bg-slate-800/30 hover:border-blue-500/30"
                }`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-slate-400 mb-4">{plan.description}</p>
                <div className="text-3xl font-bold mb-6">
                  {plan.price}
                  {plan.price !== "Custom" && (
                    <span className="text-lg text-slate-400">/month</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <Check size={18} className="text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate("/login")}
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-slate-700/50 py-20 bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your ISP Business?</h2>
          <p className="text-xl text-slate-400 mb-8">
            Join hundreds of ISP providers who trust NetFlow to manage their operations
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-12 text-center text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© 2024 NetFlow CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
