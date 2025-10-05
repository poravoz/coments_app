import { Routes, Route, Navigate } from "react-router-dom";
import { SignUpPage } from "./pages/SignUpPage/SignUpPage";
import { SignInPage } from "./pages/SignInPage/SignInPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import {Toaster} from "react-hot-toast"
import "./App.css";
import { NavBar } from "./components/NavBar/NavBar";
import { Comments } from "./components/Comments";

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect (() => {
    checkAuth()
  }, [checkAuth]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="loader-container">
      <Loader className="loader" />
    </div>
    )

  }


  return (
    <div>
      <NavBar />

      <Routes>
        <Route path="/" element={authUser ? <Comments currentUserId = "1" /> : <Navigate to="/login" />} />
        <Route path="/register" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <SignInPage /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to={authUser ? "/" : "/login"} />} />
      </Routes>
    <Toaster />
    </div>
  );
}

export default App;
