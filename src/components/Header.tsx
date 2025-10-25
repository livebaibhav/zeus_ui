import { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertTriangle, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { rosBridgeService, ConnectionStatus } from "@/services/rosbridge";
import { toast } from "@/hooks/use-toast";
import ROSLIB from "roslib";

interface HeaderProps {
  onEmergencyStop: () => void;
}

export function Header({ onEmergencyStop }: HeaderProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [robotMode, setRobotMode] = useState<'AUTO' | 'MANUAL' | 'ERROR'>('AUTO');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    rosBridgeService.connect((status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        toast({
          title: "Connected",
          description: "Successfully connected to ROSBridge",
        });
        
        // Subscribe to battery data
        const ros = rosBridgeService.getRos();
        if (ros) {
          const batteryListener = new ROSLIB.Topic({
            ros: ros,
            name: "/battery_data",
            messageType: "sensor_msgs/BatteryState",
          });

          batteryListener.subscribe((message: any) => {
            setBatteryLevel(Math.round(message.percentage * 100));
          });

          // Subscribe to robot state
          const stateListener = new ROSLIB.Topic({
            ros: ros,
            name: "/robot_state",
            messageType: "std_msgs/String",
          });

          stateListener.subscribe((message: any) => {
            const state = message.data.toUpperCase();
            if (state.includes("MANUAL")) {
              setRobotMode("MANUAL");
            } else if (state.includes("ERROR")) {
              setRobotMode("ERROR");
            } else {
              setRobotMode("AUTO");
            }
          });
        }
      } else if (status === 'error') {
        toast({
          title: "Connection Error",
          description: "Failed to connect to ROSBridge",
          variant: "destructive",
        });
      }
    });

    return () => rosBridgeService.disconnect();
  }, []);

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'connecting':
        return <Wifi className="h-4 w-4 animate-pulse" />;
      case 'error':
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
    }
  };

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-success text-success-foreground">Connected</Badge>;
      case 'connecting':
        return <Badge className="bg-warning text-warning-foreground">Connecting...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  const getModeColor = () => {
    switch (robotMode) {
      case 'AUTO':
        return 'bg-success text-success-foreground';
      case 'MANUAL':
        return 'bg-warning text-warning-foreground';
      case 'ERROR':
        return 'bg-destructive text-destructive-foreground';
    }
  };

  const handleEmergencyStop = () => {
    toast({
      title: "Emergency Stop Activated",
      description: "Robot has been stopped immediately",
      variant: "destructive",
    });
    onEmergencyStop();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-lg">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            {getConnectionIcon()}
            {getConnectionBadge()}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Mode:</span>
            <Badge className={getModeColor()}>{robotMode}</Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Power className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Battery:</span>
            <span className={`font-semibold ${
              batteryLevel > 50 ? 'text-success' : 
              batteryLevel > 20 ? 'text-warning' : 
              'text-destructive'
            }`}>
              {batteryLevel}%
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            {currentTime.toLocaleTimeString()}
          </div>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleEmergencyStop}
            className="bg-gradient-emergency font-bold shadow-glow hover:shadow-destructive/50"
          >
            <AlertTriangle className="mr-2 h-5 w-5" />
            EMERGENCY STOP
          </Button>
        </div>
      </div>
    </header>
  );
}
