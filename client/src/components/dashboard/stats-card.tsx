import { Card } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: number;
  progress?: number;
  progressColor?: string;
  icon?: React.ReactNode;
}

export function StatsCard({
  title,
  value,
  change,
  progress,
  progressColor = "bg-primary",
  icon,
}: StatsCardProps) {
  const changeIsPositive = change && change > 0;
  const changeIsNegative = change && change < 0;
  
  return (
    <Card className="p-4 flex flex-col items-center text-center">
      <div className="mb-1 text-neutral-500 text-sm">{title}</div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {(changeIsPositive || changeIsNegative) && (
          <span className={cn(
            "text-sm mb-0.5 flex items-center",
            changeIsPositive ? "text-green-500" : "text-red-500"
          )}>
            {changeIsPositive ? (
              <ArrowUp className="h-3 w-3 mr-0.5" />
            ) : (
              <ArrowDown className="h-3 w-3 mr-0.5" />
            )}
            {Math.abs(change)}
          </span>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-2 dark:bg-neutral-700">
          <div 
            className={cn("h-1.5 rounded-full", progressColor)} 
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
      )}
    </Card>
  );
}
