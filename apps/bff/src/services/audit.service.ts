/**
 * Audit logging service
 *
 * Intent: Track security-sensitive operations for compliance and monitoring
 * Logs include authorization attempts, connection revocations, and other sensitive actions
 *
 * Contract:
 * - All security-sensitive operations must be logged
 * - Logs include user context, action, timestamp, and outcome
 * - Logs are stored durably and accessible for compliance audits
 */

import { Env } from '../types/env';
import { BFFLogger } from '../lib/logger';

export interface AuditLog {
  id: string;
  userId: string;
  action: string; // 'authorization_attempt', 'connection_revocation', 'login', 'logout', etc.
  resourceType: string; // 'broker_connection', 'user_profile', etc.
  resourceId?: string;
  ip: string;
  userAgent: string;
  outcome: 'success' | 'failure';
  timestamp: string;
  details?: Record<string, any>; // Additional context-specific details
}

export interface AuditContext {
  userId: string;
  ip: string;
  userAgent: string;
}

export class AuditService {
  private logger: BFFLogger;

  constructor(env: Env) {
    // Initialize logger with KV namespace for persistent storage
    // In a real implementation, this would use the actual KV namespace
    this.logger = new BFFLogger(env.AUDIT_LOGS_KV);
  }

  /**
   * Log an authorization attempt
   */
  async logAuthorizationAttempt(context: AuditContext, brokerId: string, outcome: 'success' | 'failure', details?: Record<string, any>): Promise<void> {
    const logEntry: AuditLog = {
      id: crypto.randomUUID(), // In a real implementation, this would use the appropriate UUID function
      userId: context.userId,
      action: 'authorization_attempt',
      resourceType: 'broker_connection',
      resourceId: brokerId,
      ip: context.ip,
      userAgent: context.userAgent,
      outcome,
      timestamp: new Date().toISOString(),
      details: {
        brokerId,
        ...details
      }
    };

    await this.writeLog(logEntry);
  }

  /**
   * Log a connection revocation
   */
  async logConnectionRevocation(context: AuditContext, connectionId: string, details?: Record<string, any>): Promise<void> {
    const logEntry: AuditLog = {
      id: crypto.randomUUID(),
      userId: context.userId,
      action: 'connection_revocation',
      resourceType: 'broker_connection',
      resourceId: connectionId,
      ip: context.ip,
      userAgent: context.userAgent,
      outcome: 'success', // Revocation is typically successful if logged
      timestamp: new Date().toISOString(),
      details
    };

    await this.writeLog(logEntry);
  }

  /**
   * Log a login event
   */
  async logLogin(context: AuditContext, outcome: 'success' | 'failure', details?: Record<string, any>): Promise<void> {
    const logEntry: AuditLog = {
      id: crypto.randomUUID(),
      userId: context.userId,
      action: 'login',
      resourceType: 'user_session',
      ip: context.ip,
      userAgent: context.userAgent,
      outcome,
      timestamp: new Date().toISOString(),
      details
    };

    await this.writeLog(logEntry);
  }

  /**
   * Log a logout event
   */
  async logLogout(context: AuditContext, details?: Record<string, any>): Promise<void> {
    const logEntry: AuditLog = {
      id: crypto.randomUUID(),
      userId: context.userId,
      action: 'logout',
      resourceType: 'user_session',
      ip: context.ip,
      userAgent: context.userAgent,
      outcome: 'success',
      timestamp: new Date().toISOString(),
      details
    };

    await this.writeLog(logEntry);
  }

  /**
   * Log a sensitive operation
   */
  async logSensitiveOperation(context: AuditContext, operation: string, resourceType: string, resourceId?: string, outcome: 'success' | 'failure', details?: Record<string, any>): Promise<void> {
    const logEntry: AuditLog = {
      id: crypto.randomUUID(),
      userId: context.userId,
      action: operation,
      resourceType,
      resourceId,
      ip: context.ip,
      userAgent: context.userAgent,
      outcome,
      timestamp: new Date().toISOString(),
      details
    };

    await this.writeLog(logEntry);
  }

  /**
   * Write log entry to persistent storage
   */
  private async writeLog(logEntry: AuditLog): Promise<void> {
    // In a real implementation, this would store the log in a durable way
    // For example, using Cloudflare Workers KV, a database, or a dedicated logging service
    
    // For now, we'll log to the structured logger
    await this.logger.info(
      'audit',
      logEntry.action,
      `Audit log: ${logEntry.action} for user ${logEntry.userId}`,
      {
        userId: logEntry.userId,
        action: logEntry.action,
        resourceType: logEntry.resourceType,
        resourceId: logEntry.resourceId,
        outcome: logEntry.outcome,
        ip: logEntry.ip,
        ...logEntry.details
      },
      logEntry.userId
    );

    // In a real implementation, we would also store in KV or database:
    /*
    await this.env.AUDIT_LOGS_KV.put(
      `audit:${logEntry.timestamp}:${logEntry.id}`,
      JSON.stringify(logEntry),
      { expirationTtl: 60 * 60 * 24 * 90 } // Keep for 90 days
    );
    */
  }

  /**
   * Retrieve audit logs for a user (for compliance purposes)
   */
  async getUserAuditLogs(userId: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]> {
    // In a real implementation, this would query the audit log storage
    // For now, returning an empty array
    console.log(`Retrieving audit logs for user: ${userId}`);
    return [];
  }

  /**
   * Retrieve audit logs for a specific action type
   */
  async getAuditLogsByAction(action: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]> {
    // In a real implementation, this would query the audit log storage
    // For now, returning an empty array
    console.log(`Retrieving audit logs for action: ${action}`);
    return [];
  }
}