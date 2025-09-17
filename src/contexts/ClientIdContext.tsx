
import { createContext, useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface ClientIdContextType {
  clientId: string;
  clientName: string;
}

const ClientIdContext = createContext<ClientIdContextType | undefined>(undefined);

export const useClientId = () => {
  const context = useContext(ClientIdContext);
  if (!context) {
    throw new Error("useClientId must be used within a ClientIdProvider");
  }
  return context;
};

export const ClientIdProvider = ({ children }: { children: React.ReactNode }) => {
  const { clientId: rawClientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string>("1");
  const [clientName, setClientName] = useState<string>("Client 1");

  useEffect(() => {
    if (rawClientId) {
      const validClientIds = ["1", "2", "3"];
      
      if (validClientIds.includes(rawClientId)) {
        setClientId(rawClientId);
        setClientName(`Client ${rawClientId}`);
      } else {
        toast({
          title: "Invalid Client ID",
          description: "Redirecting to Client 1",
          variant: "destructive",
        });
        navigate("/client/1/dashboard", { replace: true });
      }
    }
  }, [rawClientId, navigate, toast]);

  const value = {
    clientId,
    clientName,
  };

  return <ClientIdContext.Provider value={value}>{children}</ClientIdContext.Provider>;
};
