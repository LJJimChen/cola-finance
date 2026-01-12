/**
 * Broker adapter factory
 *
 * Intent: Create and return the appropriate broker adapter based on broker ID
 * Centralized factory for managing different broker implementations
 *
 * Contract:
 * - Accepts broker ID and returns corresponding adapter instance
 * - Throws error if broker ID is not supported
 */
import { BrokerAdapter } from './adapter.interface'
import { ExampleBrokerAdapter } from './example.adapter'
import { FutuBrokerAdapter } from './futu.adapter'

// Define supported broker IDs
export type SupportedBrokerId = 'example' | 'futu' // Add more as they're implemented

/**
 * Factory function to create broker adapters
 *
 * Input: brokerId - identifier for the broker platform
 * Output: Instance of the appropriate BrokerAdapter
 * Side effects: None
 */
export function createBrokerAdapter(brokerId: string, page: any): BrokerAdapter {
  switch (brokerId) {
    case 'example':
      return new ExampleBrokerAdapter(page)
    case 'futu':
      return new FutuBrokerAdapter(page)
    default:
      throw new Error(`Unsupported broker: ${brokerId}`)
  }
}

/**
 * Get list of supported broker IDs
 *
 * Input: None
 * Output: Array of supported broker IDs
 * Side effects: None
 */
export function getSupportedBrokers(): SupportedBrokerId[] {
  return ['example', 'futu'] // Add more as they're implemented
}