import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  value: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  strokeWidth?: number;
  className?: string;
  color?: string;
  bgColor?: string;
}

export function ProgressCircle({
  value,
  size = "md",
  showLabel = true,
  label,
  strokeWidth,
  className,
  color = "currentColor",
  bgColor = "hsl(var(--neutral-200))",
}: ProgressCircleProps) {
  // Ensure value is between 0 and 100
  const percentage = Math.min(100, Math.max(0, value));
  
  // Define circle dimensions based on size
  const dimensions = {
    sm: { width: 48, height: 48, fontSize: "text-sm", stroke: strokeWidth || 4 },
    md: { width: 80, height: 80, fontSize: "text-base", stroke: strokeWidth || 6 },
    lg: { width: 160, height: 160, fontSize: "text-3xl", stroke: strokeWidth || 10 }
  };
  
  const { width, height, fontSize, stroke } = dimensions[size];
  
  // Calculate SVG parameters
  const radius = (Math.min(width, height) / 2) - (stroke / 2);
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;
  
  // Center coordinates
  const cx = width / 2;
  const cy = height / 2;

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg width={width} height={height} className={className}>
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="transparent"
          stroke={bgColor}
          strokeWidth={stroke}
          className="dark:text-neutral-700"
        />
        
        {/* Progress circle */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="origin-center -rotate-90"
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-medium", fontSize)}>
            {label || `${Math.round(percentage)}%`}
          </span>
          {size === "lg" && label && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Complete</span>
          )}
        </div>
      )}
    </div>
  );
}
