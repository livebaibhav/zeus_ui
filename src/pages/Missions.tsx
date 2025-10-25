import { useState, useEffect } from "react";
import { StatusCard } from "@/components/StatusCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListTodo, Play, Pause, SkipForward, Trash2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { rosBridgeService } from "@/services/rosbridge";
import ROSLIB from "roslib";

interface Mission {
  id: string;
  name: string;
  type: string;
  priority: number;
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  progress: number;
}

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const ros = rosBridgeService.getRos();
    if (!ros) return;

    // Subscribe to mission queue
    const missionListener = new ROSLIB.Topic({
      ros: ros,
      name: "/mission_queue",
      messageType: "std_msgs/String",
    });

    missionListener.subscribe((message: any) => {
      try {
        const missionData = JSON.parse(message.data);
        setMissions(missionData);
      } catch (e) {
        console.error("Failed to parse mission queue", e);
      }
    });

    return () => {
      missionListener.unsubscribe();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success text-success-foreground';
      case 'PENDING':
        return 'bg-warning text-warning-foreground';
      case 'PAUSED':
        return 'bg-secondary text-secondary-foreground';
      case 'COMPLETED':
        return 'bg-primary text-primary-foreground';
      case 'FAILED':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleAction = (action: string, missionId?: string) => {
    toast({
      title: `Mission ${action}`,
      description: missionId ? `Action performed on ${missionId}` : "Action performed on all missions",
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mission Management</h1>
          <p className="text-muted-foreground">Schedule and monitor robot missions</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Create Mission
        </Button>
      </div>

      {/* Mission Control Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => handleAction('Start')}>
          <Play className="mr-2 h-4 w-4" />
          Start Queue
        </Button>
        <Button variant="outline" onClick={() => handleAction('Pause')}>
          <Pause className="mr-2 h-4 w-4" />
          Pause Queue
        </Button>
        <Button variant="outline" onClick={() => handleAction('Skip')}>
          <SkipForward className="mr-2 h-4 w-4" />
          Skip Current
        </Button>
        <Button variant="destructive" onClick={() => handleAction('Clear')}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Queue
        </Button>
      </div>

      {/* Create Mission Form */}
      {showCreateForm && (
        <StatusCard title="Create New Mission" icon={Plus}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mission Name</Label>
              <Input placeholder="e.g., Warehouse A to B" />
            </div>
            <div className="space-y-2">
              <Label>Mission Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qr">QR Navigation</SelectItem>
                  <SelectItem value="graph">Graph Navigation</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Position</Label>
              <Input placeholder="e.g., Node A1" />
            </div>
            <div className="space-y-2">
              <Label>End Position</Label>
              <Input placeholder="e.g., Node B3" />
            </div>
            <div className="space-y-2">
              <Label>Priority (1-10)</Label>
              <Input type="number" min="1" max="10" placeholder="5" />
            </div>
            <div className="flex items-end gap-2">
              <Button className="flex-1 bg-gradient-primary">Create Mission</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            </div>
          </div>
        </StatusCard>
      )}

      {/* Mission Queue */}
      <StatusCard title="Mission Queue" icon={ListTodo}>
        <div className="space-y-3">
          {missions.map((mission) => (
            <div key={mission.id} className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{mission.name}</h3>
                    <p className="text-sm text-muted-foreground">{mission.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(mission.status)}>{mission.status}</Badge>
                  <Badge variant="outline">Priority {mission.priority}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{mission.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary transition-all"
                      style={{ width: `${mission.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Pause className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">Type: <span className="text-foreground">{mission.type}</span></span>
              </div>
            </div>
          ))}
        </div>
      </StatusCard>

      {/* Mission History */}
      <StatusCard title="Recent Mission History" icon={ListTodo}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Mission ID</th>
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Name</th>
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Duration</th>
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm font-mono">MISSION_000</td>
                <td className="p-3 text-sm">Charging Station Return</td>
                <td className="p-3 text-sm">5m 23s</td>
                <td className="p-3 text-sm">
                  <Badge className="bg-success text-success-foreground">COMPLETED</Badge>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm font-mono">MISSION_999</td>
                <td className="p-3 text-sm">Station A Pickup</td>
                <td className="p-3 text-sm">12m 45s</td>
                <td className="p-3 text-sm">
                  <Badge className="bg-success text-success-foreground">COMPLETED</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </StatusCard>
    </div>
  );
}
