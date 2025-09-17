
import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
  type: "server" | "client";
  baseUrl: string;
}

export function AppLayout({ children, type, baseUrl }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader type={type} />
      <div className="flex flex-1">
        <AppSidebar type={type} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
