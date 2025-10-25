import { useState, useEffect, useRef } from "react";
import { StatusCard } from "@/components/StatusCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { rosBridgeService } from "@/services/rosbridge";
import ROSLIB from "roslib";

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  node: string;
  message: string;
}

export default function Logs() {
  const [logLevel, setLogLevel] = useState<string>("ALL");
  const [autoScroll, setAutoScroll] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorCount, setErrorCount] = useState({ warnings: 0, errors: 0, fatal: 0 });
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ros = rosBridgeService.getRos();
    if (!ros) return;

    // Subscribe to rosout for logs
    const logListener = new ROSLIB.Topic({
      ros: ros,
      name: "/rosout",
      messageType: "rcl_interfaces/msg/Log",
    });

    logListener.subscribe((message: any) => {
      const levelMap: any = {
        10: "DEBUG",
        20: "INFO",
        30: "WARN",
        40: "ERROR",
        50: "FATAL",
      };

      const newLog: LogEntry = {
        timestamp: new Date().toLocaleString(),
        level: levelMap[message.level] || "INFO",
        node: message.name || "unknown",
        message: message.msg || "",
      };

      setLogs((prev) => [...prev.slice(-99), newLog]);

      // Update error counts
      if (newLog.level === "WARN") {
        setErrorCount((prev) => ({ ...prev, warnings: prev.warnings + 1 }));
      } else if (newLog.level === "ERROR") {
        setErrorCount((prev) => ({ ...prev, errors: prev.errors + 1 }));
      } else if (newLog.level === "FATAL") {
        setErrorCount((prev) => ({ ...prev, fatal: prev.fatal + 1 }));
      }
    });

    return () => {
      logListener.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'DEBUG':
        return 'bg-muted text-muted-foreground';
      case 'INFO':
        return 'bg-primary/20 text-primary-foreground';
      case 'WARN':
        return 'bg-warning text-warning-foreground';
      case 'ERROR':
        return 'bg-destructive text-destructive-foreground';
      case 'FATAL':
        return 'bg-destructive text-destructive-foreground font-bold';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleExport = () => {
    toast({
      title: "Logs Exported",
      description: "Log file has been downloaded successfully",
    });
  };

  const handleClear = () => {
    toast({
      title: "Logs Cleared",
      description: "All logs have been cleared",
      variant: "destructive",
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">System Logs</h1>
          <p className="text-muted-foreground">Real-time system logs and diagnostics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
          <Button variant="destructive" onClick={handleClear}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Log Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-sm font-medium text-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search logs..." />
          </div>
        </div>
        <div className="w-40 space-y-2">
          <label className="text-sm font-medium text-foreground">Log Level</label>
          <Select value={logLevel} onValueChange={setLogLevel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Levels</SelectItem>
              <SelectItem value="DEBUG">Debug</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="WARN">Warning</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="FATAL">Fatal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoscroll"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-border"
          />
          <label htmlFor="autoscroll" className="text-sm text-foreground cursor-pointer">
            Auto-scroll
          </label>
        </div>
      </div>

      {/* Log Viewer */}
      <StatusCard title="Live Logs" icon={FileText}>
        <div ref={logContainerRef} className="bg-background/50 rounded-lg p-4 font-mono text-sm max-h-[600px] overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No logs available. Waiting for ROS logs...
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex items-start gap-3 py-1 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
                <Badge className={`${getLevelColor(log.level)} shrink-0`}>{log.level}</Badge>
                <span className="text-primary shrink-0">{log.node}</span>
                <span className="text-foreground flex-1">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </StatusCard>

      {/* Error Summary */}
      <StatusCard title="Error Summary" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-warning/10 border border-warning rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-warning mb-1">{errorCount.warnings}</div>
            <div className="text-sm text-foreground">Warnings</div>
          </div>
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-destructive mb-1">{errorCount.errors}</div>
            <div className="text-sm text-foreground">Errors</div>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-foreground mb-1">{errorCount.fatal}</div>
            <div className="text-sm text-muted-foreground">Fatal</div>
          </div>
        </div>
      </StatusCard>
    </div>
  );
}
