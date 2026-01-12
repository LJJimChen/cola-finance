import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { useTaskPolling } from '@/hooks/use-task-polling';
import { useBrokers } from '@/hooks/use-brokers';
import { VerificationDialog } from './verification-dialog';

interface BrokerConnectionFlowProps {
  brokerId: string;
}

export const BrokerConnectionFlow: React.FC<BrokerConnectionFlowProps> = ({ brokerId }) => {
  const navigate = useNavigate();
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  
  const { connectBroker } = useBrokers();
  const { task, startPolling, stopPolling, reset } = useTaskPolling();

  // Start the connection process
  useEffect(() => {
    const initiateConnection = async () => {
      if (!taskId) {
        setIsConnecting(true);
        try {
          const result = await connectBroker(brokerId);
          setTaskId(result.taskId);
          startPolling(result.taskId);
        } catch (error) {
          console.error('Failed to initiate broker connection:', error);
          setIsConnecting(false);
        }
      }
    };

    initiateConnection();

    // Cleanup on unmount
    return () => {
      stopPolling();
      reset();
    };
  }, [brokerId, taskId, connectBroker, startPolling, stopPolling, reset]);

  // Handle task status changes
  useEffect(() => {
    if (task) {
      if (task.status === 'completed') {
        stopPolling();
        // Navigate to connections page after a short delay
        setTimeout(() => {
          navigate({ to: '/connections' });
        }, 2000);
      } else if (task.status === 'failed' || task.status === 'expired') {
        stopPolling();
        setIsConnecting(false);
      } else if (task.status === 'paused' && task.verification_url) {
        setVerificationUrl(task.verification_url);
        setShowVerificationDialog(true);
      }
    }
  }, [task, stopPolling, navigate]);

  const getStatusMessage = () => {
    if (!task) return 'Initializing connection...';
    
    switch (task.status) {
      case 'pending':
        return 'Setting up authorization...';
      case 'in_progress':
        return 'Connecting to broker...';
      case 'paused':
        return 'Verification required...';
      case 'completed':
        return 'Connection successful!';
      case 'failed':
        return 'Connection failed.';
      case 'expired':
        return 'Connection expired.';
      default:
        return 'Processing...';
    }
  };

  const getStatusIcon = () => {
    if (!task) return <Clock className="h-5 w-5 text-gray-500" />;
    
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getProgressValue = () => {
    if (!task) return 20;
    
    switch (task.status) {
      case 'pending':
        return 20;
      case 'in_progress':
        return 50;
      case 'paused':
        return 70;
      case 'completed':
        return 100;
      case 'failed':
      case 'expired':
        return 100;
      default:
        return 20;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Broker Connection</CardTitle>
          <CardDescription>Connecting to your broker account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">{getStatusMessage()}</span>
            {getStatusIcon()}
          </div>
          
          <Progress value={getProgressValue()} className="w-full" />
          
          {task && task.status === 'completed' && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Successfully connected to your broker account!
              </AlertDescription>
            </Alert>
          )}
          
          {task && (task.status === 'failed' || task.status === 'expired') && (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                {task.error_message || 'Connection failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
          
          {isConnecting && !task && (
            <div className="mt-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2">Initializing connection...</p>
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => navigate({ to: '/brokers' })}
              disabled={task?.status === 'in_progress' || task?.status === 'pending'}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {showVerificationDialog && verificationUrl && (
        <VerificationDialog
          isOpen={showVerificationDialog}
          onClose={() => setShowVerificationDialog(false)}
          verificationUrl={verificationUrl}
          onVerificationComplete={() => {
            // After verification, continue polling
            setShowVerificationDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default BrokerConnectionFlow;