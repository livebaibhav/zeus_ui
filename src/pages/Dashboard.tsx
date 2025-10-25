import { useEffect, useState } from "react";
import { StatusCard } from "@/components/StatusCard";
import { GaugeWidget } from "@/components/GaugeWidget";
import { Activity, Battery, Navigation, Gauge, Radio, Cpu } from "lucide-react";
import { rosBridgeService } from "@/services/rosbridge";
import ROSLIB from "roslib";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [robotState, setRobotState] = useState("IDLE");
  const [batteryData, setBatteryData] = useState({
    percentage: 85,
    voltage: 48.2,
    current: 2.5,
    temperature: 28,
    charging: false,
  });
  const [position, setPosition] = useState({ x: 0, y: 0, theta: 0 });
  const [velocity, setVelocity] = useState({ linear: 0, angular: 0 });
  const [missionStatus, setMissionStatus] = useState({
    id: "MISSION_001",
    progress: 75,
    state: "ACTIVE",
  });
  const [systemHealth, setSystemHealth] = useState({
    motors: "OK",
    lidar: "OK",
    network: "OK",
    cpu: 45,
  });

  useEffect(() => {
    const ros = rosBridgeService.getRos();
    if (!ros) return;

    // Subscribe to battery data
    const batteryListener = new ROSLIB.Topic({
      ros: ros,
      name: "/battery_data",
      messageType: "sensor_msgs/BatteryState",
    });

    batteryListener.subscribe((message: any) => {
      setBatteryData({
        percentage: (message.percentage * 100),
        voltage: message.voltage,
        current: message.current,
        temperature: message.temperature,
        charging: message.power_supply_status === 1,
      });
    });

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

    // Subscribe to robot state
    const stateListener = new ROSLIB.Topic({
      ros: ros,
      name: "/robot_state",
      messageType: "std_msgs/String",
    });

    stateListener.subscribe((message: any) => {
      setRobotState(message.data);
    });

    // Subscribe to velocity
    const velocityListener = new ROSLIB.Topic({
      ros: ros,
      name: "/cmd_vel",
      messageType: "geometry_msgs/Twist",
    });

    velocityListener.subscribe((message: any) => {
      setVelocity({
        linear: message.linear.x,
        angular: message.angular.z,
      });
    });

    // Subscribe to mission status
    const missionListener = new ROSLIB.Topic({
      ros: ros,
      name: "/mission_status",
      messageType: "std_msgs/String",
    });

    missionListener.subscribe((message: any) => {
      try {
        const data = JSON.parse(message.data);
        setMissionStatus(data);
      } catch (e) {
        console.error("Failed to parse mission status", e);
      }
    });

    // Subscribe to diagnostics
    const diagnosticsListener = new ROSLIB.Topic({
      ros: ros,
      name: "/diagnostics",
      messageType: "diagnostic_msgs/DiagnosticArray",
    });

    diagnosticsListener.subscribe((message: any) => {
      const health: any = { motors: "OK", lidar: "OK", network: "OK", cpu: 45 };
      message.status.forEach((status: any) => {
        if (status.name.includes("motor")) {
          health.motors = status.level === 0 ? "OK" : "ERROR";
        } else if (status.name.includes("lidar")) {
          health.lidar = status.level === 0 ? "OK" : "ERROR";
        } else if (status.name.includes("network")) {
          health.network = status.level === 0 ? "OK" : "ERROR";
        } else if (status.name.includes("cpu")) {
          health.cpu = parseInt(status.message) || 45;
        }
      });
      setSystemHealth(health);
    });

    return () => {
      batteryListener.unsubscribe();
      poseListener.unsubscribe();
      stateListener.unsubscribe();
      velocityListener.unsubscribe();
      missionListener.unsubscribe();
      diagnosticsListener.unsubscribe();
    };
  }, []);

  const getStateColor = (state: string) => {
    switch (state) {
      case "IDLE":
        return "bg-muted text-muted-foreground";
      case "MOVING":
        return "bg-primary text-primary-foreground";
      case "CHARGING":
        return "bg-warning text-warning-foreground";
      case "ERROR":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Robot Dashboard</h1>
        <p className="text-muted-foreground">Real-time monitoring and control</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Robot Status Card */}
        <StatusCard title="Robot Status" icon={Activity}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">State</span>
              <Badge className={getStateColor(robotState)}>{robotState}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Robot ID</span>
              <span className="font-mono text-sm">AGV-001</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uptime</span>
              <span className="text-sm font-semibold">12h 34m</span>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary w-3/4"></div>
              </div>
              <span className="text-xs text-muted-foreground">Operational</span>
            </div>
          </div>
        </StatusCard>

        {/* Battery Status Card */}
        <StatusCard title="Battery Status" icon={Battery}>
          <div className="flex flex-col items-center">
            <GaugeWidget
              value={batteryData.percentage}
              max={100}
              label="Battery Level"
              unit="%"
              color={
                batteryData.percentage > 50
                  ? "success"
                  : batteryData.percentage > 20
                  ? "warning"
                  : "destructive"
              }
            />
            <div className="w-full mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voltage</span>
                <span className="font-semibold">{batteryData.voltage.toFixed(1)}V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current</span>
                <span className="font-semibold">{batteryData.current.toFixed(1)}A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temperature</span>
                <span className="font-semibold">{batteryData.temperature}°C</span>
              </div>
              {batteryData.charging && (
                <Badge className="w-full justify-center bg-warning text-warning-foreground">
                  🔌 Charging
                </Badge>
              )}
            </div>
          </div>
        </StatusCard>

        {/* Position Card */}
        <StatusCard title="Position & Orientation" icon={Navigation}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-primary">{position.x.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">X (m)</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-primary">{position.y.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Y (m)</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-primary">{position.theta.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">θ (rad)</div>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Frame</span>
                <span className="font-mono">map</span>
              </div>
            </div>
          </div>
        </StatusCard>

        {/* Velocity Card */}
        <StatusCard title="Velocity" icon={Gauge}>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Linear</span>
                <span className="text-lg font-bold text-primary">{velocity.linear.toFixed(2)} m/s</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all"
                  style={{ width: `${Math.abs(velocity.linear) * 50}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Angular</span>
                <span className="text-lg font-bold text-secondary">{velocity.angular.toFixed(2)} rad/s</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary transition-all"
                  style={{ width: `${Math.abs(velocity.angular) * 50}%` }}
                ></div>
              </div>
            </div>
          </div>
        </StatusCard>

        {/* Mission Status Card */}
        <StatusCard title="Current Mission" icon={Radio}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mission ID</span>
              <span className="font-mono text-sm">{missionStatus.id}</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-lg font-bold text-primary">{missionStatus.progress}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all animate-pulse-glow"
                  style={{ width: `${missionStatus.progress}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">State</span>
              <Badge className="bg-success text-success-foreground">{missionStatus.state}</Badge>
            </div>
          </div>
        </StatusCard>

        {/* System Health Card */}
        <StatusCard title="System Health" icon={Cpu}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Motors</span>
              <Badge className="bg-success text-success-foreground">{systemHealth.motors}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">LiDAR</span>
              <Badge className="bg-success text-success-foreground">{systemHealth.lidar}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <Badge className="bg-success text-success-foreground">{systemHealth.network}</Badge>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CPU Usage</span>
                <span className="text-lg font-bold text-primary">{systemHealth.cpu}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${systemHealth.cpu}%` }}
                ></div>
              </div>
            </div>
          </div>
        </StatusCard>
      </div>
    </div>
  );
}
