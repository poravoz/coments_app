import React, { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import "./SignUpPage.css";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Captcha } from "../../components/Captcha/captcha";

export const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    repeatPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaValid, setCaptchaValid] = useState<boolean | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const { signUp, isSigningUp } = useAuthStore();
  const navigate = useNavigate();

  const validateForm = () => {    
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }

    if (formData.name.trim().length < 2 || formData.name.trim().length > 10) {
      toast.error("Name must be between 2 and 10 characters");
      return false;
    }
  
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }
    if (!formData.password.trim()) {
      toast.error("Password is required");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (formData.password !== formData.repeatPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (captchaValid !== true) {
      toast.error("Please complete the CAPTCHA correctly");
      return false;
    }
    
    return true;
  };  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await signUp({
          ...formData,
          captchaToken,
          captchaValue: captchaInput
        });
        navigate("/login");
      } catch {
        toast.error("Something went wrong");
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Join us today</h1>
          <p className="register-subtitle">
            Start your journey with a new account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label className="form-label">Name</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                type="text"
                className="form-input"
                placeholder="Mykola"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                autoComplete="off"
                maxLength={10} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                autoComplete="off"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Repeat Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={formData.repeatPassword}
                onChange={(e) =>
                  setFormData({ ...formData, repeatPassword: e.target.value })
                }
                autoComplete="off"
              />
            </div>
          </div>
            
          <Captcha
            value={captchaInput}
            onChange={setCaptchaInput}
            onValidate={setCaptchaValid}
            onTokenChange={setCaptchaToken}
          />

          <button type="submit" className="submit-button" disabled={isSigningUp}>
            {isSigningUp ? (
              <>
                <Loader2 className="loader2_sign_up" />
                Loading...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <a href="/login" className="login-link">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};