import { useState, type FormEvent } from "react";
import Button from "../../components/Button";
import Seo from "../../components/Seo";
import TextField from "../../components/TextField";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminLogin() {
  const { status, email: sessionEmail, signIn, signOut } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    const message = await signIn(email, password);
    setSending(false);
    if (message) setError(message);
    else setPassword("");
  };

  // Sesión válida de Supabase, pero el usuario no está en la tabla admins.
  if (status === "not-admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-5">
        <Seo title="Panel" noindex />
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-orange">
            Sin permisos
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            Esta cuenta no es{" "}
            <em className="font-serif font-normal italic text-petroleo">
              administradora
            </em>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink/70">
            Entraste con <strong>{sessionEmail}</strong>, pero ese usuario no
            está en la tabla <code className="font-mono text-xs">admins</code>.
            Corré el insert del final de la migración{" "}
            <code className="font-mono text-xs">20260818120000_panel_admin.sql</code>{" "}
            y volvé a entrar.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => void signOut()}
          >
            Salir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5 py-16">
      <Seo title="Panel" noindex />

      <div className="w-full max-w-sm">
        <img
          src="/logo-extendido.svg"
          alt="DZ Estudio"
          className="mx-auto h-7 w-auto"
        />

        <div className="mt-8 rounded-2xl bg-white p-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Panel de{" "}
            <em className="font-serif font-normal italic text-pink">gestión</em>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            Ventas, productos y números de la tienda. Solo para vos.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <TextField
              id="admin-email"
              label="Email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <TextField
              id="admin-password"
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-orange/10 px-4 py-3 text-xs font-semibold text-orange"
              >
                ✕ {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={sending}
              className="w-full disabled:opacity-50"
            >
              {sending ? "Entrando…" : "Entrar ✦"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-ink/65">
          El acceso se gestiona desde Supabase
        </p>
      </div>
    </div>
  );
}
