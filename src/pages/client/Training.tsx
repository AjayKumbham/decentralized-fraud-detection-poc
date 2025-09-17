
import { useState } from "react";
import { useClientId } from "@/contexts/ClientIdContext";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  ZapIcon, 
  BarChart2Icon, 
  SendIcon, 
  AlertCircleIcon,
  InfoIcon,
  CheckCircleIcon
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { simulateApi, TrainingLog } from "@/services/api";

// Sample data for charts
const sampleChartData = [
  { name: 'Epoch 1', accuracy: 0.78, loss: 0.52 },
  { name: 'Epoch 2', accuracy: 0.81, loss: 0.43 },
  { name: 'Epoch 3', accuracy: 0.85, loss: 0.38 },
  { name: 'Epoch 4', accuracy: 0.87, loss: 0.33 },
  { name: 'Epoch 5', accuracy: 0.89, loss: 0.29 },
  { name: 'Epoch 6', accuracy: 0.9, loss: 0.27 },
  { name: 'Epoch 7', accuracy: 0.91, loss: 0.25 },
  { name: 'Epoch 8', accuracy: 0.92, loss: 0.23 },
];

// Sample training logs
const sampleTrainingLogs: TrainingLog[] = [
  { message: "Loading dataset from client storage", timestamp: "2023-06-10T09:15:00Z", level: "info" },
  { message: "Dataset loaded successfully: 45,829 records", timestamp: "2023-06-10T09:15:02Z", level: "info" },
  { message: "Data preprocessing started", timestamp: "2023-06-10T09:15:03Z", level: "info" },
  { message: "Normalizing numerical features", timestamp: "2023-06-10T09:15:05Z", level: "info" },
  { message: "Encoding categorical features", timestamp: "2023-06-10T09:15:08Z", level: "info" },
  { message: "Data split: 80% training, 20% validation", timestamp: "2023-06-10T09:15:10Z", level: "info" },
  { message: "Building neural network with 3 hidden layers", timestamp: "2023-06-10T09:15:12Z", level: "info" },
  { message: "Training started with batch size 64", timestamp: "2023-06-10T09:15:15Z", level: "info" },
  { message: "Epoch 1/8 completed - loss: 0.52, accuracy: 0.78", timestamp: "2023-06-10T09:15:30Z", level: "info" },
  { message: "Epoch 2/8 completed - loss: 0.43, accuracy: 0.81", timestamp: "2023-06-10T09:15:45Z", level: "info" },
  { message: "Epoch 3/8 completed - loss: 0.38, accuracy: 0.85", timestamp: "2023-06-10T09:16:00Z", level: "info" },
  { message: "Epoch 4/8 completed - loss: 0.33, accuracy: 0.87", timestamp: "2023-06-10T09:16:15Z", level: "info" },
  { message: "Epoch 5/8 completed - loss: 0.29, accuracy: 0.89", timestamp: "2023-06-10T09:16:30Z", level: "info" },
  { message: "Epoch 6/8 completed - loss: 0.27, accuracy: 0.90", timestamp: "2023-06-10T09:16:45Z", level: "info" },
  { message: "Epoch 7/8 completed - loss: 0.25, accuracy: 0.91", timestamp: "2023-06-10T09:17:00Z", level: "info" },
  { message: "Epoch 8/8 completed - loss: 0.23, accuracy: 0.92", timestamp: "2023-06-10T09:17:15Z", level: "info" },
  { message: "Training completed successfully", timestamp: "2023-06-10T09:17:16Z", level: "success" },
  { message: "Evaluating model on validation set", timestamp: "2023-06-10T09:17:17Z", level: "info" },
  { message: "Model evaluation complete", timestamp: "2023-06-10T09:17:20Z", level: "success" },
  { message: "Model saved to client storage", timestamp: "2023-06-10T09:17:22Z", level: "success" },
];

