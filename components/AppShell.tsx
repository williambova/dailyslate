"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

/**
 * Responsive frame.
 *  • Mobile (< lg): a centered phone column with a top Header and a BottomNav —
 *    the native-feeling mobile experience.
 *  • Desktop (≥ lg): a left Sidebar + a wider content column. Header/BottomNav
 *    hide themselves at lg, so desktop never looks like a blown-up phone.
 * The marketing landing ("/") renders full-bleed with no chrome.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname === "/login";

  if (isLanding) {
    return <div className="app-bg min-h-screen w-full">{children}</div>;
  }

  return (
    <div className="app-bg min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] lg:gap-0">
        <Sidebar />
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-line bg-transparent lg:mx-0 lg:max-w-none lg:border-x-0 lg:border-l">
          <Header />
          <main className="flex-1 lg:px-8 lg:py-4">{children}</main>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
