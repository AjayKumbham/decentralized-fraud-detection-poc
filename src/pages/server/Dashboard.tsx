
import { useQuery } from "@tanstack/react-query";
import { serverApi, simulateApi, ClientStatus } from "@/services/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShieldCheckIcon, AlertCircleIcon, CheckCircleIcon, ServerIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

const ServerDashboard = () => {
  const { toast } = useToast();
  
  // Fetch client status data
  const { data: clientsStatus, isLoading, error, refetch } = useQuery({
    queryKey: ["clientsStatus"],
    queryFn: async () => {
      try {
        // Try to fetch from real API
        return await serverApi.getAllClientsStatus();
      } catch (error) {
        console.log("Error fetching client status, using simulated data", error);
        // Fallback to simulated data
        return [1, 2, 3].map(id => simulateApi.getRandomClientStatus(id.toString()));
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Display toast notification when there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching clients status",
        description: "Using simulated data for demonstration",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case "trained":
        return "bg-green-100 text-green-800";
      case "training":
        return "bg-yellow-100 text-yellow-800";
      case "not_trained":
        return "bg-slate-100 text-slate-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case "synced":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getModelStatusIcon = (status: string) => {
    switch (status) {
      case "trained":
        return <CheckCircleIcon className="h-4 w-4 text-success" />;
      case "training":
        return <div className="h-4 w-4 rounded-full bg-yellow-400 animate-pulse-light" />;
      case "not_trained":
        return <AlertCircleIcon className="h-4 w-4 text-slate-500" />;
      case "error":
        return <AlertCircleIcon className="h-4 w-4 text-danger" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Server Dashboard</h1>
        <Link
          to="/server/detection"
          className="px-4 py-2 rounded-md bg-blue text-white font-medium hover:bg-blue-dark transition-colors"
        >
          Go to Detection
        </Link>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center gap-2.5">
            <ServerIcon className="h-5 w-5 text-blue" />
            <CardTitle className="text-lg">System Status</CardTitle>
          </div>
          <CardDescription>Overview of connected clients and their status</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-blue border-t-transparent animate-spin"></div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Error loading clients</AlertTitle>
              <AlertDescription>
                Could not fetch client status. Displaying simulated data.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {clientsStatus?.map((client: ClientStatus) => (
                <Card key={client.clientId} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Client {client.clientId}</CardTitle>
                      <Badge className={getModelStatusColor(client.modelStatus)}>
                        <div className="flex items-center gap-1.5">
                          {getModelStatusIcon(client.modelStatus)}
                          <span className="capitalize">{client.modelStatus.replace("_", " ")}</span>
                        </div>
                      </Badge>
                    </div>
                    <CardDescription>
                      {client.lastSyncTime ? (
                        `Last sync: ${new Date(client.lastSyncTime).toLocaleString()}`
                      ) : (
                        "Not synced yet"
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3 pb-2">
                    {client.metrics ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-slate-500">Accuracy</span>
                            <span className="font-medium">{(client.metrics.accuracy * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-500">Precision</span>
                            <span className="font-medium">{(client.metrics.precision * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-slate-500">Recall</span>
                            <span className="font-medium">{(client.metrics.recall * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-500">F1 Score</span>
                            <span className="font-medium">{(client.metrics.f1Score * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-slate-500">AUC</span>
                            <span className="font-medium">{(client.metrics.auc * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-500">Data Volume</span>
                            <span className="font-medium">{client.metrics.dataVolume.toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center text-slate-500">
                        No metrics available
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t bg-slate-50 px-4 py-2">
                    <Badge className={getSyncStatusColor(client.syncStatus)}>
                      {client.syncStatus}
                    </Badge>
                    <Link
                      to={`/client/${client.clientId}/dashboard`}
                      className="text-blue hover:underline text-sm"
                    >
                      View Client
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerDashboard;
