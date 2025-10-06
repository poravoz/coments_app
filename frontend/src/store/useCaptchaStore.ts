import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

interface CaptchaStore {
  generateCaptcha: () => Promise<{ text: string; token: string }>;
  validateCaptcha: (token: string, value: string) => Promise<boolean>;
  checkToken: (token: string) => Promise<boolean>;
}

export const useCaptchaStore = create<CaptchaStore>(() => ({
  generateCaptcha: async () => {
    try {
      const res = await axiosInstance.post("/captcha/generate");
      return res.data;
    } catch (error) {
      console.error("Failed to generate CAPTCHA:", error);
      throw error;
    }
  },

  validateCaptcha: async (token: string, value: string) => {
    try {
      const res = await axiosInstance.post("/captcha/validate", {
        token,
        value,
      });
      return res.data.valid;
    } catch (error) {
      console.error("Failed to validate CAPTCHA:", error);
      return false;
    }
  },

  checkToken: async (token: string) => {
    try {
      const res = await axiosInstance.post("/captcha/check-token", {
        token,
      });
      return res.data.valid;
    } catch (error) {
      console.error("Failed to check token:", error);
      return false;
    }
  },
}));