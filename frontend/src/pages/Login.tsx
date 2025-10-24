import { useState } from "react"
import { Lock, Mail } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("Veuillez saisir votre courriel et votre mot de passe.")
      return
    }

    try {
      setLoading(true)
      await new Promise(res => setTimeout(res, 600))
      window.location.href = "/"
    } catch (e) {
      setError("Identifiants invalides.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-teal-50">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-lg shadow-2xl rounded-3xl border border-emerald-100 p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Connexion
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-emerald-700 mb-1">Courriel</label>
            <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 focus-within:ring-2 focus-within:ring-emerald-400 transition">
              <Mail className="w-5 h-5 text-emerald-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="flex-1 bg-transparent outline-none text-emerald-900 placeholder:text-emerald-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-700 mb-1">Mot de passe</label>
            <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 focus-within:ring-2 focus-within:ring-emerald-400 transition">
              <Lock className="w-5 h-5 text-emerald-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent outline-none text-emerald-900 placeholder:text-emerald-400"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm mt-1">
            <label className="flex items-center gap-2 text-emerald-700">
              <input type="checkbox" className="rounded border-emerald-300 text-emerald-600" /> 
              Se souvenir de moi
            </label>
            <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium transition">
              Mot de passe oublié ?
            </a>
          </div>

          <button
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-semibold shadow-md hover:from-emerald-700 hover:to-green-600 transition-all"
            disabled={loading}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-sm text-emerald-700 mt-6">
          Pas de compte ?{" "}
          <a href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Inscrivez-vous
          </a>
        </p>
      </div>
    </div>
  )
}
