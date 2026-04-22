/**
 * Cost Optimizer Component
 * Single responsibility: Cost optimization and resource management
 * Follows atomic design principles with focused functionality
 */

import { ConnectionManager } from '../core/connection-manager';

export interface CostOptimizationConfig {
  enableSpotInstances: boolean;
  enableAutoscaling: boolean;
  enableScheduledScaling: boolean;
  enableResourceTagging: boolean;
  enableCostAllocationTags: boolean;
  budgetAlerts: boolean;
  costThresholds: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface ResourceMetrics {
  resourceId: string;
  resourceType: string;
  utilization: number;
  cost: number;
  region: string;
  tags: Record<string, string>;
}

export interface CostRecommendation {
  type: 'spot_instance' | 'right_sizing' | 'scheduling' | 'reserved_instances';
  resourceId: string;
  currentCost: number;
  projectedSavings: number;
  confidence: number;
  implementation: string;
}

export class CostOptimizer {
  constructor(
    private connectionManager: ConnectionManager,
    private config: CostOptimizationConfig
  ) {}

  async analyzeResourceCosts(): Promise<ResourceMetrics[]> {
    const query = `
      SELECT 
        resource_id,
        resource_type,
        utilization_rate as utilization,
        daily_cost as cost,
        region,
        tags
      FROM resource_metrics 
      WHERE DATE(created_at) = CURRENT_DATE
      ORDER BY cost DESC
    `;
    
    const result = await this.connectionManager.executeQuery(query);
    return result.rows;
  }

  async generateCostRecommendations(): Promise<CostRecommendation[]> {
    const recommendations: CostRecommendation[] = [];
    const resources = await this.analyzeResourceCosts();
    
    for (const resource of resources) {
      // Spot instance recommendations
      if (this.config.enableSpotInstances && this.shouldUseSpotInstance(resource)) {
        recommendations.push({
          type: 'spot_instance',
          resourceId: resource.resourceId,
          currentCost: resource.cost,
          projectedSavings: resource.cost * 0.7, // 70% savings with spot
          confidence: 0.8,
          implementation: 'Replace with spot instance, implement fallback strategy'
        });
      }
      
      // Right sizing recommendations
      const rightSizingRecommendation = this.generateRightSizingRecommendation(resource);
      if (rightSizingRecommendation) {
        recommendations.push(rightSizingRecommendation);
      }
      
      // Scheduling recommendations
      if (this.config.enableScheduledScaling && this.shouldScheduleResource(resource)) {
        recommendations.push({
          type: 'scheduling',
          resourceId: resource.resourceId,
          currentCost: resource.cost,
          projectedSavings: resource.cost * 0.5, // 50% savings with scheduling
          confidence: 0.9,
          implementation: 'Schedule resource to run only during business hours'
        });
      }
    }
    
    return recommendations.sort((a, b) => b.projectedSavings - a.projectedSavings);
  }

  async implementSpotInstanceReplacement(resourceId: string): Promise<void> {
    // Create spot instance request
    const spotRequestQuery = `
      INSERT INTO spot_instance_requests 
      (resource_id, request_type, target_capacity, max_price, created_at)
      VALUES ($1, 'replace', 1, (SELECT daily_cost * 0.3 FROM resource_metrics WHERE resource_id = $2), NOW())
    `;
    
    await this.connectionManager.executeQuery(spotRequestQuery, [resourceId, resourceId]);
    
    // Log the optimization
    await this.logOptimizationAction('spot_instance_replacement', resourceId, {
      type: 'cost_optimization',
      estimated_savings: await this.calculateSpotInstanceSavings(resourceId)
    });
  }

  async configureAutoscaling(resourceId: string, config: any): Promise<void> {
    const autoscalingConfigQuery = `
      INSERT INTO autoscaling_configurations 
      (resource_id, min_capacity, max_capacity, target_utilization, scale_up_cooldown, scale_down_cooldown)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (resource_id) DO UPDATE SET
        min_capacity = EXCLUDED.min_capacity,
        max_capacity = EXCLUDED.max_capacity,
        target_utilization = EXCLUDED.target_utilization,
        scale_up_cooldown = EXCLUDED.scale_up_cooldown,
        scale_down_cooldown = EXCLUDED.scale_down_cooldown
    `;
    
    await this.connectionManager.executeQuery(autoscalingConfigQuery, [
      resourceId,
      config.minCapacity,
      config.maxCapacity,
      config.targetUtilization,
      config.scaleUpCooldown,
      config.scaleDownCooldown
    ]);
    
    await this.logOptimizationAction('autoscaling_configuration', resourceId, config);
  }

