import { AppHeader } from "@/components/app-header";

/**
 * Layout for the logged-in app. Access is checked in `src/proxy.ts` and again in each page
 * (getCurrentUser), so the layout itself doesn't read the session and stays static (Cache Components).
 */
export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-6 pb-20 sm:px-6">
        {children}
      </main>
    </>
  );
}
