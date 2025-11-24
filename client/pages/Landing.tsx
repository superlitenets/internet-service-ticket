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
  Loader,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getMikrotikPlans } from "@/lib/mikrotik-client";
import { MikrotikPlan } from "@shared/api";

export default function Landing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<MikrotikPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const fetchedPlans = await getMikrotikPlans();
        setPlans(fetchedPlans);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        // Fall back to empty plans if fetch fails
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 backdrop-blur-sm sticky top-0 z-50 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wifi size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">NetFlow</span>
          </div>
          <Button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-slate-900">
                Manage Your ISP Business
                <span className="text-blue-600"> with Confidence</span>
              </h1>
              <p className="text-xl text-slate-600">
                NetFlow CRM is the complete solution for managing ISP customers,
                billing, support tickets, and network monitoring all in one place.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => navigate("/login")}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 gap-2 text-white"
              >
                Get Started
                <ArrowRight size={18} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-300 text-slate-900 hover:bg-slate-100"
              >
                Learn More
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-8">
              <div>
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <p className="text-slate-600">ISP Providers</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">50K+</div>
                <p className="text-slate-600">Customers Managed</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">99.9%</div>
                <p className="text-slate-600">Uptime</p>
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

      {/* Infrastructure & Deployment Section */}
      <section className="border-t border-slate-700/50 py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Cloud Hosting & Server Deployment</h2>
            <p className="text-xl text-slate-400">
              Enterprise infrastructure designed for high-performance ISP operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Secure Cloud Infrastructure",
                description:
                  "Deploy on secure, isolated cloud servers with enterprise-grade encryption and DDoS protection",
              },
              {
                icon: Zap,
                title: "Lightning-Fast Performance",
                description:
                  "Multi-region server deployment for low-latency access and optimized customer experience",
              },
              {
                icon: BarChart3,
                title: "Auto Scaling",
                description:
                  "Automatically scale resources based on demand to handle peak traffic without downtime",
              },
              {
                icon: Clock,
                title: "99.99% Uptime SLA",
                description:
                  "Guaranteed uptime with redundant infrastructure and automatic failover systems",
              },
              {
                icon: Wifi,
                title: "Global CDN",
                description:
                  "Serve content worldwide with edge servers for faster page loads and improved reliability",
              },
              {
                icon: Users,
                title: "Containerized Deployment",
                description:
                  "Docker & Kubernetes support for seamless application deployment and management",
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

      {/* Internet Packages Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Internet Packages</h2>
            <p className="text-xl text-slate-400">
              Choose the perfect internet speed for your needs
            </p>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex items-center gap-3">
                <Loader className="animate-spin" size={24} />
                <p className="text-slate-400">Loading packages...</p>
              </div>
            </div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan, i) => (
                <div
                  key={plan.id}
                  className={`p-8 rounded-xl border transition-all transform hover:scale-105 ${
                    i === 1
                      ? "border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-500/20"
                      : "border-slate-700/50 bg-slate-800/30 hover:border-blue-500/30"
                  }`}
                >
                  {i === 1 && (
                    <div className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.planName}</h3>
                  <p className="text-slate-400 mb-4 text-sm line-clamp-2">
                    {plan.description || "High-speed internet package"}
                  </p>

                  <div className="mb-6">
                    <div className="text-4xl font-bold text-blue-400">
                      KES {plan.monthlyFee.toLocaleString()}
                    </div>
                    <span className="text-slate-400">/month</span>
                  </div>

                  <div className="space-y-3 mb-8 pb-8 border-b border-slate-700">
                    {plan.speed && (
                      <div className="flex items-center gap-3">
                        <Zap size={18} className="text-yellow-400 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Speed</p>
                          <p className="text-sm text-slate-400">
                            {plan.speed.uploadMbps} ↑ / {plan.speed.downloadMbps} ↓ Mbps
                          </p>
                        </div>
                      </div>
                    )}

                    {plan.dataQuota && (
                      <div className="flex items-center gap-3">
                        <BarChart3 size={18} className="text-cyan-400 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Data Quota</p>
                          <p className="text-sm text-slate-400">
                            {plan.dataQuota} GB / month
                          </p>
                        </div>
                      </div>
                    )}

                    {plan.planType && (
                      <div className="flex items-center gap-3">
                        <Wifi size={18} className="text-green-400 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Plan Type</p>
                          <p className="text-sm text-slate-400 capitalize">
                            {plan.planType.replace("-", " ")}
                          </p>
                        </div>
                      </div>
                    )}

                    {plan.setupFee > 0 && (
                      <div className="flex items-center gap-3">
                        <Check size={18} className="text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Setup Fee</p>
                          <p className="text-sm text-slate-400">
                            KES {plan.setupFee.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => navigate("/login")}
                    className={`w-full ${
                      i === 1
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-slate-700 hover:bg-slate-600"
                    }`}
                  >
                    Subscribe Now
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-400 text-lg">No packages available yet. Please check back soon!</p>
            </div>
          )}
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
