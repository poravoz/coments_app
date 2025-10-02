import { Routes, Route, Navigate } from "react-router-dom";
import { SignUpPage } from "./pages/SignUpPage/SignUpPage";
import { SignInPage } from "./pages/SignInPage/SignInPage";
import { HomePage } from "./pages/HomePage";

function App() {
  return (
    <Routes>
      <Route path="/" element = {<HomePage />} /> 
      <Route path="/register" element = {<SignUpPage />} />
      <Route path="/login" element = {<SignInPage />} />
    </Routes>
  );
}

export default App;
