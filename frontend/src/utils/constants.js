/**
 * Application Constants
 * Unified definitions for roles and statuses to ensure consistency across all modules.
 */

export const ROLES = {
  JOB_MANAGER: 'Job Manager',
  PRODUCTION_STAFF: 'Production Staff',
  INVENTORY_MANAGER: 'Inventory Manager',
  ORDER_MANAGER: 'Order Manager',
};

export const JOB_STATUS = {
  CREATED: 'Created',
  PRODUCTION: 'Production',
  ASSEMBLY: 'Assembly',
  QC: 'QC',
  REWORK: 'Rework',
  COMPLETED: 'Completed',
};

export const PRIORITY = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const INVENTORY_STATUS = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out Of Stock',
};
