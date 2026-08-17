import { lazy, Suspense } from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import PageLoader from "../PageLoader";

const AdminLogin = lazy(() => import("../../pages/admin/Login"));

/**
 * Puerta del panel. Si no hay sesión de admin muestra el login en lugar de
 * redirigir: así la URL que la usuaria quería abrir sigue intacta y entra
 * directo a esa pantalla.
 *
 * ⚠️ Esto es solo la UI. Lo que realmente protege los datos son las policies
 * de RLS en Supabase (public.is_admin()): sin la fila en `admins`, las queries
 * vuelven vacías aunque alguien fuerce el render de estas pantallas.
 */
export default function RequireAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAdminAuth();

  if (status === "loading") return <PageLoader />;

  if (status !== "admin") {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminLogin />
      </Suspense>
    );
  }

  // El layout del panel también baja lazy: necesita su propio boundary.
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}
