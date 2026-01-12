import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RotateCcw } from 'lucide-react'
import { useBrokerOperations } from '@/hooks/use-brokers'

interface PortfolioRefreshButtonProps {
  connectionId?: string;
  onRefreshStart?: () => void;
  onRefreshComplete?: () => void;
  onRefreshError?: (error: string) => void;
}

export const PortfolioRefreshButton: React.FC<PortfolioRefreshButtonProps> = ({
  connectionId,
  onRefreshStart,
  onRefreshComplete,
  onRefreshError
}) => {
  const { refreshConnection } = useBrokerOperations()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!connectionId) return;

    setIsRefreshing(true);
    onRefreshStart?.();

    try {
      await refreshConnection(connectionId)
      onRefreshComplete?.()
      setIsRefreshing(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onRefreshError?.(errorMessage);
      setIsRefreshing(false);
    }
  };

  // Determine the status and display appropriate UI
  let statusElement = null;
  let buttonText = "Refresh";
  let buttonDisabled = false;

  if (isRefreshing) {
    statusElement = (
      <Badge variant="secondary" className="ml-2">
        <span className="flex items-center">
          <span className="h-2 w-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
          Starting...
        </span>
      </Badge>
    );
    buttonText = "Starting...";
    buttonDisabled = true;
  }

  return (
    <div className="flex items-center">
      <Button
        onClick={handleRefresh}
        disabled={buttonDisabled}
        variant="outline"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
      {statusElement}
    </div>
  );
};

export default PortfolioRefreshButton;
