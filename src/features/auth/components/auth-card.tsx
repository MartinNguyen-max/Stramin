import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

/** Centered card layout shared by the login, sign-up and password pages. */
export function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-start justify-center px-4 pt-10 pb-20 sm:pt-16">
        <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border bg-card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {children}
          {footer && (
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
