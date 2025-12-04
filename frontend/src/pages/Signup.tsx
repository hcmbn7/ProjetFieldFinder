import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SignupForm from "../components/SignupForm";
import type { User } from "../types";

export default function Signup() {
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
      <SignupForm
        onSuccess={handleSuccess}
        onSwitchToLogin={() => navigate("/login")}
      />
    </div>
  );
}
