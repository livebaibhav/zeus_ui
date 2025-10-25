import { StatusCard } from "@/components/StatusCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Navigation2, Target, Settings2, Battery } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { rosBridgeService } from "@/services/rosbridge";
import ROSLIB from "roslib";

export default function Navigation() {
  const [position, setPosition] = useState({ x: 0, y: 0, theta: 0 });
  const [goalX, setGoalX] = useState("0.0");
  const [goalY, setGoalY] = useState("0.0");
  const [goalTheta, setGoalTheta] = useState("0.0");
  const [qrCode, setQrCode] = useState("");
  const [availableQRs, setAvailableQRs] = useState<string[]>([]);
  const [chargeQR, setChargeQR] = useState("CHARGE_QR_001");

  useEffect(() => {
    const ros = rosBridgeService.getRos();
    if (!ros) return;

    // Subscribe to robot pose
    const poseListener = new ROSLIB.Topic({
      ros: ros,
      name: "/robot_pose",
      messageType: "geometry_msgs/PoseStamped",
    });

    poseListener.subscribe((message: any) => {
      setPosition({
        x: message.pose.position.x,
        y: message.pose.position.y,
        theta: message.pose.orientation.z,
      });
    });

    // Subscribe to graphml data (QR codes)
    const graphListener = new ROSLIB.Topic({
      ros: ros,
      name: "/graph_nodes",
      messageType: "std_msgs/String",
    });

    graphListener.subscribe((message: any) => {
      try {
        const qrs = JSON.parse(message.data);
        setAvailableQRs(qrs);
      } catch (e) {
        console.error("Failed to parse graph nodes", e);
      }
    });

    return () => {
      poseListener.unsubscribe();
      graphListener.unsubscribe();
    };
  }, []);

  const handleSendGoal = () => {
    const ros = rosBridgeService.getRos();
    if (!ros) {
      toast({
        title: "Connection Error",
        description: "Not connected to ROSBridge",
        variant: "destructive",
      });
      return;
    }

    const goalPub = new ROSLIB.Topic({
      ros: ros,
      name: "/goal_pose",
      messageType: "geometry_msgs/PoseStamped",
    });

    const goal = new ROSLIB.Message({
      header: {
        frame_id: "map",
        stamp: { sec: 0, nanosec: 0 },
      },
      pose: {
        position: { x: parseFloat(goalX), y: parseFloat(goalY), z: 0 },
        orientation: { x: 0, y: 0, z: parseFloat(goalTheta), w: 1 },
      },
    });

    goalPub.publish(goal);
    
    toast({
      title: "Navigation Goal Set",
      description: `Robot is navigating to (${goalX}, ${goalY})`,
    });
  };

  const handleQRNavigation = () => {
    if (!qrCode) {
      toast({
        title: "Invalid QR Code",
        description: "Please enter a QR code",
        variant: "destructive",
      });
      return;
    }

    if (availableQRs.length > 0 && !availableQRs.includes(qrCode)) {
      toast({
        title: "Invalid QR Code",
        description: `QR code ${qrCode} not found in graph file`,
        variant: "destructive",
      });
      return;
    }

    const ros = rosBridgeService.getRos();
    if (!ros) {
      toast({
        title: "Connection Error",
        description: "Not connected to ROSBridge",
        variant: "destructive",
      });
      return;
    }

    const qrNavPub = new ROSLIB.Topic({
      ros: ros,
      name: "/navigate_to_qr",
      messageType: "std_msgs/String",
    });

    qrNavPub.publish(new ROSLIB.Message({ data: qrCode }));

    toast({
      title: "QR Navigation Started",
      description: `Navigating to QR code: ${qrCode}`,
    });
  };

  const handleChargeNavigation = () => {
    const ros = rosBridgeService.getRos();
    if (!ros) {
      toast({
        title: "Connection Error",
        description: "Not connected to ROSBridge",
        variant: "destructive",
      });
      return;
    }

    // Navigate to charge QR
    const qrNavPub = new ROSLIB.Topic({
      ros: ros,
      name: "/navigate_to_qr",
      messageType: "std_msgs/String",
    });

    qrNavPub.publish(new ROSLIB.Message({ data: chargeQR }));

    // Publish charge battery command
    const chargePub = new ROSLIB.Topic({
      ros: ros,
      name: "/charge_battery",
      messageType: "std_msgs/Int32",
    });

    // Delay charge command until robot reaches QR
    setTimeout(() => {
      chargePub.publish(new ROSLIB.Message({ data: 1 }));
      toast({
        title: "Charging Started",
        description: "Battery charging initiated",
      });
    }, 2000);

    toast({
      title: "Navigating to Charge Station",
      description: `Moving to charge QR: ${chargeQR}`,
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Navigation & Path Planning</h1>
        <p className="text-muted-foreground">Interactive map and path visualization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Viewer - Large Section */}
        <div className="lg:col-span-2">
          <StatusCard title="Map Viewer" icon={Map}>
            <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Placeholder for actual map */}
              <div className="absolute inset-0 opacity-10">
                <svg viewBox="0 0 800 600" className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="800" height="600" fill="url(#grid)" />
                </svg>
              </div>
              <div className="relative z-10 text-center space-y-4">
                <Map className="h-16 w-16 mx-auto text-primary/50" />
                <div>
                  <p className="text-lg font-semibold text-foreground">Map Display</p>
                  <p className="text-sm text-muted-foreground">Connect to ROS to view occupancy grid map</p>
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-lg">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-xs">Robot Position</span>
                  </div>
                  <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-lg">
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                    <span className="text-xs">Target Goal</span>
                  </div>
                  <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-lg">
                    <div className="w-3 h-3 bg-destructive rounded-full"></div>
                    <span className="text-xs">Obstacles</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm">Zoom In</Button>
              <Button variant="outline" size="sm">Reset View</Button>
              <Button variant="outline" size="sm">Zoom Out</Button>
            </div>
          </StatusCard>
        </div>

        {/* Goal Sender */}
        <div className="space-y-6">
          <StatusCard title="Set Navigation Goal" icon={Target}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>X Position (m)</Label>
                <Input type="number" placeholder="0.0" step="0.1" value={goalX} onChange={(e) => setGoalX(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Y Position (m)</Label>
                <Input type="number" placeholder="0.0" step="0.1" value={goalY} onChange={(e) => setGoalY(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Orientation (θ rad)</Label>
                <Input type="number" placeholder="0.0" step="0.1" value={goalTheta} onChange={(e) => setGoalTheta(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Button className="w-full bg-gradient-primary" onClick={handleSendGoal}>
                  <Navigation2 className="mr-2 h-4 w-4" />
                  Send Goal
                </Button>
                <Button variant="destructive" className="w-full">
                  Cancel Goal
                </Button>
              </div>
            </div>
          </StatusCard>

          <StatusCard title="QR Code Navigation" icon={Target}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>QR Code</Label>
                {availableQRs.length > 0 ? (
                  <Select value={qrCode} onValueChange={setQrCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select QR Code" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableQRs.map((qr) => (
                        <SelectItem key={qr} value={qr}>{qr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="Enter QR Code" value={qrCode} onChange={(e) => setQrCode(e.target.value)} />
                )}
              </div>
              <Button className="w-full bg-gradient-primary" onClick={handleQRNavigation}>
                <Target className="mr-2 h-4 w-4" />
                Navigate to QR
              </Button>
            </div>
          </StatusCard>

          <StatusCard title="Charging Station" icon={Battery}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Charge QR Code</Label>
                <Input placeholder="CHARGE_QR_001" value={chargeQR} onChange={(e) => setChargeQR(e.target.value)} />
              </div>
              <Button className="w-full bg-gradient-primary" onClick={handleChargeNavigation}>
                <Battery className="mr-2 h-4 w-4" />
                Go to Charge Station
              </Button>
            </div>
          </StatusCard>

          <StatusCard title="Current Position" icon={Navigation2}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-primary">{position.x.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">X (m)</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-primary">{position.y.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Y (m)</div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-primary">{position.theta.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">θ (rad)</div>
              </div>
            </div>
          </StatusCard>
        </div>
      </div>

      {/* Path Planner Settings */}
      <StatusCard title="Path Planner Configuration" icon={Settings2}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Max Velocity (m/s)</Label>
            <Input type="number" defaultValue="1.0" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Acceleration Limit</Label>
            <Input type="number" defaultValue="0.5" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Safety Distance (m)</Label>
            <Input type="number" defaultValue="0.3" step="0.1" />
          </div>
          <div className="flex items-end">
            <Button className="w-full">Apply Settings</Button>
          </div>
        </div>
      </StatusCard>
    </div>
  );
}
