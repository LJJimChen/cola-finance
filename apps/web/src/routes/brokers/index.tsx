import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Broker } from 'schema/dist/entities/broker';
import { useBrokers } from '@/hooks/use-brokers';

export const BrokersListPage: React.FC = () => {
  const navigate = useNavigate();
  const { brokers, isLoading, error } = useBrokers();
  const [connectingBroker, setConnectingBroker] = useState<string | null>(null);

  const handleConnect = (brokerId: string) => {
    setConnectingBroker(brokerId);
    // Navigate to the broker connection flow
    navigate({ to: `/brokers/connect/$${brokerId}` });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">Error loading brokers: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Connect Your Brokers</h1>
        <p className="text-gray-600 mb-8">
          Connect your investment accounts to view your portfolio in one place
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brokers?.map((broker: Broker) => (
            <Card key={broker.id} className="overflow-hidden transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <img 
                    src={broker.logo_url} 
                    alt={broker.name} 
                    className="w-10 h-10 rounded-md object-contain"
                  />
                  <div>
                    <CardTitle className="text-lg">{broker.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {broker.name_zh}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant={broker.supported ? "default" : "secondary"}>
                    {broker.supported ? "Supported" : "Coming Soon"}
                  </Badge>
                  <Button 
                    onClick={() => handleConnect(broker.id)}
                    disabled={!broker.supported || connectingBroker === broker.id}
                  >
                    {connectingBroker === broker.id ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
                
                {broker.requires_verification && (
                  <div className="mt-3 text-xs text-yellow-600">
                    Note: This broker requires manual verification
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {(!brokers || brokers.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">No brokers available at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokersListPage;