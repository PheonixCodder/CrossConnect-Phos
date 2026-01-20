export type ChannelStatus = 'success' | 'warning' | 'error';

export interface ChannelMetrics {
  grossSales: number;
  netSales: number;
  orders: number;
  unitsSold: number;
  avgOrderValue: number;
  contribution: number;
  trend: number;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  status: ChannelStatus;
  lastSync: Date;
  metrics: ChannelMetrics;
}

export interface Alert {
  id: string;
  type: 'inventory' | 'sales' | 'sync' | 'fulfillment';
  severity: ChannelStatus;
  title: string;
  description: string;
  channel: string;
  timestamp: Date;
  actionable: boolean;
}

export interface InventoryItem {
  sku: string;
  name: string;
  available: number;
  daysOnHand: number;
  status: ChannelStatus;
  channels: string[];
}

export const channels: Channel[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    logo: '/images/amazon.svg',
    status: 'success',
    lastSync: new Date(Date.now() - 120000),
    metrics: {
      grossSales: 284500,
      netSales: 256050,
      orders: 1847,
      unitsSold: 3294,
      avgOrderValue: 154.01,
      contribution: 42.3,
      trend: 12.4,
    },
  },
  {
    id: 'warehance',
    name: 'Warehance',
    logo: '/images/warehance.svg',
    status: 'warning',
    lastSync: new Date(Date.now() - 300000),
    metrics: {
      grossSales: 98200,
      netSales: 88380,
      orders: 892,
      unitsSold: 1456,
      avgOrderValue: 110.09,
      contribution: 14.6,
      trend: 45.2,
    },
  },
  {
    id: 'walmart',
    name: 'Walmart',
    logo: '/images/walmart.svg',
    status: 'success',
    lastSync: new Date(Date.now() - 60000),
    metrics: {
      grossSales: 156800,
      netSales: 141120,
      orders: 1123,
      unitsSold: 2089,
      avgOrderValue: 139.63,
      contribution: 23.3,
      trend: 8.7,
    },
  },
  {
    id: 'target',
    name: 'Target',
    logo: '/images/target.png',
    status: 'error',
    lastSync: new Date(Date.now() - 900000),
    metrics: {
      grossSales: 67400,
      netSales: 60660,
      orders: 456,
      unitsSold: 789,
      avgOrderValue: 147.81,
      contribution: 10.0,
      trend: -5.3,
    },
  },
  {
    id: 'faire',
    name: 'Faire',
    logo: '/images/faire.svg',
    status: 'success',
    lastSync: new Date(Date.now() - 180000),
    metrics: {
      grossSales: 43200,
      netSales: 38880,
      orders: 89,
      unitsSold: 567,
      avgOrderValue: 485.39,
      contribution: 6.4,
      trend: 22.1,
    },
  },
  {
    id: 'shopify',
    name: 'Shopify',
    logo: '/images/shopify.svg',
    status: 'success',
    lastSync: new Date(Date.now() - 45000),
    metrics: {
      grossSales: 22800,
      netSales: 20520,
      orders: 234,
      unitsSold: 398,
      avgOrderValue: 97.44,
      contribution: 3.4,
      trend: 15.8,
    },
  },
];

export const alerts: Alert[] = [
  {
    id: '1',
    type: 'sync',
    severity: 'error',
    title: 'API Sync Failed',
    description: 'Target API connection timed out. Last successful sync was 15 minutes ago.',
    channel: 'Target',
    timestamp: new Date(Date.now() - 900000),
    actionable: true,
  },
  {
    id: '2',
    type: 'inventory',
    severity: 'warning',
    title: 'Low Stock Alert',
    description: 'SKU-2847 "Premium Widget Pro" has only 12 units remaining across all channels.',
    channel: 'All Channels',
    timestamp: new Date(Date.now() - 1800000),
    actionable: true,
  },
  {
    id: '3',
    type: 'sales',
    severity: 'warning',
    title: 'Unusual Sales Spike',
    description: 'Warehance sales increased 340% in the last 2 hours. Verify inventory allocation.',
    channel: 'Warehance',
    timestamp: new Date(Date.now() - 3600000),
    actionable: true,
  },
  {
    id: '4',
    type: 'fulfillment',
    severity: 'warning',
    title: 'Delayed Orders',
    description: '23 orders from Amazon are pending fulfillment for more than 24 hours.',
    channel: 'Amazon',
    timestamp: new Date(Date.now() - 7200000),
    actionable: true,
  },
];

export const inventoryItems: InventoryItem[] = [
  { sku: 'SKU-1001', name: 'Premium Widget', available: 1247, daysOnHand: 45, status: 'success', channels: ['amazon', 'walmart', 'shopify'] },
  { sku: 'SKU-2847', name: 'Premium Widget Pro', available: 12, daysOnHand: 2, status: 'error', channels: ['amazon', 'warehance', 'target'] },
  { sku: 'SKU-3921', name: 'Basic Widget', available: 89, daysOnHand: 8, status: 'warning', channels: ['amazon', 'walmart', 'faire'] },
  { sku: 'SKU-4102', name: 'Widget Deluxe', available: 567, daysOnHand: 28, status: 'success', channels: ['amazon', 'shopify'] },
  { sku: 'SKU-5543', name: 'Widget Mini', available: 2341, daysOnHand: 67, status: 'success', channels: ['warehance', 'target', 'faire'] },
];

export const timeRanges = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Custom', value: 'custom' },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function getTotalMetrics() {
  return channels.reduce(
    (acc, channel) => ({
      grossSales: acc.grossSales + channel.metrics.grossSales,
      netSales: acc.netSales + channel.metrics.netSales,
      orders: acc.orders + channel.metrics.orders,
      unitsSold: acc.unitsSold + channel.metrics.unitsSold,
    }),
    { grossSales: 0, netSales: 0, orders: 0, unitsSold: 0 }
  );
}
