import { useState } from "react";
import Button from "../Button";
import TextField from "../TextField";
import { errorMessage, formatDateTime } from "../../lib/admin";
import type { StockLine } from "../../lib/admin-stats";
import { cn } from "../../lib/cn";
import { useRegistrarMovimiento } from "../../hooks/useStockMovimientos";
import type { StockMotivo, StockMovimiento } from "../../types/admin";
import AdminDrawer from "./AdminDrawer";
import QueryError from "./QueryError";

/** Con qué formulario se abre el drawer. El historial se ve siempre. */
export type StockModo = "produccion" | "ajuste";

export const MOTIVO_LABEL: Record<StockMotivo, string> = {
  produccion: "Producción",
  ajuste: "Ajuste",
  venta: "Venta",
  devolucion: "Devolución",
};

const MOTIVO_CLASSES: Record<StockMotivo, string> = {
  produccion: "bg-verde text-ink",
  ajuste: "bg-amarillo text-ink",
  venta: "bg-celeste text-ink",
  devolucion: "bg-lila text-ink",
};

function MotivoBadge({ motivo }: { motivo: StockMotivo }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1",
        "font-mono text-[10px] font-medium uppercase tracking-widest",
        MOTIVO_CLASSES[motivo],
      )}
    >
      {MOTIVO_LABEL[motivo]}
    </span>
  );
}

/** "+3" en verde, "−2" en naranja: el signo dice para dónde fue. */
export function DeltaText({
  delta,
  className,
}: {
  delta: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        delta > 0 ? "text-verde" : delta < 0 ? "text-orange" : "text-ink/65",
        className,
      )}
    >
      {delta > 0 ? "+" : delta < 0 ? "−" : ""}
      {Math.abs(delta)}
    </span>
  );
}

type FormProps = {
  line: StockLine;
  modo: StockModo;
  onModoChange: (modo: StockModo) => void;
};

/** Producción: cuántas se cosieron. Ajuste: cuántas hay de verdad, y el
 *  delta lo calcula la pantalla. Las dos terminan en el mismo lugar —la
 *  función de Postgres— con distinto motivo. */
