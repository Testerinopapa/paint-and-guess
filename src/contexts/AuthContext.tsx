import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";

interface User {
  id: string;
  email: string;
  username: string;
  avatarConfig: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, avatarConfig?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";

// Helper functions
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// API functions
async function fetchUser(): Promise<User> {
  const token = getToken();
  if (!token) {
    throw new Error("No token");
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        // Don't remove token here, let the error handler do it
        throw new Error("Unauthorized");
      }
      throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.user) {
      throw new Error("Invalid user data received");
    }
    return data.user;
  } catch (error) {
    // Re-throw network errors as-is, but don't remove token (might be temporary)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      throw error; // Re-throw auth errors
    }
    // For other errors (network issues), log in development only
    // Don't spam console in production - this is expected when backend is down
    if (import.meta.env.DEV) {
      console.warn("[Auth] Cannot connect to authentication server (backend may be down):", error);
    }
    throw new Error("Network error: Could not connect to authentication server");
  }
}

async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  return await response.json();
}

async function registerUser(
  email: string,
  username: string,
  password: string,
  avatarConfig?: string
): Promise<{ user: User; token: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, username, password, avatarConfig }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Registration failed");
  }

  return await response.json();
}

async function logoutUser(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Ignore logout errors
    }
  }
  removeToken();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const queryClient = useQueryClient();

  // Fetch user if token exists
  const {
    data: user,
    isLoading,
    error,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: fetchUser,
    enabled: !!token,
    retry: (failureCount, error) => {
      // Only retry on network errors, not auth errors
      if (error instanceof Error && error.message === "Unauthorized") {
        return false;
      }
      // Retry network errors up to 1 time (reduced from 2 to fail faster)
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes even if query fails
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: false, // Don't refetch when network reconnects (like socket connection)
    refetchOnMount: false, // Don't refetch every time component mounts if data is still fresh
    // Keep previous data on error - don't clear user data if query fails
    placeholderData: (previousData) => previousData,
    // Don't throw errors to console - handle gracefully
    throwOnError: false,
  });

  // Remove token only on actual 401 Unauthorized, not network errors
  useEffect(() => {
    if (error) {
      const errorMessage = (error as Error).message;
      // Only remove token on explicit unauthorized, not network failures
      if (errorMessage === "Unauthorized") {
        console.log("[Auth] Unauthorized, removing token");
        setTokenState(null);
        removeToken();
        queryClient.setQueryData(["auth", "user"], null);
      } else {
        // Log other errors (network issues) in development only
        // This is expected when backend is unavailable
        if (import.meta.env.DEV) {
          console.warn("[Auth] Cannot fetch user (backend may be unavailable):", errorMessage);
        }
      }
    }
  }, [error, queryClient]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUser(email, password),
    onSuccess: (data) => {
      setToken(data.token);
      setTokenState(data.token);
      queryClient.setQueryData(["auth", "user"], data.user);
      toast.success("Login successful!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({
      email,
      username,
      password,
      avatarConfig,
    }: {
      email: string;
      username: string;
      password: string;
      avatarConfig?: string;
    }) => registerUser(email, username, password, avatarConfig),
    onSuccess: (data) => {
      setToken(data.token);
      setTokenState(data.token);
      queryClient.setQueryData(["auth", "user"], data.user);
      toast.success("Registration successful!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Registration failed");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      setTokenState(null);
      queryClient.setQueryData(["auth", "user"], null);
      toast.success("Logged out successfully");
    },
    onError: () => {
      // Even if logout fails, clear local state
      setTokenState(null);
      queryClient.setQueryData(["auth", "user"], null);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (email: string, username: string, password: string, avatarConfig?: string) => {
    await registerMutation.mutateAsync({ email, username, password, avatarConfig });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const updateUser = async () => {
    await refetchUser();
  };

  // Only show loading on initial load, not during refetches
  const isInitialLoading = isLoading && !user && !!token;

  const value: AuthContextType = {
    user: user || null,
    isLoading: isInitialLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
