
import { cn } from "@/lib/utils";
import { BarChartIcon, ServerIcon, SettingsIcon, ShieldCheckIcon, ZapIcon } from "lucide-react";
import { useClientId } from "@/contexts/ClientIdContext";
import { useLocation, Link } from "react-router-dom";

interface AppSidebarProps {
  type: "server" | "client";
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

export function AppSidebar({ type }: AppSidebarProps) {
  const location = useLocation();
  const clientId = type === "client" ? useClientId() : null;

  const serverNavItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/server/dashboard",
      icon: BarChartIcon,
    },
    {
      title: "Detection",
      href: "/server/detection",
      icon: ShieldCheckIcon,
    },
    {
      title: "Settings",
      href: "/server/settings",
      icon: SettingsIcon,
    },
  ];

  const clientNavItems: NavItem[] = clientId ? [
    {
      title: "Dashboard",
      href: `/client/${clientId.clientId}/dashboard`,
      icon: BarChartIcon,
    },
    {
      title: "Training",
      href: `/client/${clientId.clientId}/training`,
      icon: ZapIcon,
    },
    {
      title: "Settings",
      href: `/client/${clientId.clientId}/settings`,
      icon: SettingsIcon,
    },
  ] : [];

  const navItems = type === "server" ? serverNavItems : clientNavItems;

  return (
    <aside className="w-64 border-r h-[calc(100vh-4rem)] bg-slate-50">
      <div className="p-4">
        <div className="flex items-center gap-2.5 px-2.5 py-3 bg-blue-50 text-blue-800 rounded-md">
          {type === "server" ? (
            <ServerIcon className="w-5 h-5" />
          ) : (
            <ShieldCheckIcon className="w-5 h-5" />
          )}
          <span className="font-medium">
            {type === "server" ? "Server" : `Client ${clientId?.clientId}`}
          </span>
        </div>
      </div>
      <nav className="space-y-1 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-900"
                  : "hover:bg-blue-50 text-gray-700 hover:text-blue-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
