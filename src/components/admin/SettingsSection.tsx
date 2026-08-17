import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /** Fila de acciones al pie (guardar, agregar) */
  footer?: ReactNode;
};

/** Bloque de configuración: título, ayuda y contenido sobre una card blanca. */
export default function SettingsSection({
  title,
  description,
  children,
  footer,
}: SettingsSectionProps) {
  return (
    <section className="rounded-2xl bg-white p-6 sm:p-7">
      <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-ink/55">
          {description}
        </p>
      )}
      <div className="mt-6">{children}</div>
      {footer && (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-5">
          {footer}
        </div>
      )}
    </section>
  );
}
