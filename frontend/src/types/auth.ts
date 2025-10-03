export interface AuthUser {
    id: string;
    email: string;
    name: string;
  }

export interface SignUpData {
    name: string;
    email: string;
    password: string;
  }

  export interface SignInData {
    email: string;
    password: string;
  }