import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { AuthUser, SignInData, SignUpData } from "../types/auth";
import toast from "react-hot-toast";
import { apolloClient } from "../lib/apolloClient";
import { AVATAR_UPDATED_SUBSCRIPTION } from "../graphql/operations";

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
  subscribeToAvatarUpdates: () => () => void;
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
    } catch (error) {
      console.error("Registration error:", error);
      toast.error((error as Error)?.message);
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
    } catch (error) {
      console.error("Login error:", error);
      toast.error((error as Error)?.message);
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
    } catch (error) {
      toast.error((error as Error)?.message);
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
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error((error as Error)?.message);
    }
  },

  removeAvatar: async () => {
    try {
      await axiosInstance.delete<AuthUser>("/users/avatar", { withCredentials: true });
      toast.success("Avatar removed successfully");
    } catch (error) {
      console.error("Avatar removal error:", error);
      toast.error((error as Error)?.message);
    }
  },

  subscribeToAvatarUpdates: () => {
    const currentUser = get().authUser;
    
    if (!currentUser?.id) {
      return () => {};
    }
  
    
    try {
      const subscription = apolloClient.subscribe({
        query: AVATAR_UPDATED_SUBSCRIPTION,
        variables: {
          userId: currentUser.id
        }
      }).subscribe({
        next: (result: any) => {
          
          const avatarUpdated = result.data?.avatarUpdated;
          
          if (avatarUpdated) {
            const updatedUser = avatarUpdated;
            const currentUserState = get().authUser;
            
            
            if (currentUserState && currentUserState.id === updatedUser.id) {
              set({ 
                authUser: { 
                  ...currentUserState, 
                  avatarUrl: updatedUser.avatarUrl 
                } 
              });
            }
          } else {
          }
        },
        error: (error: Error) => {
          console.error('Subscription error:', error);
        },
      });
  
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to create avatar subscription:', error);
      return () => {};
    }
  },
}));