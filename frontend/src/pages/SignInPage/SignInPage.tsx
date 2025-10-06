import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { Captcha } from "../../components/Captcha/captcha";
import "./SignInPage.css";
import toast from "react-hot-toast";

export const SignInPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaValid, setCaptchaValid] = useState<boolean | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const { signIn, isLogging, checkCaptchaRequirement } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRequirement = async () => {
      if (!formData.email.trim()) return;
      
      try {
        const required = await checkCaptchaRequirement(formData.email);
        setCaptchaRequired(required);
        console.log("CAPTCHA required:", required);
      } catch (error) {
        console.error("Failed to check CAPTCHA requirement:", error);
      }
    };

    const timeout = setTimeout(checkRequirement, 300);
    return () => clearTimeout(timeout);
  }, [formData.email, checkCaptchaRequirement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (captchaRequired) {
      if (!captchaValue || !captchaValue.trim() || captchaValid !== true) {
        setCaptchaValid(false);
        toast.error("Please complete the CAPTCHA correctly");
        return;
      }
    }
  
    const loginData = {
      ...formData,
      ...(captchaRequired && { captchaToken, captchaValue })
    };
  
    const success = await signIn(loginData);
  
    if (success) {
      navigate("/");
    } else {
      const required = await checkCaptchaRequirement(formData.email);
      setCaptchaRequired(required);
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

          {captchaRequired && (
            <Captcha
              value={captchaValue}
              onChange={setCaptchaValue}
              onValidate={setCaptchaValid}
              onTokenChange={setCaptchaToken}
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