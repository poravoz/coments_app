export interface SignUpData {
  name: string;
  email: string;
  password: string;
  repeatPassword: string;
  captchaToken?: string;
  captchaValue?: string;
}

export interface SignInData {
  email: string;
  password: string;
  captchaToken?: string;
  captchaValue?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}