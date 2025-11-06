import { Routes, Route } from "react-router-dom"
import FieldFinderPage from "./pages/FieldFinderPage"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import AdminDashboard from "./pages/AdminDashboard"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FieldFinderPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  )
}
