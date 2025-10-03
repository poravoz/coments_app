import {create} from "zustand";
import { axiosInstanace } from "../lib/axios";
import {AuthUser, SignInData, SignUpData} from "../types/auth";
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
  }
  
  export const useAuthStore = create<AuthState>((set) => ({
    authUser: null,
    isSigningUp: false,
    isLogging: false,
    isCheckingAuth: true,
  
    checkAuth: async () => {
      try {
        const res = await axiosInstanace.get<AuthUser>("/authentication/check-auth");
        set({ authUser: res.data });
      } catch (error) {
        console.error("Error in checkAuth", error);
        set({ authUser: null });
      } finally {
        set({ isCheckingAuth: false });
      }
    },

    signUp: async (data: SignUpData) => {
        set({ isSigningUp: true });
        try {
          await axiosInstanace.post("/authentication/register", data, { withCredentials: true });
          toast.success("Account created successfully");
        } catch (error) {
          toast.error((error as any)?.response?.data?.message);
        } finally {
          set({ isSigningUp: false });
        }
      },
    
      signIn: async (data: SignInData) => {
        set({ isLogging: true });
        try {
          const res = await axiosInstanace.post<AuthUser>("/authentication/log-in", data, { withCredentials: true });
          set({ authUser: res.data });
          toast.success("Logged in successfully");
          return true;
        } catch (error: any) {
          toast.error(error?.response?.data?.message);
          return false;
        } finally {
          set({ isLogging: false });
        }
      },
      
  
      logout: async () => {
        try {
          await axiosInstanace.post("/authentication/log-out");
          set({ authUser: null });
          toast.success("Logged out successfully");
        } catch(error: any) {
          toast.error(error.response.data.message)
        }
      },
  }));