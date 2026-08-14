import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "../types";

import {
  fetchWithAuth,
  setTokens,
  clearTokens,
  getAccessToken,
} from "../services/api";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AuthContextType {
  currentUser: User | null;
  authLoading: boolean;
  activeModal: "login" | "register" | "profile" | null;
  toasts: ToastItem[];
  openModal: (modalName: "login" | "register" | "profile") => void;
  closeModal: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  handleLogin: (email: string, password: string) => Promise<boolean>;
  handleRegister: (
    email: string,
    password: string,
    firstName: string,
    lastName?: string,
  ) => Promise<boolean>;
  handleLogout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModal, setActiveModal] = useState<
    "login" | "register" | "profile" | null
  >(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const openModal = (modalName: "login" | "register" | "profile") => {
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const checkAuthStatus = async () => {
    const token = getAccessToken();

    if (!token) {
      setCurrentUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      const res = await fetchWithAuth("/api/auth/me");
      const json = await res.json();

      if (json.success && json.data) {
        setCurrentUser(json.data);
      } else {
        clearTokens();
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Check auth status error:", err);
      clearTokens();
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "Đăng nhập thất bại");
      }

      setTokens(json.data.accessToken, json.data.refreshToken);
      if (json.data.user && json.data.user.firstName) {
        setCurrentUser(json.data.user);
      }
      closeModal();
      await checkAuthStatus();
      showToast(
        `🎉 Đăng nhập thành công! Chào mừng ${json.data.user?.firstName || ""} trở lại.`,
        "success",
      );
      return true;
    } catch (err: any) {
      showToast(err.message || "Đăng nhập thất bại", "error");
      return false;
    }
  };

  const handleRegister = async (
    email: string,
    password: string,
    firstName: string,
    lastName?: string,
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "Đăng ký thất bại");
      }

      setTokens(json.data.accessToken, json.data.refreshToken);
      closeModal();
      await checkAuthStatus();
      showToast(`🎉 Đăng ký tài khoản thành công!`, "success");
      return true;
    } catch (err: any) {
      showToast(err.message || "Đăng ký thất bại", "error");
      return false;
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("smartcook_refresh_token");
    if (refreshToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (err) {
        console.error("Logout API error:", err);
      }
    }

    clearTokens();
    setCurrentUser(null);
    closeModal();
    showToast("👋 Đã đăng xuất tài khoản thành công.", "success");
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authLoading,
        activeModal,
        toasts,
        openModal,
        closeModal,
        showToast,
        handleLogin,
        handleRegister,
        handleLogout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
