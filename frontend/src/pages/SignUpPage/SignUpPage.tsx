import { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import "./SignUpPage.css";
import { useAuthStore } from "../../store/useAuthStore";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const {signUp, isSigningUp } = useAuthStore();
  const navigate = useNavigate();

  const validateForm = () => {
    if(!formData.name.trim()) return toast.error("Full name is required");
    if(!formData.email.trim()) return toast.error("Email is required");
    if(!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if(!formData.password.trim()) return toast.error("Password name is required");
    if(formData.password.length < 6) return toast.error("Password must be at least 6 characters");

    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = validateForm()
    if(success === true) {
      try {
        await signUp(formData);
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
          <p className="register-subtitle">Start your journey with a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
              <input
                type="text"
                name="fullName"
                className="form-input"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <p className="error-message">Error message here</p>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <p className="error-message">Error message here</p>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            <p className="error-message">Error message here</p>
          </div>

          <button type="submit" className="submit-button" disabled={isSigningUp}>
            {isSigningUp ? (
              <>
                <Loader2 className="loader2_sign_up" />
                Loading...
              </>
            ) : ("Create Account")}
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