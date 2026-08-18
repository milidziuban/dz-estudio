import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ShippingQuoteResponse = {
  correoArgentino: {
    configured: boolean;
    sucursal: number | null;
    domicilio: number | null;
    error?: string;
  };
};

/** Espera a que el cliente termine de tipear el código postal antes de cotizar. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Cotización en vivo del envío. Solo dispara cuando hay un código postal con
 * pinta de válido; si la transportista no está configurada o falla, vuelve
 * `configured: false` (o `error`) y quien llama cae al costo fijo del panel.
 */
export function useShippingQuote(cp: string, weightGrams: number) {
  const cpTrimmed = cp.trim();
  const debouncedCp = useDebounced(cpTrimmed, 500);
  const enabled = debouncedCp.length >= 4 && weightGrams > 0;

  return useQuery({
    queryKey: ["shipping-quote", debouncedCp, weightGrams],
    queryFn: async (): Promise<ShippingQuoteResponse> => {
      const { data, error } = await supabase.functions.invoke(
        "shipping-quote",
        { body: { destinationCp: debouncedCp, weightGrams } },
      );
      if (error) throw error;
      return data as ShippingQuoteResponse;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
