import type { ReactNode } from "react";

type PageHeadingProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Acciones alineadas a la derecha (botones, filtros) */
  children?: ReactNode;
};

export default function PageHeading({
  title,
  description,
  children,
}: PageHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/65">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}
