import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { AuthUser, SignInData, SignUpData } from "../types/auth";
import toast from "react-hot-toast";

interface AuthState {
  authUser: AuthUser | null;
  isSigningUp: boolean;
  isLogging: boolean;
  isCheckingAuth: boolean;
  checkAuth: () => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkCaptchaRequirement: (email: string) => Promise<boolean>;
  updateAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLogging: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get<AuthUser>("/authentication/check-auth");
      set({ authUser: res.data });
    } catch (error) {
      console.error("Error in checkAuth", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  checkCaptchaRequirement: async (email: string) => {
    try {
      const res = await axiosInstance.post("/authentication/check-captcha-requirement", {
        email,
      });
      return res.data.captchaRequired;
    } catch (error) {
      console.error("Failed to check CAPTCHA requirement:", error);
      return false;
    }
  },

  signUp: async (data: SignUpData) => {
    set({ isSigningUp: true });
    try {
      await axiosInstance.post("/authentication/register", data, { withCredentials: true });
      toast.success("Account created successfully");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      set({ isSigningUp: false });
    }
  },

  signIn: async (data: SignInData) => {
    set({ isLogging: true });
    try {
      const res = await axiosInstance.post<AuthUser>("/authentication/log-in", data, {
        withCredentials: true,
      });
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error?.response?.data?.message || "Invalid credentials");
      return false;
    } finally {
      set({ isLogging: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/authentication/log-out");
      set({ authUser: null });
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  updateAvatar: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axiosInstance.post<AuthUser>("/users/avatar", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      set({ authUser: res.data });
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error?.response?.data?.message || "Failed to update avatar");
    }
  },

  removeAvatar: async () => {
    try {
      await axiosInstance.delete<AuthUser>("/users/avatar", { withCredentials: true });
      const currentUser = get().authUser;
      set({ authUser: currentUser ? { ...currentUser, avatarUrl: null } : null });
      toast.success("Avatar removed successfully");
    } catch (error: any) {
      console.error("Avatar removal error:", error);
      toast.error(error?.response?.data?.message || "Failed to remove avatar");
    }
  },
}));