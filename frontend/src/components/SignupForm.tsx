import { FormEvent, useState } from "react";
import { signupUser } from "../api/users";
import type { User } from "../types";

interface SignupFormProps {
  onSuccess: (user: User) => void;
  onSwitchToLogin: () => void;
}

const SignupForm = ({ onSuccess, onSwitchToLogin }: SignupFormProps) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName.trim()) {
      setError("Veuillez indiquer votre nom complet.");
      return;
    }

    if (!email.trim()) {
      setError("Veuillez indiquer une adresse courriel.");
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

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await signupUser({
        email: email.trim(),
        full_name: fullName.trim(),
        password,
      });
      onSuccess(user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Échec de l'inscription"
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
        <h2 className="text-3xl font-bold text-emerald-700">Créer un compte</h2>
        <p className="text-sm text-emerald-600/80 mt-1">
          Rejoignez FieldFinder pour sauvegarder vos terrains favoris.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="signup-full-name"
          className="text-sm font-semibold text-emerald-700"
        >
          Nom complet
        </label>
        <input
          id="signup-full-name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded-2xl border border-emerald-200/70 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Alex Tremblay"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="signup-email"
          className="text-sm font-semibold text-emerald-700"
        >
          Adresse courriel
        </label>
        <input
          id="signup-email"
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
          htmlFor="signup-password"
          className="text-sm font-semibold text-emerald-700"
        >
          Mot de passe
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          maxLength={72}
          className="w-full rounded-2xl border border-emerald-200/70 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Au moins 8 caractères"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="signup-confirm-password"
          className="text-sm font-semibold text-emerald-700"
        >
          Confirmez le mot de passe
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          maxLength={72}
          className="w-full rounded-2xl border border-emerald-200/70 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Répétez votre mot de passe"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-white font-semibold shadow-lg transition-all duration-200 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60"
      >
        {loading ? "Création du compte..." : "S'inscrire"}
      </button>

      <p className="text-sm text-center text-emerald-600/80">
        Déjà membre ?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Se connecter
        </button>
      </p>
    </form>
  );
};

export default SignupForm;
