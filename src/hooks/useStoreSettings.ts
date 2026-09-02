import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GA_ID } from "../lib/analytics";
import {
  BANK_INFO,
  ORIGEN_CP_DEFAULT,
  PAQUETE_DEFAULT_CM,
  SHIPPING_OPTIONS,
} from "../lib/checkout";
import {
  DEFAULT_PROMOS,
  INSTALLMENTS,
  TRANSFER_PROMO,
  comboLabel,
  transferLabel,
} from "../lib/promos";
import { SITE } from "../lib/site";
import { supabase } from "../lib/supabase";
import type { SettingsKey, StoreSettings } from "../types/admin";

/**
 * Valores por defecto: los mismos que están hardcodeados en el front.
 * Se usan mientras la query carga y para cualquier clave que todavía no exista
 * en la tabla, así el panel nunca muestra campos vacíos.
 */
export const SETTINGS_DEFAULTS: StoreSettings = {
  pagos: {
    mercadopago: {
      enabled: true,
      installments: INSTALLMENTS.sinInteres,
      installmentsLabel: INSTALLMENTS.label,
      maxInstallments: INSTALLMENTS.max,
    },
    transferencia: {
      enabled: true,
      discountPercent: Math.round(TRANSFER_PROMO.percent * 100),
      banco: BANK_INFO.banco,
      titular: BANK_INFO.titular,
      cuit: BANK_INFO.cuit,
      cbu: BANK_INFO.cbu,
      alias: BANK_INFO.alias,
    },
  },
  envios: {
    options: SHIPPING_OPTIONS.map((option) => ({
      id: option.id,
      label: option.label,
      detail: option.detail,
      mode: option.mode,
      cost: option.cost,
      enabled: true,
      ...("provider" in option ? { provider: option.provider } : {}),
      ...("service" in option ? { service: option.service } : {}),
    })),
    freeShippingFrom: null,
    origenCp: ORIGEN_CP_DEFAULT,
    paquete: PAQUETE_DEFAULT_CM,
  },
  distribucion: {
    locations: [
      {
        id: "santa-fe",
        nombre: SITE.retiro.nombre,
        direccion: SITE.retiro.direccion,
        horario: SITE.retiro.horario,
        retiro: true,
        principal: true,
      },
    ],
    lowStockThreshold: 3,
  },
  marketing: {
    gaId: GA_ID ?? null,
    instagram: SITE.instagram,
    whatsapp: SITE.whatsapp,
    // Las dos líneas de promo se arman con las mismas funciones que usa el
    // carrito, no escritas a mano: si cambia sobre qué categorías corre el
    // combo, la marquesina no puede quedar prometiendo otra cosa.
    marquee: [
      INSTALLMENTS.label,
      transferLabel(DEFAULT_PROMOS),
      comboLabel(DEFAULT_PROMOS),
      "Envíos a todo el país",
      "Retiro gratis en Santa Fe Capital",
    ],
    promos: DEFAULT_PROMOS,
  },
  precios: {
    marginPercent: 100,
  },
};

type SettingRow = { key: string; value: Record<string, unknown> };

type Dict = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Dict =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Mezcla la fila guardada sobre los valores por defecto, salteando null y
 * undefined: si mañana agregamos un campo al tipo, o si alguien editó el jsonb
 * a mano y dejó una clave vacía, gana el default en vez de quedar en undefined.
 *
 * Recursivo sobre objetos (así `pagos.mercadopago.maxInstallments` sobrevive
 * aunque la fila sea vieja) pero NO sobre arrays: la lista de envíos o la
 * marquesina que guardó el panel reemplaza entera a la de fábrica, nunca se
 * fusiona índice por índice.
 */
function mergeSettings(defaults: Dict, stored: Dict): Dict {
  const out: Dict = { ...defaults };
  for (const [key, value] of Object.entries(stored)) {
    if (value === null || value === undefined) continue;
    const fallback = out[key];
    out[key] =
      isPlainObject(value) && isPlainObject(fallback)
        ? mergeSettings(fallback, value)
        : value;
  }
  return out;
}

/**
 * Configuración de la tienda. La lectura es pública (la usa el checkout para
 * los costos de envío y los datos bancarios); escribir requiere ser admin.
 */
export function useStoreSettings() {
  return useQuery({
    queryKey: ["store-settings"],
    queryFn: async (): Promise<StoreSettings> => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("key, value");
      if (error) throw error;

      const merged: StoreSettings = {
        pagos: { ...SETTINGS_DEFAULTS.pagos },
        envios: { ...SETTINGS_DEFAULTS.envios },
        distribucion: { ...SETTINGS_DEFAULTS.distribucion },
        marketing: { ...SETTINGS_DEFAULTS.marketing },
        precios: { ...SETTINGS_DEFAULTS.precios },
      };

      // Vista laxa del objeto para poder escribir por clave dinámica: cada
      // sección tiene su propia forma y TS no puede probar que coinciden.
      const target = merged as unknown as Record<
        string,
        Record<string, unknown>
      >;

      for (const row of (data ?? []) as SettingRow[]) {
        if (!(row.key in merged)) continue;
        target[row.key] = mergeSettings(target[row.key], row.value ?? {});
      }

      return merged;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useSaveSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: SettingsKey;
      value: StoreSettings[SettingsKey];
    }) => {
      const { error } = await supabase
        .from("store_settings")
        .upsert({ key, value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-settings"] });
    },
  });
}

/**
 * Borrador editable de una sección de la configuración.
 *
 * Mientras no se toca nada devuelve lo que hay en la base; al primer cambio
 * empieza a devolver el borrador local y `dirty` pasa a true. Guardar lo sube y
 * vuelve a seguir a la base, así los cambios de otra pestaña no se pierden.
 */
export function useSettingsDraft<K extends SettingsKey>(key: K) {
  const query = useStoreSettings();
  const saveSetting = useSaveSetting();
  const [draft, setDraft] = useState<StoreSettings[K] | null>(null);
  const [saved, setSaved] = useState(false);

  const value: StoreSettings[K] =
    draft ?? query.data?.[key] ?? SETTINGS_DEFAULTS[key];

  return {
    value,
    dirty: draft !== null,
    saved,
    isLoading: query.isLoading,
    saving: saveSetting.isPending,
    error: saveSetting.error ?? query.error,
    update(next: StoreSettings[K]) {
      setDraft(next);
      setSaved(false);
    },
    reset() {
      setDraft(null);
      setSaved(false);
    },
    async save() {
      await saveSetting.mutateAsync({
        key,
        value: value as StoreSettings[SettingsKey],
      });
      setDraft(null);
      setSaved(true);
    },
  };
}
