import type { ReactNode } from "react";

export function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto rounded-2xl border bg-card p-5 sm:p-8 flex flex-col grow h-full">
      <div className="flex flex-col max-w-7xl mx-auto w-full">
        <header className="mb-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm">{description}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}
