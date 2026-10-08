import type { ReactNode } from "react";

export function FormCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 sm:p-8">
      <header className="mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm">{description}</p>}
      </header>
      {children}
    </section>
  );
}