const ClientTraining = () => {
  const { clientId } = useClientId();
  const { toast } = useToast();
  
  // State for training 
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'not_synced' | 'syncing' | 'synced' | 'error'>('not_synced');

  // Start training
  const startTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLogs([]);
    
    // Simulate training progress
    const totalLogs = sampleTrainingLogs.length;
    let currentLog = 0;
    
    const intervalId = setInterval(() => {
      if (currentLog < totalLogs) {
        setTrainingLogs(prev => [...prev, sampleTrainingLogs[currentLog]]);
        setTrainingProgress(Math.min(100, Math.round((currentLog / totalLogs) * 100)));
        currentLog++;
      } else {
        clearInterval(intervalId);
        setTrainingProgress(100);
        setIsTraining(false);
        // Set metrics after training
        setMetrics(simulateApi.getRandomTrainingMetrics());
        toast({
          title: "Training completed",
          description: "Model trained successfully with 92% accuracy",
        });
      }
    }, 600);
  };

  // Send metrics to server
  const sendMetricsToServer = async () => {
    if (!metrics) {
      toast({
        title: "No metrics available",
        description: "Train the model first to generate metrics",
        variant: "destructive",
      });
      return;
    }

    setSyncStatus('syncing');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSyncStatus('synced');
      toast({
        title: "Metrics sent successfully",
        description: "Server has received the metrics",
      });
    } catch (error) {
      setSyncStatus('error');
      toast({
        title: "Error sending metrics",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "info": return "text-blue-600";
      case "warning": return "text-yellow-600";
      case "error": return "text-red-600";
      case "success": return "text-green-600";
      default: return "text-slate-600";
    }
  };

  const getSyncStatusBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return <Badge className="bg-blue">Synced with Server</Badge>;
      case 'syncing':
        return <Badge className="bg-yellow-500">Syncing...</Badge>;
      case 'error':
        return <Badge variant="destructive">Sync Failed</Badge>;
      default:
        return <Badge variant="outline">Not Synced</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Model Training</h1>
        {getSyncStatusBadge()}
      </div>
      
      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center gap-2.5">
            <ZapIcon className="h-5 w-5 text-blue" />
            <CardTitle className="text-lg">Training Dashboard</CardTitle>
          </div>
          <CardDescription>
            Train and manage your fraud detection model
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Training Controls */}
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-md p-4 border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-medium">Model Training</h3>
                  <p className="text-sm text-slate-500">
                    Train your fraud detection model on the uploaded dataset
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={startTraining}
                    disabled={isTraining}
                    className="w-full sm:w-auto"
                  >
                    {isTraining ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Training...
                      </>
                    ) : (
                      <>
                        <ZapIcon className="mr-2 h-4 w-4" />
                        Start Training
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={sendMetricsToServer}
                    disabled={!metrics || isTraining || syncStatus === 'syncing'}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <SendIcon className="mr-2 h-4 w-4" />
                    Send to Server
                  </Button>
                </div>
              </div>
              
              {/* Training Progress */}
              {isTraining && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{trainingProgress}%</span>
                  </div>
                  <Progress value={trainingProgress} />
                </div>
              )}
            </div>

            <Tabs defaultValue="logs" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="logs">Training Logs</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="visualization">Visualization</TabsTrigger>
              </TabsList>
              
              <TabsContent value="logs" className="space-y-4 pt-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] rounded-md border">
                      <div className="p-4 space-y-2">
                        {trainingLogs.length > 0 ? (
                          trainingLogs.map((log, index) => (
                            <div key={index} className="text-sm">
                              <span className="text-slate-400">
                                {new Date(log.timestamp).toLocaleTimeString()} - 
                              </span>
                              <span className={getLogColor(log.level)}>
                                {" "}{log.message}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                            <InfoIcon className="h-8 w-8 mb-2" />
                            <p>No training logs yet</p>
                            <p className="text-sm">Start training to see logs</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="metrics" className="pt-4">
                <Card>
                  <CardContent className="pt-6">
                    {metrics ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="space-y-1">
                            <p className="text-sm text-slate-500">Accuracy</p>
                            <p className="text-2xl font-semibold">
                              {(metrics.accuracy * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-500">Precision</p>
                            <p className="text-2xl font-semibold">
                              {(metrics.precision * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-500">Recall</p>
                            <p className="text-2xl font-semibold">
                              {(metrics.recall * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-500">F1 Score</p>
                            <p className="text-2xl font-semibold">
                              {(metrics.f1Score * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-slate-500">AUC</p>
                            <p className="text-2xl font-semibold">
                              {(metrics.auc * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-500">Data Volume</p>
                            <p className="text-2xl font-semibold">
                              {metrics.dataVolume.toLocaleString()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-500">Fraud Ratio</p>
                            <p className="text-2xl font-semibold">
                              {(metrics.fraudRatio * 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <Alert className="bg-blue-50 border-blue-100">
                            <CheckCircleIcon className="h-4 w-4 text-blue" />
                            <AlertTitle>Model Ready</AlertTitle>
                            <AlertDescription>
                              Your model is trained and ready for detection. Send metrics to the server to participate in the federated detection system.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                        <BarChart2Icon className="h-8 w-8 mb-2" />
                        <p>No metrics available</p>
                        <p className="text-sm">Train the model to generate metrics</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="visualization" className="pt-4">
                <Card>
                  <CardContent className="pt-6">
                    {metrics ? (
                      <div className="space-y-8">
                        <div>
                          <h3 className="font-medium mb-4">Training Progress</h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={sampleChartData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="accuracy" fill="#0EA5E9" name="Accuracy" />
                                <Bar dataKey="loss" fill="#F97316" name="Loss" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                        <BarChart2Icon className="h-8 w-8 mb-2" />
                        <p>No visualization available</p>
                        <p className="text-sm">Train the model to generate visualizations</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientTraining;
