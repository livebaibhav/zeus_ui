import { StatusCard } from "@/components/StatusCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Workflow, Send, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { rosBridgeService } from "@/services/rosbridge";
import ROSLIB from "roslib";

export default function VDA5050() {
  const [vdaStatus, setVdaStatus] = useState("Connected");
  const [orderData, setOrderData] = useState({
    orderId: "ORDER_2025_001",
    orderUpdateId: 3,
    timestamp: new Date().toISOString(),
    version: "2.0",
    manufacturer: "Zeus Robotics",
    serialNumber: "AGV-001",
  });
  const [nodes, setNodes] = useState([
    { nodeId: "NODE_A1", sequenceId: 0, released: true, actions: ["startCharging"] },
    { nodeId: "NODE_B3", sequenceId: 1, released: true, actions: ["pickup"] },
    { nodeId: "NODE_C5", sequenceId: 2, released: false, actions: ["dropoff"] },
  ]);

  useEffect(() => {
    const ros = rosBridgeService.getRos();
    if (!ros) return;

    // Subscribe to VDA5050 status
    const statusListener = new ROSLIB.Topic({
      ros: ros,
      name: "/vda5050/status",
      messageType: "std_msgs/String",
    });

    statusListener.subscribe((message: any) => {
      try {
        const data = JSON.parse(message.data);
        setVdaStatus(data.connectionState || "Connected");
      } catch (e) {
        console.error("Failed to parse VDA5050 status", e);
      }
    });

    // Subscribe to VDA5050 orders
    const orderListener = new ROSLIB.Topic({
      ros: ros,
      name: "/vda5050/order",
      messageType: "std_msgs/String",
    });

    orderListener.subscribe((message: any) => {
      try {
        const order = JSON.parse(message.data);
        setOrderData(order);
        if (order.nodes) {
          setNodes(order.nodes);
        }
      } catch (e) {
        console.error("Failed to parse VDA5050 order", e);
      }
    });

    return () => {
      statusListener.unsubscribe();
      orderListener.unsubscribe();
    };
  }, []);

  const handleSendAction = () => {
    toast({
      title: "Instant Action Sent",
      description: "VDA5050 instant action has been transmitted",
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">VDA5050 Interface</h1>
        <p className="text-muted-foreground">Fleet management protocol interface</p>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard title="VDA5050 Status" icon={Workflow}>
          <div className="text-center">
            <Badge className={vdaStatus === "Connected" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>{vdaStatus}</Badge>
            <div className="text-sm text-muted-foreground">Protocol v{orderData.version}</div>
          </div>
        </StatusCard>

        <StatusCard title="Last Order" icon={Workflow}>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-primary mb-1">{orderData.orderId}</div>
            <div className="text-xs text-muted-foreground">Update ID: {orderData.orderUpdateId}</div>
          </div>
        </StatusCard>

        <StatusCard title="Order Status" icon={Workflow}>
          <div className="text-center">
            <Badge className="bg-primary text-primary-foreground mb-2">ACTIVE</Badge>
            <div className="text-sm text-muted-foreground">Executing</div>
          </div>
        </StatusCard>
      </div>

      {/* Current Order Details */}
      <StatusCard title="Current Order Details" icon={Workflow}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Order ID</div>
              <div className="font-mono text-sm font-semibold text-foreground">{orderData.orderId}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Update ID</div>
              <div className="font-mono text-sm font-semibold text-foreground">{orderData.orderUpdateId}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Timestamp</div>
              <div className="font-mono text-xs text-foreground">{orderData.timestamp}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Version</div>
              <div className="font-mono text-sm font-semibold text-foreground">{orderData.version}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Manufacturer</div>
              <div className="text-sm font-semibold text-foreground">{orderData.manufacturer}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Serial Number</div>
              <div className="font-mono text-sm font-semibold text-foreground">{orderData.serialNumber}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">Node Sequence</h4>
            <div className="space-y-2">
              {nodes.map((node, index) => (
                <div key={node.nodeId} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-mono text-sm font-semibold text-foreground">{node.nodeId}</div>
                      <div className="text-xs text-muted-foreground">Sequence: {node.sequenceId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">
                      Actions: <span className="text-foreground font-semibold">{node.actions.join(", ")}</span>
                    </div>
                    <Badge className={node.released ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                      {node.released ? "Released" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </StatusCard>

      {/* Instant Actions */}
      <StatusCard title="Instant Actions" icon={Send}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send immediate VDA5050 actions to the robot for urgent commands
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" onClick={handleSendAction}>
              <Send className="mr-2 h-4 w-4" />
              Emergency Stop
            </Button>
            <Button variant="outline" onClick={handleSendAction}>
              <Send className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button variant="outline" onClick={handleSendAction}>
              <Send className="mr-2 h-4 w-4" />
              Resume
            </Button>
            <Button variant="outline" onClick={handleSendAction}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Cancel Order
            </Button>
          </div>
        </div>
      </StatusCard>

      {/* Order JSON Viewer */}
      <StatusCard title="Order JSON" icon={Workflow}>
        <div className="bg-background/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
          <pre className="text-foreground">
{`{
  "headerId": 1,
  "timestamp": "${orderData.timestamp}",
  "version": "${orderData.version}",
  "manufacturer": "${orderData.manufacturer}",
  "serialNumber": "${orderData.serialNumber}",
  "orderId": "${orderData.orderId}",
  "orderUpdateId": ${orderData.orderUpdateId},
  "nodes": [
    {
      "nodeId": "NODE_A1",
      "sequenceId": 0,
      "released": true,
      "actions": [
        {
          "actionType": "startCharging",
          "actionId": "charging_001",
          "blockingType": "HARD"
        }
      ]
    },
    {
      "nodeId": "NODE_B3",
      "sequenceId": 1,
      "released": true,
      "actions": [
        {
          "actionType": "pickup",
          "actionId": "pickup_001",
          "blockingType": "HARD"
        }
      ]
    }
  ],
  "edges": [
    {
      "edgeId": "EDGE_A1_B3",
      "sequenceId": 0,
      "startNodeId": "NODE_A1",
      "endNodeId": "NODE_B3",
      "released": true
    }
  ]
}`}
          </pre>
        </div>
      </StatusCard>
    </div>
  );
}
