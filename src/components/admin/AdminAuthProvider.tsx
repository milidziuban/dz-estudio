import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../../lib/supabase";

export type AdminAuthStatus =
  /** Todavía no sabemos si hay sesión */
  | "loading"
  /** No hay sesión de Supabase */
  | "signed-out"
  /** Hay sesión, pero el usuario no está en la tabla admins */
  | "not-admin"
  | "admin";

export type AdminAuthValue = {
  status: AdminAuthStatus;
  email: string | null;
  nombre: string | null;
  /** Devuelve un mensaje de error, o null si entró bien */
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

export const AdminAuthContext = createContext<AdminAuthValue | null>(null);

/** Traduce los errores de Supabase Auth, que vienen en inglés. */
function mensajeDeError(message: string): string {
  if (/invalid login credentials/i.test(message))
    return "Email o contraseña incorrectos";
  if (/email not confirmed/i.test(message))
    return "El usuario todavía no está confirmado en Supabase";
  if (/too many requests|rate limit/i.test(message))
    return "Demasiados intentos. Esperá un minuto y probá de nuevo";
  // Con el proyecto de Supabase pausado o recién despausado, la request ni
  // llega: conviene decirlo con nombre y apellido en vez de "Failed to fetch".
  if (/failed to fetch|load failed|networkerror/i.test(message))
    return "No se pudo conectar con Supabase. Si el proyecto estuvo pausado, esperá un minuto y reintentá";
  return message;
}

/**
 * Sesión del panel. El chequeo de admin se hace contra la tabla `admins`:
 * tener sesión no alcanza. De todas formas la puerta real son las policies de
 * Postgres — esto es para que la UI sepa qué mostrar, no la seguridad.
 */
export default function AdminAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] = useState<AdminAuthStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const resolver = async (userId: string | undefined, mail?: string) => {
      if (!userId) {
        if (!mounted.current) return;
        setStatus("signed-out");
        setEmail(null);
        setNombre(null);
        return;
      }

      const { data, error } = await supabase
        .from("admins")
        .select("email, nombre")
        .eq("user_id", userId)
        .maybeSingle();

      if (!mounted.current) return;

      if (error || !data) {
        setStatus("not-admin");
        setEmail(mail ?? null);
        setNombre(null);
        return;
      }

      setStatus("admin");
      setEmail(data.email);
      setNombre(data.nombre);
    };

    void supabase.auth.getSession().then(({ data }) => {
      void resolver(data.session?.user.id, data.session?.user.email);
    });

    // El callback de onAuthStateChange corre dentro del lock interno del cliente:
    // si hacemos un await de otra llamada a Supabase acá adentro, se traba. Por
    // eso el chequeo sale del callback con un setTimeout.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id;
      const mail = session?.user.email;
      setTimeout(() => void resolver(id, mail), 0);
    });

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (mail: string, password: string) => {
    // Ojo: acá no se toca `status`. Pasarlo a "loading" desmonta el formulario
    // (el guard muestra el loader en su lugar) y con él se va el mensaje de
    // error, así que el intento fallido parecía no hacer nada. El "Entrando…"
    // lo maneja el propio formulario con su estado local.
    const { error } = await supabase.auth.signInWithPassword({
      email: mail.trim(),
      password,
    });
    if (error) return mensajeDeError(error.message);
    // Si entró bien, onAuthStateChange pasa a "admin" o a "not-admin"
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    if (!mounted.current) return;
    setStatus("signed-out");
    setEmail(null);
    setNombre(null);
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({ status, email, nombre, signIn, signOut }),
    [status, email, nombre, signIn, signOut],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
