import { useEffect, useRef } from "react";
import ROSLIB from "roslib";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

interface KeyboardControlProps {
  ros: ROSLIB.Ros | null;
}

export function KeyboardControl({ ros }: KeyboardControlProps) {
  const cmdVelPubRef = useRef<ROSLIB.Topic | null>(null);
  const activeKeysRef = useRef<Set<string>>(new Set());
  const publishIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (ros) {
      cmdVelPubRef.current = new ROSLIB.Topic({
        ros: ros,
        name: "/cmd_vel",
        messageType: "geometry_msgs/Twist",
      });
    }
    return () => {
      if (cmdVelPubRef.current) {
        cmdVelPubRef.current.unadvertise();
      }
    };
  }, [ros]);

  const publishVelocity = (linear: number, angular: number) => {
    if (!cmdVelPubRef.current) return;

    const twist = new ROSLIB.Message({
      linear: { x: linear, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angular },
    });
    cmdVelPubRef.current.publish(twist);
  };

  const calculateVelocity = () => {
    let linear = 0;
    let angular = 0;

    if (activeKeysRef.current.has('w')) linear += 1.0;
    if (activeKeysRef.current.has('s')) linear -= 1.0;
    if (activeKeysRef.current.has('a')) angular += 1.0;
    if (activeKeysRef.current.has('d')) angular -= 1.0;

    return { linear, angular };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd', ' '].includes(key)) {
        e.preventDefault();
        
        if (key === ' ') {
          // Emergency stop
          activeKeysRef.current.clear();
          publishVelocity(0, 0);
          return;
        }

        activeKeysRef.current.add(key);

        // Start continuous publishing if not already started
        if (!publishIntervalRef.current) {
          publishIntervalRef.current = window.setInterval(() => {
            const { linear, angular } = calculateVelocity();
            publishVelocity(linear, angular);
          }, 100); // Publish at 10Hz
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd'].includes(key)) {
        e.preventDefault();
        activeKeysRef.current.delete(key);

        // If no keys are pressed, stop publishing and send zero velocity
        if (activeKeysRef.current.size === 0) {
          if (publishIntervalRef.current) {
            clearInterval(publishIntervalRef.current);
            publishIntervalRef.current = null;
          }
          publishVelocity(0, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (publishIntervalRef.current) {
        clearInterval(publishIntervalRef.current);
      }
      publishVelocity(0, 0);
    };
  }, []);

  return (
    <Card className="p-6 bg-gradient-surface shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Keyboard className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Keyboard Controls</h3>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <kbd className="px-2 py-1 bg-card border border-border rounded text-sm font-mono">W</kbd>
            <p className="text-xs text-muted-foreground mt-1">Forward</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <kbd className="px-2 py-1 bg-card border border-border rounded text-sm font-mono">S</kbd>
            <p className="text-xs text-muted-foreground mt-1">Backward</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <kbd className="px-2 py-1 bg-card border border-border rounded text-sm font-mono">A</kbd>
            <p className="text-xs text-muted-foreground mt-1">Rotate Left</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <kbd className="px-2 py-1 bg-card border border-border rounded text-sm font-mono">D</kbd>
            <p className="text-xs text-muted-foreground mt-1">Rotate Right</p>
          </div>
        </div>
        <div className="pt-2 border-t border-border">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <kbd className="px-3 py-1 bg-card border border-border rounded text-sm font-mono">SPACE</kbd>
            <p className="text-xs text-muted-foreground mt-1">Emergency Stop</p>
          </div>
        </div>
        <Badge className="w-full justify-center bg-warning/20 text-foreground border-warning">
          Hold keys to maintain movement
        </Badge>
      </div>
    </Card>
  );
}
