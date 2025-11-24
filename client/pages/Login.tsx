import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogIn, AlertCircle, Loader } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = "Phone number or email is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      await authLogin(formData.identifier.trim(), formData.password);

      toast({
        title: "Success",
        description: "Login successful. Redirecting...",
      });

      // Navigate after a brief delay to allow the toast to display
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-lg bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <LogIn size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">NetFlow CRM</h1>
          <p className="text-slate-400">ISP & Network Management System</p>
        </div>

        {/* Login Card */}
        <Card className="p-8 border-0 shadow-2xl bg-slate-800">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Identifier Field */}
            <div>
              <label className="block text-sm font-medium text-slate-100 mb-2">
                Phone Number or Email
              </label>
              <Input
                type="text"
                placeholder="e.g., 0722123456 or admin@example.com"
                value={formData.identifier}
                onChange={(e) => {
                  setFormData({ ...formData, identifier: e.target.value });
                  setErrors({ ...errors, identifier: "" });
                }}
                disabled={loading}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
              {errors.identifier && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {errors.identifier}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-100 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setErrors({ ...errors, password: "" });
                  }}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 text-sm"
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 py-2 h-auto"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {loading ? "Logging in..." : "Login"}
            </Button>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400 mb-3">Demo Credentials:</p>
              <div className="space-y-2 text-xs text-slate-500 bg-slate-700 p-3 rounded">
                <p>
                  <span className="text-slate-400 font-medium">Admin:</span> admin@example.com /
                  password123
                </p>
                <p>
                  <span className="text-slate-400 font-medium">Support:</span> support@example.com /
                  password123
                </p>
                <p>
                  <span className="text-slate-400 font-medium">Customer:</span> 0722000000 /
                  password123
                </p>
              </div>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-8">
          © 2024 NetFlow CRM. All rights reserved.
        </p>
      </div>
    </div>
  );
}
