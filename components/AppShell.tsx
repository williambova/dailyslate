"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

/**
 * Mobile-first frame. Constrains to a phone column, centered on larger
 * screens. The marketing landing ("/") hides the app chrome for a cleaner
 * first impression.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <div className="app-bg min-h-screen w-full">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[460px] flex-col border-x border-line bg-transparent">
        {!isLanding && <Header />}
        <main className="flex-1">{children}</main>
        {!isLanding && <BottomNav />}
      </div>
    </div>
  );
}
