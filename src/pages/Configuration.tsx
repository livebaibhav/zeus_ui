import { useState } from "react";
import { StatusCard } from "@/components/StatusCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { rosBridgeService } from "@/services/rosbridge";

export default function Configuration() {
  const [rosUrl, setRosUrl] = useState<string>(rosBridgeService.getUrl ? rosBridgeService.getUrl() : "ws://localhost:9090");

  const handleSave = () => {
    try {
      localStorage.setItem("rosbridge_url", rosUrl);
    } catch {}
    rosBridgeService.setUrl(rosUrl);
    toast({
      title: "Settings Saved",
      description: `ROSBridge URL set to ${rosUrl}`,
    });
  };

  const handleReset = () => {
    const defaultUrl = "ws://localhost:9090";
    setRosUrl(defaultUrl);
    try {
      localStorage.setItem("rosbridge_url", defaultUrl);
    } catch {}
    rosBridgeService.setUrl(defaultUrl);
    toast({
      title: "Settings Reset",
      description: "Configuration reset to default values",
      variant: "destructive",
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuration</h1>
          <p className="text-muted-foreground">Robot parameters and settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="bg-gradient-primary">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Physical Parameters */}
      <StatusCard title="Physical Parameters" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Wheel Radius (m)</Label>
            <Input type="number" defaultValue="0.15" step="0.01" />
          </div>
          <div className="space-y-2">
            <Label>Wheel Base (m)</Label>
            <Input type="number" defaultValue="0.45" step="0.01" />
          </div>
          <div className="space-y-2">
            <Label>Robot Width (m)</Label>
            <Input type="number" defaultValue="0.60" step="0.01" />
          </div>
          <div className="space-y-2">
            <Label>Robot Length (m)</Label>
            <Input type="number" defaultValue="0.80" step="0.01" />
          </div>
        </div>
      </StatusCard>

      {/* Navigation Parameters */}
      <StatusCard title="Navigation Parameters" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Max Linear Velocity (m/s)</Label>
            <Input type="number" defaultValue="1.0" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Max Angular Velocity (rad/s)</Label>
            <Input type="number" defaultValue="1.5" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Acceleration Limit (m/s²)</Label>
            <Input type="number" defaultValue="0.5" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Lookahead Distance (m)</Label>
            <Input type="number" defaultValue="0.8" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Goal Tolerance (m)</Label>
            <Input type="number" defaultValue="0.1" step="0.01" />
          </div>
          <div className="space-y-2">
            <Label>Rotation Tolerance (rad)</Label>
            <Input type="number" defaultValue="0.1" step="0.01" />
          </div>
        </div>
      </StatusCard>

      {/* Safety Parameters */}
      <StatusCard title="Safety Parameters" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Emergency Stop Distance (m)</Label>
            <Input type="number" defaultValue="0.5" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Obstacle Detection Range (m)</Label>
            <Input type="number" defaultValue="2.0" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Safety Margin (m)</Label>
            <Input type="number" defaultValue="0.2" step="0.05" />
          </div>
        </div>
      </StatusCard>

      {/* Network Configuration */}
      <StatusCard title="Network Configuration" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>ROSBridge WebSocket URL</Label>
            <Input defaultValue="ws://localhost:9090" placeholder="ws://your-robot-ip:9090" />
          </div>
          <div className="space-y-2">
            <Label>MQTT Broker</Label>
            <Input defaultValue="mqtt://localhost:1883" placeholder="mqtt://broker-address:1883" />
          </div>
          <div className="space-y-2">
            <Label>VDA5050 Topic Prefix</Label>
            <Input defaultValue="/vda5050" />
          </div>
          <div className="space-y-2">
            <Label>Connection Timeout (ms)</Label>
            <Input type="number" defaultValue="5000" step="100" />
          </div>
        </div>
      </StatusCard>

      {/* Sensor Configuration */}
      <StatusCard title="Sensor Configuration" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>LiDAR Scan Rate (Hz)</Label>
            <Input type="number" defaultValue="30" step="1" />
          </div>
          <div className="space-y-2">
            <Label>IMU Update Rate (Hz)</Label>
            <Input type="number" defaultValue="100" step="10" />
          </div>
          <div className="space-y-2">
            <Label>Odometry Rate (Hz)</Label>
            <Input type="number" defaultValue="50" step="5" />
          </div>
          <div className="space-y-2">
            <Label>Battery Update Rate (Hz)</Label>
            <Input type="number" defaultValue="1" step="0.1" />
          </div>
        </div>
      </StatusCard>
    </div>
  );
}
