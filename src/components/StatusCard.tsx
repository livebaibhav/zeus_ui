import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatusCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function StatusCard({ title, icon: Icon, children, className = "" }: StatusCardProps) {
  return (
    <Card className={`bg-gradient-surface shadow-card border-border/50 hover:border-primary/50 transition-all ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
