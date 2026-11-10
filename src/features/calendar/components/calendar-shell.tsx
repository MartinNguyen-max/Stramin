"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  use,
  useTransition,
} from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { getPathname, useRouter } from "@/i18n/navigation";
import type { CalendarRequest } from "@/lib/analytics/calendar";
import { savePreference } from "../preference";

type Navigate = (query: Record<string, string>, save?: CalendarRequest) => void;

const NavigateContext = createContext<{ navigate: Navigate; base: string }>({
  navigate: () => {},
  base: "/home",
});

/** Pages that show the calendar. */
export type CalendarBase = "/home" | "/demo";

/**
 * Client wrapper around the server-rendered calendar. Moving between periods runs in a transition,
 * so the old calendar stays visible (dimmed, with the zone spinner) until the new one is ready.
 */
export function CalendarShell({
  base,
  toolbar,
  children,
}: {
  base: CalendarBase;
  toolbar: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("Calendar");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const navigate: Navigate = (query, save) => {
    if (save) savePreference(save);
    startTransition(() => {
      router.push({ pathname: base, query }, { scroll: false });
    });
  };

  return (
    <NavigateContext value={{ navigate, base }}>
      <section
        aria-label={t("title")}
        aria-busy={pending}
        className="relative flex flex-col gap-3"
      >
        {toolbar}
        <div
          className={
            pending ? "pointer-events-none opacity-40 transition-opacity" : ""
          }
        >
          {children}
        </div>
        {pending && (
          <div className="absolute inset-x-0 top-24 flex justify-center">
            <ZoneSpinner
              size={64}
              label={t("loading")}
              className="rounded-2xl bg-background/90 p-4 shadow-lg"
            />
          </div>
        )}
      </section>
    </NavigateContext>
  );
}

/**
 * A link inside the calendar that moves to another period through the shell (with the spinner).
 * It's a real link, so it also works before JavaScript has loaded and can be opened in a new tab.
 */
export function CalendarLink({
  query,
  save,
  children,
  ...props
}: {
  query: Record<string, string>;
  save?: CalendarRequest;
} & Omit<ComponentProps<"a">, "href">) {
  const { navigate, base } = use(NavigateContext);
  const locale = useLocale();
  const href = getPathname({ href: { pathname: base, query }, locale });
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button) {
          return;
        }
        event.preventDefault();
        navigate(query, save);
      }}
    >
      {children}
    </a>
  );
}

/** The navigate function, for buttons and forms in the toolbar. */
export function useCalendarNavigate(): Navigate {
  return use(NavigateContext).navigate;
}
