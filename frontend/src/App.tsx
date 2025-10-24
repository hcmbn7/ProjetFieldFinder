import FieldFinderPage from "./pages/FieldFinderPage"
import { Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Signup from "./pages/Signup"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FieldFinderPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  )
}

