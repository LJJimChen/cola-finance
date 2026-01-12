import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Trash2 } from 'lucide-react'
import { useBrokerOperations } from '@/hooks/use-brokers'

type Connection = {
  id: string
  status: 'active' | 'expired' | 'revoked' | 'failed'
  authorized_at: string
  expires_at: string | null
  last_refresh_at: string | null
  last_error_message: string | null
  broker: {
    name: string
    name_zh: string
  }
}

export const MyConnectionsPage: React.FC = () => {
  const { connections, isLoadingConnections, errorConnections, refreshConnection, revokeConnection } =
    useBrokerOperations()

  if (isLoadingConnections) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (errorConnections) {
    const message =
      errorConnections instanceof Error ? errorConnections.message : String(errorConnections)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">Error loading connections: {message}</span>
        </div>
      </div>
    )
  }

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'expired':
        return 'bg-yellow-500';
      case 'revoked':
        return 'bg-gray-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  const list = (connections ?? []) as Connection[]

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">My Broker Connections</h1>
        <p className="text-gray-600 mb-8">
          Manage your connected broker accounts
        </p>

        {list.length > 0 ? (
          <div className="space-y-6">
            {list.map((connection) => (
              <Card key={connection.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl">{connection.broker.name}</CardTitle>
                    <CardDescription>{connection.broker.name_zh}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getConnectionStatusColor(connection.status)} text-white`}>
                      {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      <p>Connected: {new Date(connection.authorized_at).toLocaleDateString()}</p>
                      {connection.last_refresh_at && (
                        <p>Last refreshed: {new Date(connection.last_refresh_at).toLocaleString()}</p>
                      )}
                      {connection.expires_at && (
                        <p>Expires: {new Date(connection.expires_at).toLocaleString()}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshConnection(connection.id)}
                        disabled={connection.status !== 'active'}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeConnection(connection.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                  
                  {connection.last_error_message && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">
                        <span className="font-medium">Last error:</span> {connection.last_error_message}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-8 text-center">
              <p className="text-gray-600">You do not have any broker connections yet.</p>
              <Button className="mt-4" onClick={() => (window.location.href = '/brokers')}>
                Connect a Broker
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default MyConnectionsPage
