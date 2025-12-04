import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import type { User } from "../types";

export default function Login() {
  const navigate = useNavigate();

  const handleSuccess = useCallback(
    (user: User) => {
      localStorage.setItem("fieldfinderUser", JSON.stringify(user));
      navigate("/");
    },
    [navigate]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-teal-50 px-4">
      <LoginForm
        onSuccess={handleSuccess}
        onSwitchToSignup={() => navigate("/signup")}
      />
    </div>
  );
}
