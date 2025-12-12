export interface InventoryItem {
  id: string;
  name: string;
  genericName: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  expiryDate: string; // ISO date string YYYY-MM-DD
  minStockLevel: number;
  batchNumber: string;
  manufacturer: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'SALE';
  quantity: number;
  date: string; // ISO string
  notes?: string;
  totalPrice?: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  POS = 'POS',
  AI_ASSISTANT = 'AI_ASSISTANT',
  TRANSACTIONS = 'TRANSACTIONS'
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}