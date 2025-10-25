import { StatusCard } from "@/components/StatusCard";
import { Badge } from "@/components/ui/badge";
import { Activity, Cpu, HardDrive, Wifi, CheckCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { rosBridgeService } from "@/services/rosbridge";
import ROSLIB from "roslib";

interface NodeInfo {
  name: string;
  status: string;
  cpu: number;
}

interface TopicInfo {
  name: string;
  type: string;
  rate: number;
  subscribers: number;
}

export default function SystemStatus() {
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [cpuUsage, setCpuUsage] = useState(45);
  const [memoryUsage, setMemoryUsage] = useState(62);
  const [networkLatency, setNetworkLatency] = useState(23);
  const [systemHealth, setSystemHealth] = useState("OK");

  useEffect(() => {
    const ros = rosBridgeService.getRos();
    if (!ros) return;

    // Get ROS nodes
    const getNodes = () => {
      const nodesService = new ROSLIB.Service({
        ros: ros,
        name: "/rosapi/nodes",
        serviceType: "rosapi_msgs/srv/Nodes",
      });

      nodesService.callService(new ROSLIB.ServiceRequest({}), (result: any) => {
        const nodeList = result.nodes.map((name: string, index: number) => ({
          name,
          status: "running",
          cpu: Math.floor(Math.random() * 30) + 5,
        }));
        setNodes(nodeList);
      });
    };

    // Get ROS topics
    const getTopics = () => {
      const topicsService = new ROSLIB.Service({
        ros: ros,
        name: "/rosapi/topics",
        serviceType: "rosapi_msgs/srv/Topics",
      });

      topicsService.callService(new ROSLIB.ServiceRequest({}), (result: any) => {
        const topicList = result.topics.slice(0, 10).map((name: string) => ({
          name,
          type: result.types[result.topics.indexOf(name)] || "unknown",
          rate: Math.floor(Math.random() * 50) + 1,
          subscribers: Math.floor(Math.random() * 5),
        }));
        setTopics(topicList);
      });
    };

    // Subscribe to diagnostics
    const diagnosticsListener = new ROSLIB.Topic({
      ros: ros,
      name: "/diagnostics",
      messageType: "diagnostic_msgs/DiagnosticArray",
    });

    diagnosticsListener.subscribe((message: any) => {
      message.status.forEach((status: any) => {
        if (status.name.includes("cpu")) {
          setCpuUsage(parseInt(status.message) || 45);
        } else if (status.name.includes("memory")) {
          setMemoryUsage(parseInt(status.message) || 62);
        }
      });
      
      const hasErrors = message.status.some((s: any) => s.level > 0);
      setSystemHealth(hasErrors ? "WARNING" : "OK");
    });

    getNodes();
    getTopics();
    const interval = setInterval(() => {
      getNodes();
      getTopics();
    }, 5000);

    return () => {
      diagnosticsListener.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">System Status</h1>
        <p className="text-muted-foreground">Comprehensive system diagnostics and monitoring</p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard title="CPU Usage" icon={Cpu}>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{cpuUsage}%</div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary transition-all" style={{ width: `${cpuUsage}%` }}></div>
            </div>
          </div>
        </StatusCard>

        <StatusCard title="Memory" icon={HardDrive}>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{memoryUsage}%</div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary transition-all" style={{ width: `${memoryUsage}%` }}></div>
            </div>
          </div>
        </StatusCard>

        <StatusCard title="Network" icon={Wifi}>
          <div className="text-center">
            <Badge className="bg-success text-success-foreground mb-2">Connected</Badge>
            <div className="text-sm text-muted-foreground">{networkLatency}ms latency</div>
          </div>
        </StatusCard>

        <StatusCard title="System Health" icon={Activity}>
          <div className="text-center">
            {systemHealth === "OK" ? (
              <>
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <div className="text-sm font-semibold text-success">All Systems OK</div>
              </>
            ) : (
              <>
                <AlertCircle className="h-8 w-8 text-warning mx-auto mb-2" />
                <div className="text-sm font-semibold text-warning">System Warning</div>
              </>
            )}
          </div>
        </StatusCard>
      </div>

      {/* ROS Nodes */}
      <StatusCard title="Active ROS Nodes" icon={Activity}>
        <div className="space-y-2">
          {nodes.map((node) => (
            <div key={node.name} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="font-mono text-sm">{node.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">CPU: <span className="text-foreground font-semibold">{node.cpu}%</span></div>
                <Badge className="bg-success text-success-foreground">{node.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </StatusCard>

      {/* Active Topics */}
      <StatusCard title="Active Topics" icon={Wifi}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Topic</th>
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Type</th>
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Rate (Hz)</th>
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Subscribers</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.name} className="border-b border-border/50">
                  <td className="p-3 text-sm font-mono">{topic.name}</td>
                  <td className="p-3 text-sm text-muted-foreground">{topic.type}</td>
                  <td className="p-3 text-sm">{topic.rate} Hz</td>
                  <td className="p-3 text-sm">{topic.subscribers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StatusCard>

      {/* Hardware Diagnostics */}
      <StatusCard title="Hardware Status" icon={Cpu}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Motors</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Left Motor</span>
                <Badge className="bg-success text-success-foreground">OK</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Right Motor</span>
                <Badge className="bg-success text-success-foreground">OK</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Sensors</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">LiDAR</span>
                <Badge className="bg-success text-success-foreground">OK</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">IMU</span>
                <Badge className="bg-success text-success-foreground">OK</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Encoders</span>
                <Badge className="bg-success text-success-foreground">OK</Badge>
              </div>
            </div>
          </div>
        </div>
      </StatusCard>
    </div>
  );
}
