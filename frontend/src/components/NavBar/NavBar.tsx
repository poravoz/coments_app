import { LogOut, MessageCircle, X } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import "./NavBar.css";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { AvatarLightboxNavBar } from "../Lightbox/AvatarLightboxNavBar";

export const NavBar = () => {
  const { logout, authUser, updateAvatar, removeAvatar } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!authUser) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAvatarClick = () => {
    if (authUser.avatarUrl) {
      setIsLightboxOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleUpdateClick = () => {
    setIsLightboxOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (authUser.avatarUrl) {
      try {
        const currentResponse = await fetch(authUser.avatarUrl);
        const currentBlob = await currentResponse.blob();
        const currentHash = await hashFile(currentBlob);
        const newHash = await hashFile(file);
        if (currentHash === newHash) {
          toast.error("The selected image is the same as the current avatar.");
          return;
        }
      } catch (error) {
        console.error("Hash comparison error:", error);
      }
    }

    try {
      await updateAvatar(file);
    } catch (error) {
      console.error("Avatar upload error:", error);
    }
  };

  const handleConfirmDelete = () => setConfirmOpen(true);
  const confirmDelete = async () => {
    setConfirmOpen(false);
    try {
      await removeAvatar();
    } catch (error) {
      console.error("Avatar removal error:", error);
    }
  };

  return (
    <nav className="navbar_container">
      <div className="navbar_content">
        <div className="navbar_logo">
          <MessageCircle className="logo-icon" />
          <span className="navbar_logo_text">CommentBox</span>
        </div>
        <div className="navbar_actions">
          <div className="navbar_greeting">
            <span className="navbar_greeting_text">Hello, {authUser.name}!</span>
            <div className="avatar-wrapper">
              <img
                src={authUser.avatarUrl || "./user-icon.png"}
                alt="User Avatar"
                className="navbar_avatar"
                onClick={handleAvatarClick}
              />
              {authUser.avatarUrl && (
                <button
                  className="remove-avatar-button"
                  onClick={handleConfirmDelete}
                  title="Remove Avatar"
                >
                  <X className="remove-avatar-icon" />
                </button>
              )}
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/jpeg,image/png,image/gif"
            onChange={handleFileChange}
          />
          <button className="logout-button" onClick={handleLogout}>
            <LogOut className="logout-icon" />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>

      {authUser.avatarUrl && (
        <AvatarLightboxNavBar
          open={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          avatarUrl={authUser.avatarUrl}
          onUpdateClick={handleUpdateClick}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Avatar Deletion"
        message="Are you sure you want to delete your avatar?"
      />
    </nav>
  );
};

// Helper function for hashing files/blobs
async function hashFile(fileOrBlob: File | Blob): Promise<string> {
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}