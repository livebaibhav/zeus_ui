import { useState } from "react";
import { VirtualJoystick } from "@/components/VirtualJoystick";
import { KeyboardControl } from "@/components/KeyboardControl";
import { StatusCard } from "@/components/StatusCard";
import { rosBridgeService } from "@/services/rosbridge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Keyboard, RotateCw, MoveUp, Home, Lock, Unlock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ManualControl() {
  const ros = rosBridgeService.getRos();
  const [controlMode, setControlMode] = useState<'joystick' | 'keyboard'>('joystick');
  const [brakeEngaged, setBrakeEngaged] = useState(false);

  const handlePresetAction = (action: string, params: any) => {
    toast({
      title: "Action Executed",
      description: `Executing ${action} with parameters: ${JSON.stringify(params)}`,
    });
  };

  const toggleBrake = () => {
    setBrakeEngaged(!brakeEngaged);
    toast({
      title: brakeEngaged ? "Brake Released" : "Brake Engaged",
      description: brakeEngaged ? "Robot can now move" : "Robot movement locked",
      variant: brakeEngaged ? "default" : "destructive",
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Manual Control</h1>
        <p className="text-muted-foreground">Direct teleoperation interface</p>
      </div>

      {/* Control Mode Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">Control Mode:</span>
        <div className="flex gap-2">
          <Button
            variant={controlMode === 'joystick' ? 'default' : 'outline'}
            onClick={() => setControlMode('joystick')}
            className={controlMode === 'joystick' ? 'bg-gradient-primary' : ''}
          >
            <Gamepad2 className="mr-2 h-4 w-4" />
            Joystick
          </Button>
          <Button
            variant={controlMode === 'keyboard' ? 'default' : 'outline'}
            onClick={() => setControlMode('keyboard')}
            className={controlMode === 'keyboard' ? 'bg-gradient-primary' : ''}
          >
            <Keyboard className="mr-2 h-4 w-4" />
            Keyboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Virtual Joystick */}
        {controlMode === 'joystick' && (
          <div className="lg:col-span-1">
            <VirtualJoystick ros={ros} />
          </div>
        )}

        {/* Keyboard Control */}
        {controlMode === 'keyboard' && (
          <div className="lg:col-span-1">
            <KeyboardControl ros={ros} />
          </div>
        )}

        {/* Preset Actions */}
        <StatusCard title="Preset Actions" icon={RotateCw} className="lg:col-span-1">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => handlePresetAction('rotate', { angle: 90 })}
            >
              <RotateCw className="h-6 w-6 text-primary" />
              <span className="text-sm">Rotate 90° CW</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => handlePresetAction('rotate', { angle: -90 })}
            >
              <RotateCw className="h-6 w-6 text-primary transform scale-x-[-1]" />
              <span className="text-sm">Rotate 90° CCW</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => handlePresetAction('move', { distance: 1.0 })}
            >
              <MoveUp className="h-6 w-6 text-primary" />
              <span className="text-sm">Move 1m Forward</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => handlePresetAction('home', { x: 0, y: 0, theta: 0 })}
            >
              <Home className="h-6 w-6 text-primary" />
              <span className="text-sm">Return Home</span>
            </Button>
          </div>
        </StatusCard>

        {/* Hardware Control */}
        <StatusCard title="Hardware Control" icon={Lock} className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Brake Control */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Brake System</h4>
              <Button
                variant={brakeEngaged ? "destructive" : "default"}
                className="w-full"
                onClick={toggleBrake}
              >
                {brakeEngaged ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                {brakeEngaged ? "Release Brake" : "Engage Brake"}
              </Button>
              <Badge
                variant={brakeEngaged ? "destructive" : "outline"}
                className="w-full justify-center"
              >
                {brakeEngaged ? "LOCKED" : "UNLOCKED"}
              </Badge>
            </div>

            {/* Lift Control */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Lift Control</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handlePresetAction('lift', { action: 'up' })}>
                  ↑ Up
                </Button>
                <Button variant="outline" onClick={() => handlePresetAction('lift', { action: 'down' })}>
                  ↓ Down
                </Button>
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Position: <span className="font-semibold text-foreground">Mid</span>
              </div>
            </div>

            {/* Power Control */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Power Management</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={() => handlePresetAction('power', { action: 'reboot' })}>
                  Reboot System
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => handlePresetAction('power', { action: 'shutdown' })}>
                  Power Off
                </Button>
              </div>
            </div>
          </div>
        </StatusCard>
      </div>

      {/* Safety Notice */}
      <div className="bg-warning/10 border border-warning rounded-lg p-4">
        <p className="text-sm text-foreground flex items-center gap-2">
          <span className="text-warning text-lg">⚠</span>
          <strong>Safety Notice:</strong> Manual control requires constant attention. Release all inputs to stop the robot. Emergency stop button is always available in the header.
        </p>
      </div>
    </div>
  );
}
