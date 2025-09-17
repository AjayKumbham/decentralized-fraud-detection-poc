
import { useClientId } from "@/contexts/ClientIdContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ServerIcon, ShieldCheckIcon } from "lucide-react";

interface AppHeaderProps {
  type: "server" | "client";
}

export function AppHeader({ type }: AppHeaderProps) {
  const clientId = type === "client" ? useClientId() : null;
  
  return (
    <header className={cn(
      "w-full h-16 px-6 border-b flex items-center justify-between",
      type === "server" ? "bg-navy text-white" : "bg-white"
    )}>
      <div className="flex items-center gap-x-3">
        {type === "server" ? (
          <ServerIcon className="h-6 w-6 text-blue" />
        ) : (
          <ShieldCheckIcon className="h-6 w-6 text-blue" />
        )}
        <Link to={type === "server" ? "/server/dashboard" : `/client/${clientId?.clientId}/dashboard`} className="text-lg font-bold">
          {type === "server" ? "Fraud Detection Server" : clientId?.clientName}
        </Link>
      </div>
      <div className="flex items-center gap-x-4">
        <Link to="/" className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-100 transition-colors">
          Switch App
        </Link>
      </div>
    </header>
  );
}
