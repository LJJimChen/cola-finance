import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface DriftIndicatorProps {
  drift: number; // Difference between current and target allocation (current - target)
  className?: string;
}

export const DriftIndicator: React.FC<DriftIndicatorProps> = ({ 
  drift, 
  className 
}) => {
  // Determine the appearance based on the drift value
  let variant: "default" | "secondary" | "destructive" | "outline" | null = "default";
  let icon = null;
  let label = "";
  let value = Math.abs(drift).toFixed(2);

  if (drift > 0.5) {
    // Current allocation is significantly higher than target
    variant = "destructive";
    icon = <TrendingUp className="h-4 w-4 mr-1" />;
    label = "Overweight";
  } else if (drift < -0.5) {
    // Current allocation is significantly lower than target
    variant = "destructive";
    icon = <TrendingDown className="h-4 w-4 mr-1" />;
    label = "Underweight";
  } else {
    // Allocation is close to target
    variant = "secondary";
    icon = <Minus className="h-4 w-4 mr-1" />;
    label = "On Target";
  }

  return (
    <Badge variant={variant} className={className}>
      <span className="flex items-center">
        {icon}
        <span>
          {label} ({drift >= 0 ? '+' : ''}{drift.toFixed(2)}%)
        </span>
      </span>
    </Badge>
  );
};

export default DriftIndicator;