  async setupScheduledScaling(resourceId: string, schedule: any): Promise<void> {
    const scheduleQuery = `
      INSERT INTO scheduled_scaling 
      (resource_id, schedule_type, start_time, end_time, days_of_week, timezone, min_capacity, max_capacity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (resource_id, schedule_type) DO UPDATE SET
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        days_of_week = EXCLUDED.days_of_week,
        timezone = EXCLUDED.timezone,
        min_capacity = EXCLUDED.min_capacity,
        max_capacity = EXCLUDED.max_capacity
    `;
    
    await this.connectionManager.executeQuery(scheduleQuery, [
      resourceId,
      schedule.type,
      schedule.startTime,
      schedule.endTime,
      JSON.stringify(schedule.daysOfWeek),
      schedule.timezone,
      schedule.minCapacity,
      schedule.maxCapacity
    ]);
    
    await this.logOptimizationAction('scheduled_scaling_setup', resourceId, schedule);
  }

  async enableBudgetAlerts(budgetConfig: any): Promise<void> {
    const budgetQuery = `
      INSERT INTO budget_alerts 
      (budget_name, amount, period, threshold_types, notification_emails, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (budget_name) DO UPDATE SET
        amount = EXCLUDED.amount,
        period = EXCLUDED.period,
        threshold_types = EXCLUDED.threshold_types,
        notification_emails = EXCLUDED.notification_emails
    `;
    
    await this.connectionManager.executeQuery(budgetQuery, [
      budgetConfig.name,
      budgetConfig.amount,
      budgetConfig.period,
      JSON.stringify(budgetConfig.thresholdTypes),
      JSON.stringify(budgetConfig.notificationEmails)
    ]);
  }

  async getCostTrends(timeframe: 'daily' | 'weekly' | 'monthly'): Promise<any[]> {
    const timeMapping = {
      daily: 'DATE(created_at)',
      weekly: 'DATE_TRUNC(\'week\', created_at)',
      monthly: 'DATE_TRUNC(\'month\', created_at)'
    };
    
    const query = `
      SELECT 
        ${timeMapping[timeframe]} as period,
        SUM(cost) as total_cost,
        COUNT(*) as resource_count,
        AVG(utilization_rate) as avg_utilization
      FROM resource_metrics 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY ${timeMapping[timeframe]}
      ORDER BY period DESC
    `;
    
    const result = await this.connectionManager.executeQuery(query);
    return result.rows;
  }

  async getResourceEfficiencyReport(): Promise<any> {
    const query = `
      SELECT 
        resource_type,
        COUNT(*) as count,
        AVG(utilization_rate) as avg_utilization,
        SUM(daily_cost) as total_cost,
        AVG(daily_cost) as avg_cost_per_resource
      FROM resource_metrics 
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY resource_type
      ORDER BY total_cost DESC
    `;
    
    const result = await this.connectionManager.executeQuery(query);
    return result.rows;
  }

  // Private helper methods
  private shouldUseSpotInstance(resource: ResourceMetrics): boolean {
    return (
      resource.resourceType.includes('compute') &&
      resource.utilization < 80 &&
      resource.tags['environment'] === 'production' &&
      !resource.tags['mission_critical']
    );
  }

  private generateRightSizingRecommendation(resource: ResourceMetrics): CostRecommendation | null {
    if (resource.utilization < 30) {
      const recommendedSize = this.calculateRecommendedSize(resource.utilization);
      const projectedSavings = resource.cost * 0.4; // 40% savings with right sizing
      
      return {
        type: 'right_sizing',
        resourceId: resource.resourceId,
        currentCost: resource.cost,
        projectedSavings,
        confidence: 0.7,
        implementation: `Downsize from current to ${recommendedSize} instance type`
      };
    }
    
    return null;
  }

  private shouldScheduleResource(resource: ResourceMetrics): boolean {
    return (
      resource.resourceType.includes('compute') &&
      resource.tags['workload_type'] === 'batch' &&
      resource.utilization < 50
    );
  }

  private calculateSpotInstanceSavings(resourceId: string): Promise<number> {
    const query = 'SELECT daily_cost * 0.7 as savings FROM resource_metrics WHERE resource_id = $1';
    const result = this.connectionManager.executeQuery(query, [resourceId]);
    return result.then((r: any) => r.rows[0]?.savings || 0);
  }

  private calculateRecommendedSize(currentUtilization: number): string {
    if (currentUtilization < 10) return 'micro';
    if (currentUtilization < 20) return 'small';
    if (currentUtilization < 30) return 'medium';
    return 'current';
  }

  private async logOptimizationAction(action: string, resourceId: string, metadata: any): Promise<void> {
    const query = `
      INSERT INTO optimization_actions 
      (action_type, resource_id, metadata, created_at, status)
      VALUES ($1, $2, $3, NOW(), 'completed')
    `;
    
    await this.connectionManager.executeQuery(query, [
      action,
      resourceId,
      JSON.stringify(metadata)
    ]);
  }
}
