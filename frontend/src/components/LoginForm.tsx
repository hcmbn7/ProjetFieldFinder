import { FormEvent, useState } from "react";
import { loginUser } from "../api/users";
import type { User } from "../types";

interface LoginFormProps {
  onSuccess: (user: User) => void;
  onSwitchToSignup: () => void;
}

const LoginForm = ({ onSuccess, onSwitchToSignup }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Veuillez saisir votre adresse courriel.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password.length > 72) {
      setError("Le mot de passe ne peut pas dépasser 72 caractères.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await loginUser({
        email: email.trim(),
        password,
      });
      onSuccess(user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Échec de la connexion"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/90 backdrop-blur-md border border-emerald-100 shadow-xl rounded-3xl p-10 w-full max-w-lg space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-emerald-700">Connexion</h2>
        <p className="text-sm text-emerald-600/80 mt-1">
          Accédez à FieldFinder avec votre adresse courriel et votre mot de
          passe.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="login-email"
          className="text-sm font-semibold text-emerald-700"
        >
          Adresse courriel
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-emerald-200/70 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="vous@exemple.com"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="login-password"
          className="text-sm font-semibold text-emerald-700"
        >
          Mot de passe
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          maxLength={72}
          className="w-full rounded-2xl border border-emerald-200/70 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Votre mot de passe"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-white font-semibold shadow-lg transition-all duration-200 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60"
      >
        {loading ? "Connexion en cours..." : "Se connecter"}
      </button>

      <p className="text-sm text-center text-emerald-600/80">
        Nouveau sur FieldFinder ?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Créer un compte
        </button>
      </p>
    </form>
  );
};

export default LoginForm;
