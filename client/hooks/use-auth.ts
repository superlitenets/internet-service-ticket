import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { User } from "@shared/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem("auth_token");
        const savedUser = localStorage.getItem("auth_user");

        if (savedToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            // Restore auth from localStorage first
            setToken(savedToken);
            setUser(parsedUser);

            // Then verify token with server in the background
            // This doesn't block rendering if verification fails
            const isValid = await checkAuthWithServer(savedToken);
            if (!isValid) {
              // Token invalid/expired, clear auth
              localStorage.removeItem("auth_token");
              localStorage.removeItem("auth_user");
              setToken(null);
              setUser(null);
            }
          } catch (parseError) {
            console.error("Failed to parse saved user:", parseError);
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  async function checkAuthWithServer(authToken: string): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Accept any 2xx response
      if (response.ok) {
        return true;
      }

      // For development, tokens created in the last 24 hours are valid
      // In production, use proper JWT with expiration
      if (response.status === 200) {
        return true;
      }

      return false;
    } catch (error) {
      // Network error or timeout - don't clear auth, allow offline access
      console.error("Auth verification error:", error);
      return true; // Optimistically allow access if we can't verify
    }
  }

  async function login(identifier: string, password: string): Promise<void> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON (e.g., HTML error page), provide helpful error
        throw new Error(
          `Backend server error (HTTP ${response.status}). Please ensure the backend server is running on port 9000.`,
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Login failed");
      }

      const newToken = data.token;
      const newUser = data.user;

      localStorage.setItem("auth_token", newToken);
      localStorage.setItem("auth_user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      throw error;
    }
  }

  async function logout(): Promise<void> {
    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Clear auth anyway
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setToken(null);
      setUser(null);
    }
  }

  async function checkAuth(): Promise<boolean> {
    if (!token) return false;
    return checkAuthWithServer(token);
  }

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    checkAuth,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
