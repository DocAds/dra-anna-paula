"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { WhatsAppFloat } from "./WhatsAppFloat";
import { LeadQualifyModal } from "./LeadQualifyModal";
import { WhatsAppInterceptor } from "./WhatsAppInterceptor";

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  const isPrivate = path.startsWith("/admin") || path === "/login";

  if (isPrivate) {
    return <>{children}</>;
  }

  return (
    <>
      <WhatsAppInterceptor />
      <Nav />
      <main className="overflow-hidden">{children}</main>
      <Footer />
      <WhatsAppFloat />
      <LeadQualifyModal />
    </>
  );
}
