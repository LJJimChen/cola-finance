import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface VerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  verificationUrl: string;
  onVerificationComplete: () => void;
}

export const VerificationDialog: React.FC<VerificationDialogProps> = ({
  isOpen,
  onClose,
  verificationUrl,
  onVerificationComplete
}) => {
  const handleOpenVerification = () => {
    window.open(verificationUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verification Required</DialogTitle>
          <DialogDescription>
            Your broker requires additional verification to complete the connection.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="mb-4">
            Please complete the verification process in a new browser tab.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <p className="text-sm font-medium text-blue-800">Verification URL:</p>
            <a 
              href={verificationUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all flex items-center mt-1"
            >
              {verificationUrl}
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </div>
          
          <p className="text-sm text-gray-600">
            After completing verification in the broker's website, return here and click "Continue".
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleOpenVerification}
            className="flex-1"
          >
            Open Verification Page
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <Button 
            onClick={onVerificationComplete}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDialog;