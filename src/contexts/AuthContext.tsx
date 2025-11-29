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

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch user");
  }

  const data = await response.json();
  return data.user;
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
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Remove token if unauthorized
  useEffect(() => {
    if (error && (error as Error).message === "Unauthorized") {
      setTokenState(null);
      removeToken();
    }
  }, [error]);

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

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
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
