
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

// Server Pages
import ServerDashboard from "./pages/server/Dashboard";
import ServerDetection from "./pages/server/Detection";
import ServerSettings from "./pages/server/Settings";

// Client Pages
import ClientDashboard from "./pages/client/Dashboard";
import ClientTraining from "./pages/client/Training";
import ClientSettings from "./pages/client/Settings";

// Common Pages
import NotFound from "./pages/NotFound";
import AppSelector from "./pages/AppSelector";

// Layout Components
import { AppLayout } from "./components/layout/AppLayout";
import { ClientIdProvider } from "./contexts/ClientIdContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const App = () => {
  // This would typically come from environment variables in a real app
  const [apiBaseUrl] = useState("http://localhost:4000");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* App Selector (Home) */}
            <Route path="/" element={<AppSelector />} />
            
            {/* Server Routes */}
            <Route 
              path="/server/*" 
              element={
                <AppLayout 
                  type="server" 
                  baseUrl={apiBaseUrl} 
                >
                  <Routes>
                    <Route path="dashboard" element={<ServerDashboard />} />
                    <Route path="detection" element={<ServerDetection />} />
                    <Route path="settings" element={<ServerSettings />} />
                    <Route path="*" element={<Navigate to="/server/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              }
            />
            
            {/* Client Routes with ClientId */}
            <Route 
              path="/client/:clientId/*" 
              element={
                <ClientIdProvider>
                  <AppLayout 
                    type="client"
                    baseUrl={apiBaseUrl}
                  >
                    <Routes>
                      <Route path="dashboard" element={<ClientDashboard />} />
                      <Route path="training" element={<ClientTraining />} />
                      <Route path="settings" element={<ClientSettings />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </AppLayout>
                </ClientIdProvider>
              }
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
