import { Routes, Route, Navigate } from "react-router-dom";
import { SignUpPage } from "./pages/SignUpPage/SignUpPage";
import { SignInPage } from "./pages/SignInPage/SignInPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import {Toaster} from "react-hot-toast"
import "./App.css";
import { NavBar } from "./components/NavBar/NavBar";
import { HomePage } from "./pages/HomePage/HomePage";
import { useCommentsStore } from "./store/useCommentsStore";


function App() {
  const { authUser, subscribeToAvatarUpdates, checkAuth, isCheckingAuth } = useAuthStore();
  const { subscribeToComments } = useCommentsStore();

  useEffect(() => {
    checkAuth();
    
    const unsubscribeAvatar = subscribeToAvatarUpdates();
    const unsubscribeComments = subscribeToComments();
    

    return () => {
      unsubscribeAvatar();
      unsubscribeComments();
    };
  }, [checkAuth, subscribeToAvatarUpdates, subscribeToComments]);

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
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/register" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <SignInPage /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to={authUser ? "/" : "/login"} />} />
      </Routes>
    <Toaster />
    </div>
  );
}

export default App;


