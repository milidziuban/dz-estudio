import { useContext } from "react";
import {
  AdminAuthContext,
  type AdminAuthValue,
} from "../components/admin/AdminAuthProvider";

export function useAdminAuth(): AdminAuthValue {
  const value = useContext(AdminAuthContext);
  if (!value) {
    throw new Error("useAdminAuth necesita estar dentro de <AdminAuthProvider>");
  }
  return value;
}
