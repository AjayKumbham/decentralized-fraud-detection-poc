
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useClientId } from "@/contexts/ClientIdContext";
import { clientApi, simulateApi } from "@/services/api";
import { AlertCircleIcon, CheckCircleIcon, BarChartIcon, FileTextIcon, UploadIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

const ClientDashboard = () => {
  const { toast } = useToast();
  const { clientId } = useClientId();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  // Fetch client status
  const { data: clientStatus, isLoading, error, refetch } = useQuery({
    queryKey: ["clientStatus", clientId],
    queryFn: async () => {
      try {
        // Try to fetch from real API
        return await clientApi.getClientStatus(clientId);
      } catch (error) {
        console.log("Error fetching client status, using simulated data", error);
        // Fallback to simulated data
        return simulateApi.getRandomClientStatus(clientId);
      }
    },
  });

  // Handler for file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      toast({
        title: "File Selected",
        description: `${e.target.files[0].name} (${Math.round(e.target.files[0].size / 1024)} KB)`,
      });
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate file upload with progress
    const intervalId = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(intervalId);
        }
        return newProgress;
      });
    }, 300);

    try {
      // In a real app, we would send the file to the server
      // Simulate a delay for the upload
      await new Promise((resolve) => setTimeout(resolve, 3000));

      toast({
        title: "File uploaded successfully",
        description: "The dataset is now ready for analysis and training",
      });

      // Navigate to training page
      // window.location.href = `/client/${clientId}/training`;
      
    } catch (error) {
      toast({
        title: "Error uploading file",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      clearInterval(intervalId);
      setUploadProgress(100);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Link
          to={`/client/${clientId}/training`}
          className="px-4 py-2 rounded-md bg-blue text-white font-medium hover:bg-blue-dark transition-colors"
        >
          Go to Training
        </Link>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center gap-2.5">
            <BarChartIcon className="h-5 w-5 text-blue" />
            <CardTitle className="text-lg">Client Status</CardTitle>
          </div>
          <CardDescription>Current status and model information</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-blue border-t-transparent animate-spin"></div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Error loading status</AlertTitle>
              <AlertDescription>
                Could not fetch client status. Using simulated data.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-slate-500 text-sm">Model Status</span>
                    {clientStatus?.modelStatus === "trained" ? (
                      <CheckCircleIcon className="h-4 w-4 text-success" />
                    ) : clientStatus?.modelStatus === "training" ? (
                      <div className="h-4 w-4 rounded-full bg-yellow-400 animate-pulse-light" />
                    ) : (
                      <AlertCircleIcon className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <p className="text-xl font-semibold capitalize">
                    {clientStatus?.modelStatus.replace("_", " ")}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-slate-500 text-sm">Sync Status</span>
                    {clientStatus?.syncStatus === "synced" ? (
                      <CheckCircleIcon className="h-4 w-4 text-blue" />
                    ) : (
                      <AlertCircleIcon className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <p className="text-xl font-semibold capitalize">
                    {clientStatus?.syncStatus}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="text-slate-500 text-sm mb-2">Last Sync</div>
                  <p className="text-xl font-semibold">
                    {clientStatus?.lastSyncTime
                      ? new Date(clientStatus.lastSyncTime).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="text-slate-500 text-sm mb-2">Data Volume</div>
                  <p className="text-xl font-semibold">
                    {clientStatus?.metrics?.dataVolume?.toLocaleString() || "No data"}
                  </p>
                </div>
              </div>

              {clientStatus?.metrics && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Model Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-slate-500">Accuracy</p>
                        <p className="font-semibold">
                          {(clientStatus.metrics.accuracy * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500">Precision</p>
                        <p className="font-semibold">
                          {(clientStatus.metrics.precision * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500">Recall</p>
                        <p className="font-semibold">
                          {(clientStatus.metrics.recall * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500">F1 Score</p>
                        <p className="font-semibold">
                          {(clientStatus.metrics.f1Score * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500">AUC</p>
                        <p className="font-semibold">
                          {(clientStatus.metrics.auc * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center gap-2.5">
            <FileTextIcon className="h-5 w-5 text-blue" />
            <CardTitle className="text-lg">Dataset Management</CardTitle>
          </div>
          <CardDescription>Upload and analyze transaction datasets</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Dataset</TabsTrigger>
              <TabsTrigger value="current">Current Dataset</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="pt-4">
              <div className="border-2 border-dashed rounded-lg p-10 text-center">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <UploadIcon className="h-10 w-10 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Upload a CSV file</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      File should contain transaction data in the expected format
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="max-w-sm mx-auto block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue hover:file:bg-blue-100"
                  />
                </div>
              </div>

              {isUploading && (
                <div className="my-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="mt-6">
                <Button 
                  onClick={handleFileUpload} 
                  className="w-full"
                  disabled={!file || isUploading}
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="mr-2 h-4 w-4" />
                      Upload and Analyze
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="current" className="pt-4">
              {clientStatus?.metrics ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-slate-50 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Total Records</p>
                        <p className="font-semibold">
                          {clientStatus.metrics.dataVolume.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Fraud Ratio</p>
                        <p className="font-semibold">
                          {(clientStatus.metrics.fraudRatio * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    to={`/client/${clientId}/training`}
                    className="block w-full py-2 px-3 bg-blue text-white rounded-md text-center font-medium hover:bg-blue-dark transition-colors"
                  >
                    View Training Details
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">No dataset uploaded yet</p>
                  <p className="text-sm mt-2">
                    Upload a dataset to start analysis and training
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboard;
