import { LogOut, MessageCircle } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import "./NavBar.css";

export const NavBar = () => {
  const { logout, authUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar_container">
      <div className="navbar_content">
        <div className="navbar_logo">
          <MessageCircle className="logo-icon" />
          <span>CommentBox</span>
        </div>
        <div className="navbar_actions">
          {authUser && (
            <>
              <span className="navbar_greeting">Hello, {authUser.name}!</span>
              <button className="logout-button" onClick={handleLogout}>
                <LogOut className="logout-icon" />
                <span className="logout-text">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
