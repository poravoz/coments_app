import { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import "./SignUpPage.css";

export const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Join us today</h1>
          <p className="register-subtitle">Start your journey with a new account</p>
        </div>

        <form className="register-form">
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

          <button type="submit" className="submit-button">
            Create Account
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