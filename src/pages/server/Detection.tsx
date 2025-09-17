
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheckIcon, FileIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionData, serverApi, PredictionResult, ERSResult } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const ServerDetection = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [transactionType, setTransactionType] = useState("TRANSFER");
  
  // Results state
  const [detectionResults, setDetectionResults] = useState<{
    transaction: TransactionData;
    clientPredictions: PredictionResult[];
    aggregatedScore: number;
    ersResult?: ERSResult;
    finalDecision: "fraud" | "legitimate";
  } | null>(null);
  
  const [batchResults, setBatchResults] = useState<any[]>([]);

  // Form data for single transaction detection
  const [transaction, setTransaction] = useState<TransactionData>({
    amount: 10000,
    oldbalanceOrg: 15000,
    newbalanceOrig: 5000,
    oldbalanceDest: 5000,
    newbalanceDest: 15000,
    type: transactionType,
  });

  // File upload state
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      toast({
        title: "File selected",
        description: e.target.files[0].name,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTransaction({ ...transaction, [name]: parseFloat(value) });
  };

  const handleTypeChange = (value: string) => {
    setTransactionType(value);
    setTransaction({ ...transaction, type: value });
  };

  const handleSingleDetection = async () => {
    setIsLoading(true);
    setDetectionResults(null);
    
    try {
      const result = await serverApi.detectFraud(transaction);
      setDetectionResults(result);
      
      toast({
        title: `Detection Result: ${result.finalDecision.toUpperCase()}`,
        description: `Aggregated confidence score: ${(result.aggregatedScore * 100).toFixed(2)}%`,
        variant: result.finalDecision === "fraud" ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Detection error:", error);
      toast({
        title: "Detection Failed",
        description: "An error occurred during the detection process.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setBatchResults([]);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // In a real implementation, this would be serverApi.detectBatch(formData)
      // For now, we'll simulate batch processing
      const response = await fetch(`http://localhost:4000/server/detect-batch`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Batch processing failed');
      }
      
      const results = await response.json();
      setBatchResults(results);
      
      toast({
        title: "Batch Processing Complete",
        description: `Processed ${results.length} transactions.`,
      });
    } catch (error) {
      console.error("Batch processing error:", error);
      toast({
        title: "Batch Processing Failed",
        description: "An error occurred during file processing.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score > 0.7) return "text-red-600";
    if (score > 0.45) return "text-amber-600";
    return "text-green-600";
  };

  const getDecisionBadge = (decision: string) => {
    if (decision === "fraud") {
      return <Badge className="bg-red-500">FRAUD</Badge>;
    }
    return <Badge className="bg-green-500">LEGITIMATE</Badge>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Fraud Detection</h1>
      
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Transaction</TabsTrigger>
          <TabsTrigger value="batch">Batch Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center gap-2.5">
                <ShieldCheckIcon className="h-5 w-5 text-blue" />
                <CardTitle className="text-lg">Detection Dashboard</CardTitle>
              </div>
              <CardDescription>
                Enter transaction details for fraud analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Transaction Amount</Label>
                    <Input 
                      id="amount" 
                      name="amount"
                      type="number"
                      value={transaction.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="oldbalanceOrg">Origin Initial Balance</Label>
                    <Input 
                      id="oldbalanceOrg" 
                      name="oldbalanceOrg"
                      type="number"
                      value={transaction.oldbalanceOrg}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newbalanceOrig">Origin Final Balance</Label>
                    <Input 
                      id="newbalanceOrig" 
                      name="newbalanceOrig"
                      type="number"
                      value={transaction.newbalanceOrig}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transactionType">Transaction Type</Label>
                    <Select value={transactionType} onValueChange={handleTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Transaction Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                        <SelectItem value="CASH_OUT">Cash Out</SelectItem>
                        <SelectItem value="PAYMENT">Payment</SelectItem>
                        <SelectItem value="DEBIT">Debit</SelectItem>
                        <SelectItem value="CASH_IN">Cash In</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="oldbalanceDest">Destination Initial Balance</Label>
                    <Input 
                      id="oldbalanceDest" 
                      name="oldbalanceDest"
                      type="number"
                      value={transaction.oldbalanceDest}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newbalanceDest">Destination Final Balance</Label>
                    <Input 
                      id="newbalanceDest" 
                      name="newbalanceDest"
                      type="number"
                      value={transaction.newbalanceDest}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleSingleDetection}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  "Detect Fraud"
                )}
              </Button>
              
              {detectionResults && (
                <div className="mt-8 space-y-6">
                  <Separator />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg font-semibold">Detection Results</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Final Decision:</span>
                      {getDecisionBadge(detectionResults.finalDecision)}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-md">
                      <h4 className="font-medium mb-2">Client Predictions</h4>
                      <div className="space-y-2">
                        {detectionResults.clientPredictions.map((prediction) => (
                          <div key={prediction.clientId} className="flex justify-between items-center p-2 border rounded">
                            <div>Client {prediction.clientId}</div>
                            <div className={getConfidenceColor(prediction.confidenceScore)}>
                              {(prediction.confidenceScore * 100).toFixed(2)}% {prediction.prediction.toUpperCase()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-md">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Aggregated Score</h4>
                        <div className={getConfidenceColor(detectionResults.aggregatedScore)}>
                          {(detectionResults.aggregatedScore * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    
                    {detectionResults.ersResult && detectionResults.ersResult.triggered && (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                        <h4 className="font-medium flex items-center gap-2">
                          <AlertCircleIcon className="h-4 w-4 text-amber-500" />
                          Expert Rule System Triggered
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          ERS was triggered because the confidence score was in the ambiguous range.
                        </p>
                        
                        <div className="mt-3">
                          <h5 className="text-sm font-medium">Matched Rules:</h5>
                          <ul className="mt-1 pl-5 list-disc text-sm">
                            {detectionResults.ersResult.matchedRules.map((rule) => (
                              <li key={rule} className="text-slate-600">
                                {rule.replace(/_/g, ' ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="mt-3 flex justify-between">
                          <span className="text-sm font-medium">ERS Decision:</span>
                          {getDecisionBadge(detectionResults.ersResult.decision)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="batch">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center gap-2.5">
                <FileIcon className="h-5 w-5 text-blue" />
                <CardTitle className="text-lg">Batch Analysis</CardTitle>
              </div>
              <CardDescription>
                Upload a CSV file containing multiple transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="border-2 border-dashed rounded-lg p-10 text-center">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <FileIcon className="h-10 w-10 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Upload a CSV file</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      File should contain transaction data in the expected format
                    </p>
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="max-w-sm mx-auto"
                  />
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleFileUpload}
                disabled={isLoading || !file}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing Batch...
                  </>
                ) : (
                  "Process Batch"
                )}
              </Button>
              
              {batchResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Batch Results ({batchResults.length} transactions)</h3>
                  <ScrollArea className="h-[400px] border rounded-md">
                    <div className="p-4 space-y-4">
                      {batchResults.map((result, index) => (
                        <div key={index} className="border rounded-md p-4">
                          <div className="flex justify-between mb-3">
                            <span className="font-medium">Transaction #{index + 1}</span>
                            {getDecisionBadge(result.finalDecision)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Amount: ${result.transaction.amount}</div>
                            <div>Type: {result.transaction.type}</div>
                          </div>
                          
                          <div className="mt-2">
                            <div className="text-sm font-medium">Client Scores:</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {result.clientPredictions.map((pred) => (
                                <span 
                                  key={pred.clientId}
                                  className={`text-xs px-2 py-1 rounded bg-slate-100 ${
                                    getConfidenceColor(pred.confidenceScore)
                                  }`}
                                >
                                  Client {pred.clientId}: {(pred.confidenceScore * 100).toFixed(0)}%
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-2 flex justify-between items-center text-sm">
                            <span>Aggregated: {(result.aggregatedScore * 100).toFixed(2)}%</span>
                            {result.ersResult?.triggered && (
                              <span className="text-amber-600">ERS Applied</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServerDetection;
