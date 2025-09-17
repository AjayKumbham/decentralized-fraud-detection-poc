
import { useState, useEffect } from "react";
import { useClientId } from "@/contexts/ClientIdContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { SettingsIcon, SaveIcon, TrashIcon } from "lucide-react";
import { clientApi } from "@/services/api";

const ClientSettings = () => {
  const { clientId } = useClientId();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    clientName: `Client ${clientId}`,
    apiPort: (4000 + parseInt(clientId)).toString(),
    modelType: "random_forest",
    autoSync: true,
    dataRetention: "30", // days
    enableLogging: true,
    maxTrainingTime: "300", // seconds
    confidenceThreshold: "0.5"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from server on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const clientSettings = await clientApi.getClientSettings(clientId);
        setSettings({
          clientName: clientSettings.clientName,
          apiPort: clientSettings.apiPort.toString(),
          modelType: clientSettings.modelType,
          autoSync: clientSettings.autoSync,
          dataRetention: clientSettings.dataRetention.toString(),
          enableLogging: clientSettings.enableLogging,
          maxTrainingTime: clientSettings.maxTrainingTime.toString(),
          confidenceThreshold: clientSettings.confidenceThreshold.toString()
        });
      } catch (error) {
        console.error("Failed to load client settings:", error);
        toast({
          title: "Failed to load settings",
          description: "Using default settings. Some features may not work correctly.",
          variant: "destructive",
        });
      }
    };

    loadSettings();
  }, [clientId, toast]);

  const handleSettingChange = (name: string, value: string | boolean | number) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await clientApi.saveClientSettings(clientId, {
        clientName: settings.clientName,
        apiPort: parseInt(settings.apiPort),
        modelType: settings.modelType,
        dataRetention: parseInt(settings.dataRetention),
        autoSync: settings.autoSync,
        enableLogging: settings.enableLogging,
        maxTrainingTime: parseInt(settings.maxTrainingTime),
        confidenceThreshold: parseFloat(settings.confidenceThreshold)
      });
      
      toast({
        title: "Settings Saved",
        description: `Settings for Client ${clientId} have been updated successfully.`,
      });
      
      // Show restart notification if API port was changed
      if (parseInt(settings.apiPort) !== (4000 + parseInt(clientId))) {
        toast({
          title: "Client Restart Required",
          description: "API port has been changed. Please restart the client for changes to take effect.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to save client settings:", error);
      toast({
        title: "Failed to save settings",
        description: "An error occurred while saving settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetModel = () => {
    toast({
      title: "Model Reset",
      description: "The model has been reset and all training data removed.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Client Settings</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex items-center gap-2.5">
              <SettingsIcon className="h-5 w-5 text-blue" />
              <CardTitle className="text-lg">Client Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure model and communication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input 
                  id="clientName" 
                  value={settings.clientName}
                  onChange={(e) => handleSettingChange("clientName", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiPort">API Port</Label>
                <Input 
                  id="apiPort" 
                  value={settings.apiPort}
                  onChange={(e) => handleSettingChange("apiPort", e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Port used by the client's backend API service
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="modelType">Model Type</Label>
                <Select 
                  value={settings.modelType}
                  onValueChange={(value) => handleSettingChange("modelType", value)}
                >
                  <SelectTrigger id="modelType">
                    <SelectValue placeholder="Select a model type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neural_network">Neural Network</SelectItem>
                    <SelectItem value="random_forest">Random Forest</SelectItem>
                    <SelectItem value="gradient_boost">Gradient Boosting</SelectItem>
                    <SelectItem value="logistic_regression">Logistic Regression</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention (days)</Label>
                <Input 
                  id="dataRetention" 
                  type="number"
                  value={settings.dataRetention}
                  onChange={(e) => handleSettingChange("dataRetention", e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  How long to keep training data before automatic deletion
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maxTrainingTime">Max Training Time (seconds)</Label>
                <Input 
                  id="maxTrainingTime" 
                  type="number"
                  value={settings.maxTrainingTime}
                  onChange={(e) => handleSettingChange("maxTrainingTime", e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Maximum time allowed for model training
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confidenceThreshold">Confidence Threshold</Label>
                <Input 
                  id="confidenceThreshold" 
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={settings.confidenceThreshold}
                  onChange={(e) => handleSettingChange("confidenceThreshold", e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Minimum confidence score for predictions (0-1)
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSync">Auto-Sync with Server</Label>
                  <p className="text-sm text-slate-500">
                    Automatically send model metrics to server after training
                  </p>
                </div>
                <Switch 
                  id="autoSync" 
                  checked={settings.autoSync}
                  onCheckedChange={(checked) => handleSettingChange("autoSync", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableLogging">Enable Logging</Label>
                  <p className="text-sm text-slate-500">
                    Enable detailed logging for debugging and monitoring
                  </p>
                </div>
                <Switch 
                  id="enableLogging" 
                  checked={settings.enableLogging}
                  onCheckedChange={(checked) => handleSettingChange("enableLogging", checked)}
                />
              </div>
            </div>
            
            <div className="pt-2">
                          <Button 
              onClick={saveSettings} 
              className="w-full"
              size="lg"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg">Danger Zone</CardTitle>
            <CardDescription>
              Actions that can't be undone
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="border rounded-md p-4 border-red-200 bg-red-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-medium text-red-800">Reset Model</h3>
                  <p className="text-sm text-red-600">
                    Delete the current model and all training data. This action cannot be undone.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={resetModel}
                  className="w-full sm:w-auto"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Reset Model
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientSettings;
