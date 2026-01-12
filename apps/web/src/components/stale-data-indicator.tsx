import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info } from 'lucide-react';

interface StaleDataIndicatorProps {
  isStale?: boolean;
  staleAgeHours?: number;
  className?: string;
}

export const StaleDataIndicator: React.FC<StaleDataIndicatorProps> = ({
  isStale = false,
  staleAgeHours,
  className
}) => {
  if (!isStale) {
    return null;
  }

  let variant: "default" | "secondary" | "destructive" | "outline" | null = "default";
  let message = "Data is stale";
  let icon = <Info className="h-3 w-3" />;

  if (staleAgeHours && staleAgeHours > 48) {
    variant = "destructive";
    message = `Data >${Math.floor(staleAgeHours)}h old`;
    icon = <AlertTriangle className="h-3 w-3" />;
  } else if (staleAgeHours && staleAgeHours > 24) {
    variant = "secondary";
    message = `Data ${Math.floor(staleAgeHours)}h old`;
    icon = <AlertTriangle className="h-3 w-3" />;
  }

  return (
    <Badge variant={variant} className={`text-xs px-2 py-1 ${className}`}>
      <span className="flex items-center">
        {icon}
        <span className="ml-1">{message}</span>
      </span>
    </Badge>
  );
};

export default StaleDataIndicator;