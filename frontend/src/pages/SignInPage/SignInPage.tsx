import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { Captcha } from "../../components/Captcha/captcha";
import "./SignInPage.css";

export const SignInPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaValid, setCaptchaValid] = useState<boolean | null>(null);

  const { signIn, isLogging } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Если показана капча, проверяем её
    if (failedAttempts >= 3 && !captchaValid) {
      if (!captchaValue || !captchaValue.trim()) {
        setCaptchaValid(false);
        return;
      }
    }

    const success = await signIn(formData);
    if (success) {
      setFailedAttempts(0);
      navigate("/");
    } else {
      setFailedAttempts(prev => prev + 1);
      if (failedAttempts + 1 >= 3) setCaptchaValid(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1 className="signin-title">Welcome Back</h1>
          <p className="signin-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          {/* CAPTCHA after 3 unsuccessful attempts */}
          {failedAttempts >= 3 && (
          <Captcha
            value={captchaValue}
            onChange={setCaptchaValue}
            onValidate={setCaptchaValid}
          />
        )}

          <button type="submit" className="submit-button" disabled={isLogging}>
            {isLogging ? (
              <>
                <Loader2 className="loader2_sign_in" /> Loading...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="signin-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="login-link">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