function MovimientoForm({ line, modo, onModoChange }: FormProps) {
  const registrar = useRegistrarMovimiento();
  const stock = line.stock ?? 0;
  const [unidades, setUnidades] = useState("");
  const [contado, setContado] = useState(String(stock));
  const [nota, setNota] = useState("");
  const [ultimo, setUltimo] = useState<string | null>(null);

  const unidadesNum = Math.floor(Number(unidades));
  const contadoNum = Math.floor(Number(contado));
  const delta =
    modo === "produccion"
      ? Number.isFinite(unidadesNum) && unidadesNum > 0
        ? unidadesNum
        : 0
      : Number.isFinite(contadoNum) && contadoNum >= 0
        ? contadoNum - stock
        : 0;

  const submit = () => {
    if (delta === 0 || registrar.isPending) return;
    setUltimo(null);
    registrar.mutate(
      {
        slug: line.productSlug,
        variantId: line.variantId,
        delta,
        motivo: modo,
        nota,
      },
      {
        onSuccess: (saldo) => {
          setUnidades("");
          setContado(String(saldo));
          setNota("");
          setUltimo(
            modo === "produccion"
              ? `Quedan ${saldo} en stock.`
              : `Stock ajustado a ${saldo}.`,
          );
        },
      },
    );
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="rounded-xl bg-white p-4"
    >
      <div
        role="tablist"
        aria-label="Tipo de movimiento"
        className="mb-4 flex gap-2"
      >
        {(["produccion", "ajuste"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={modo === tab}
            onClick={() => {
              onModoChange(tab);
              setUltimo(null);
              registrar.reset();
            }}
            className={cn(
              "rounded-full px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-widest transition-colors",
              modo === tab
                ? "bg-ink text-cream"
                : "border border-ink/20 text-ink/65 hover:border-ink hover:text-ink",
            )}
          >
            {tab === "produccion" ? "+ Producción" : "Ajustar a…"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {modo === "produccion" ? (
          <TextField
            id="mov-unidades"
            label="Unidades cosidas"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder="0"
            value={unidades}
            onChange={(event) => setUnidades(event.target.value)}
            autoFocus
          />
        ) : (
          <div>
            <TextField
              id="mov-contado"
              label="Unidades contadas"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={contado}
              onChange={(event) => setContado(event.target.value)}
              onFocus={(event) => event.target.select()}
              autoFocus
            />
            <p className="mt-1.5 font-mono text-[11px] text-ink/65">
              Hay {stock} cargadas
              {delta !== 0 && (
                <>
                  {" "}
                  · se anota <DeltaText delta={delta} />
                </>
              )}
            </p>
          </div>
        )}

        <TextField
          id="mov-nota"
          label="Nota (opcional)"
          placeholder={
            modo === "produccion" ? "Tanda del martes" : "Inventario de fin de mes"
          }
          maxLength={200}
          value={nota}
          onChange={(event) => setNota(event.target.value)}
        />
      </div>

      {registrar.error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-orange">
          ✕ {errorMessage(registrar.error, "No se pudo registrar el movimiento.")}
        </p>
      )}
      {ultimo && !registrar.error && (
        <p role="status" className="mt-3 text-xs font-semibold text-verde">
          ✓ {ultimo}
        </p>
      )}

      <Button
        type="submit"
        disabled={delta === 0 || registrar.isPending}
        className="mt-4 w-full disabled:opacity-50"
      >
        {registrar.isPending
          ? "Registrando…"
          : modo === "produccion"
            ? "Registrar producción"
            : "Ajustar stock"}
      </Button>
    </form>
  );
}

type StockDrawerProps = {
  /** La línea abierta; null cierra el drawer. */
  line: StockLine | null;
  modo: StockModo;
  onModoChange: (modo: StockModo) => void;
  onClose: () => void;
  /** El libro entero: acá se filtra por la línea. */
  movimientos: StockMovimiento[];
  isLoading?: boolean;
  error?: unknown;
};

export default function StockDrawer({
  line,
  modo,
  onModoChange,
  onClose,
  movimientos,
  isLoading,
  error,
}: StockDrawerProps) {
  const historial = line
    ? movimientos.filter(
        (mov) =>
          (mov.productId === line.productId || mov.slug === line.productSlug) &&
          (mov.variantId ?? null) === line.variantId,
      )
    : [];

  return (
    <AdminDrawer
      open={line !== null}
      onClose={onClose}
      title={line ? (line.variantLabel ?? line.productName) : ""}
      subtitle={
        line
          ? `${line.variantLabel ? `${line.productName} · ` : ""}${line.stock ?? 0} en stock`
          : undefined
      }
    >
      {line && (
        <div className="space-y-7">
          <section>
            <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
              Registrar
            </h3>
            {/* La key reinicia el formulario al cambiar de línea */}
            <MovimientoForm
              key={line.key}
              line={line}
              modo={modo}
              onModoChange={onModoChange}
            />
          </section>

          <section>
            <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
              Historial
            </h3>
            {error ? (
              <QueryError
                error={error}
                what="el historial"
                migration="supabase/migrations/20260911220000_registro_de_produccion.sql"
              />
            ) : isLoading ? (
              <p className="animate-pulse rounded-xl bg-white px-4 py-8 text-center font-mono text-xs uppercase tracking-widest text-ink/65">
                ✦ Cargando…
              </p>
            ) : historial.length === 0 ? (
              <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-ink/65">
                Todavía no hay movimientos en esta línea.
              </p>
            ) : (
              <ul className="divide-y divide-ink/[0.08] rounded-xl bg-white px-4">
                {historial.map((mov) => (
                  <li key={mov.id} className="py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/65">
                        {formatDateTime(mov.createdAt)}
                      </span>
                      <span className="whitespace-nowrap font-mono text-xs text-ink/65">
                        <DeltaText delta={mov.delta} className="text-sm" />{" "}
                        → {mov.saldo}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <MotivoBadge motivo={mov.motivo} />
                      {mov.nota && (
                        <span className="text-xs leading-snug text-ink/80">
                          {mov.nota}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-ink/65">
                      {mov.autor ?? (mov.orderId ? "despacho" : "sistema")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AdminDrawer>
  );
}
