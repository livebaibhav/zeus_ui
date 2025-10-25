import { useRef, useEffect, useState, useCallback } from "react";
import ROSLIB from "roslib";
import { Card } from "@/components/ui/card";

interface VirtualJoystickProps {
  ros: ROSLIB.Ros | null;
}

export function VirtualJoystick({ ros }: VirtualJoystickProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const cmdVelPubRef = useRef<ROSLIB.Topic | null>(null);

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

  const publishVelocity = useCallback(
    (linear: number, angular: number) => {
      if (!cmdVelPubRef.current) return;

      const twist = new ROSLIB.Message({
        linear: { x: linear, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: angular },
      });
      cmdVelPubRef.current.publish(twist);
    },
    []
  );

  const drawJoystick = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const centerX = 150;
    const centerY = 150;

    // Get computed CSS variable values
    const styles = getComputedStyle(document.documentElement);
    const primaryColor = `hsl(${styles.getPropertyValue('--primary').trim()})`;
    const secondaryColor = `hsl(${styles.getPropertyValue('--secondary').trim()})`;
    const borderColor = `hsl(${styles.getPropertyValue('--border').trim()})`;
    const mutedColor = `hsl(${styles.getPropertyValue('--muted').trim()})`;
    const cardColor = `hsl(${styles.getPropertyValue('--card').trim()})`;

    // Clear canvas
    ctx.clearRect(0, 0, 300, 300);

    // Draw background
    ctx.fillStyle = cardColor;
    ctx.fillRect(0, 0, 300, 300);

    // Draw base circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 100, 0, 2 * Math.PI);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw crosshair
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 100);
    ctx.lineTo(centerX, centerY + 100);
    ctx.moveTo(centerX - 100, centerY);
    ctx.lineTo(centerX + 100, centerY);
    ctx.strokeStyle = mutedColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw stick
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);
    
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawJoystick(ctx, 150, 150);

    const handleMove = (event: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      }

      let x = clientX - rect.left;
      let y = clientY - rect.top;

      // Constrain to circle
      const dx = x - 150;
      const dy = y - 150;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 100) {
        const angle = Math.atan2(dy, dx);
        x = 150 + Math.cos(angle) * 100;
        y = 150 + Math.sin(angle) * 100;
      }

      // Calculate velocity (inverted Y for natural control)
      const linear = -(y - 150) / 100;
      const angular = -(x - 150) / 100;

      drawJoystick(ctx, x, y);
      publishVelocity(linear, angular);
    };

    const handleStart = () => setIsDragging(true);
    
    const handleEnd = () => {
      setIsDragging(false);
      drawJoystick(ctx, 150, 150);
      publishVelocity(0, 0);
    };

    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("mouseleave", handleEnd);
    canvas.addEventListener("mousemove", handleMove);
    
    canvas.addEventListener("touchstart", handleStart);
    canvas.addEventListener("touchend", handleEnd);
    canvas.addEventListener("touchmove", handleMove);

    return () => {
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("mouseleave", handleEnd);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchend", handleEnd);
      canvas.removeEventListener("touchmove", handleMove);
    };
  }, [isDragging, drawJoystick, publishVelocity]);

  return (
    <Card className="p-6 bg-gradient-surface shadow-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Virtual Joystick</h3>
      <canvas
        ref={canvasRef}
        width="300"
        height="300"
        className="border border-border rounded-lg cursor-pointer touch-none"
      />
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Click and drag to control robot • Forward/Back: ↕ • Left/Right: ↔
      </p>
    </Card>
  );
}
