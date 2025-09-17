
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { SettingsIcon, InfoIcon, SaveIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { serverApi } from "@/services/api";

const ServerSettings = () => {
  const { toast } = useToast();
  
  const [ersThreshold, setErsThreshold] = useState<[number, number]>([0.45, 0.7]);
  const [settings, setSettings] = useState({
    enableERS: true,
    apiPort: "4000",
    weightingStrategy: "performance", // performance or equal
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from server on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const serverSettings = await serverApi.getServerSettings();
        setSettings({
          enableERS: serverSettings.enableERS,
          apiPort: serverSettings.apiPort.toString(),
          weightingStrategy: serverSettings.weightingStrategy,
        });
        setErsThreshold(serverSettings.ersThreshold);
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast({
          title: "Failed to load settings",
          description: "Using default settings. Some features may not work correctly.",
          variant: "destructive",
        });
      }
    };

    loadSettings();
  }, [toast]);

  const handleSettingChange = (name: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await serverApi.saveServerSettings({
        apiPort: parseInt(settings.apiPort),
        ersThreshold,
        weightingStrategy: settings.weightingStrategy,
        enableERS: settings.enableERS,
      });
      
      toast({
        title: "Settings Saved",
        description: "Server settings have been updated successfully.",
      });
      
      // Show restart notification if API port was changed
      if (parseInt(settings.apiPort) !== 4000) {
        toast({
          title: "Server Restart Required",
          description: "API port has been changed. Please restart the server for changes to take effect.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Failed to save settings",
        description: "An error occurred while saving settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Server Settings</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex items-center gap-2.5">
              <SettingsIcon className="h-5 w-5 text-blue" />
              <CardTitle className="text-lg">General Settings</CardTitle>
            </div>
            <CardDescription>
              Configure server behavior and API settings
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="apiPort">API Port</Label>
              <Input 
                id="apiPort" 
                value={settings.apiPort}
                onChange={(e) => handleSettingChange("apiPort", e.target.value)}
                placeholder="4000"
              />
              <p className="text-sm text-slate-500">
                Port used by the backend API service
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableERS">Enable Expert Rule System</Label>
                  <p className="text-sm text-slate-500">
                    Use rule-based fallback for uncertain predictions
                  </p>
                </div>
                <Switch 
                  id="enableERS" 
                  checked={settings.enableERS}
                  onCheckedChange={(checked) => handleSettingChange("enableERS", checked)}
                />
              </div>
              
              {settings.enableERS && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>ERS Threshold Range</Label>
                    <span className="text-sm font-medium">
                      {ersThreshold[0].toFixed(2)} - {ersThreshold[1].toFixed(2)}
                    </span>
                  </div>
                  <div className="py-4">
                    <Slider 
                      value={[ersThreshold[0] * 100, ersThreshold[1] * 100]}
                      onValueChange={(newValues) => {
                        setErsThreshold([newValues[0] / 100, newValues[1] / 100]);
                      }}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                  <p className="text-sm text-slate-500 flex gap-1.5 items-start">
                    <InfoIcon className="h-4 w-4 mt-0.5 text-blue" />
                    <span>
                      ERS will be triggered when the aggregated prediction score falls within this range
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Client Weighting Strategy</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={settings.weightingStrategy === "equal" ? "default" : "outline"}
                  onClick={() => handleSettingChange("weightingStrategy", "equal")}
                  className="justify-start"
                >
                  <div className="text-left">
                    <div className="font-medium">Equal Weights</div>
                    <div className="text-xs text-slate-500">All clients have the same influence</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={settings.weightingStrategy === "performance" ? "default" : "outline"}
                  onClick={() => handleSettingChange("weightingStrategy", "performance")}
                  className="justify-start"
                >
                  <div className="text-left">
                    <div className="font-medium">Performance-Based</div>
                    <div className="text-xs text-slate-500">Weight by model metrics</div>
                  </div>
                </Button>
              </div>
            </div>
            
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServerSettings;
