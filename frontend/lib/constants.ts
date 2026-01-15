// lib/constants.ts

// Channel configurations
export const CHANNEL_CONFIG = {
  amazon: {
    name: "Amazon",
    color: "var(--color-amazon)",
    borderClass: "channel-border-amazon",
    icon: "/images/amazon.svg",
  },
  tiktok: {
    name: "TikTok Shop",
    color: "var(--color-tiktok)",
    borderClass: "channel-border-tiktok",
    icon: "/images/tiktok.svg",
  },
  walmart: {
    name: "Walmart",
    color: "var(--color-walmart)",
    borderClass: "channel-border-walmart",
    icon: "/images/walmart.svg",
  },
  target: {
    name: "Target",
    color: "var(--color-target)",
    borderClass: "channel-border-target",
    icon: "/images/target.png",
  },
  faire: {
    name: "Faire",
    color: "var(--color-faire)",
    borderClass: "channel-border-faire",
    icon: "/images/faire.svg",
  },
  shopify: {
    name: "Shopify",
    color: "var(--color-shopify)",
    borderClass: "channel-border-shopify",
    icon: "/images/shopify.svg",
  },
} as const;

// Status configurations
export const STATUS_CONFIG = {
  healthy: {
    label: "Healthy",
    color: "var(--color-status-healthy)",
    dotClass: "status-dot-healthy",
    bgClass: "bg-green-500/10",
  },
  warning: {
    label: "Warning",
    color: "var(--color-status-warning)",
    dotClass: "status-dot-warning",
    bgClass: "bg-yellow-500/10",
  },
  critical: {
    label: "Critical",
    color: "var(--color-status-critical)",
    dotClass: "status-dot-critical",
    bgClass: "bg-red-500/10",
  },
} as const;

// Alert type configurations
export const ALERT_CONFIG = {
  inventory: {
    label: "Inventory",
    icon: "Package",
    color: "var(--color-chart-4)",
  },
  sales: {
    label: "Sales",
    icon: "TrendingUp",
    color: "var(--color-chart-1)",
  },
  sync: {
    label: "Sync",
    icon: "WifiOff",
    color: "var(--color-chart-3)",
  },
  fulfillment: {
    label: "Fulfillment",
    icon: "AlertTriangle",
    color: "var(--color-chart-5)",
  },
} as const;

// Time ranges for filters
export const TIME_RANGES = [
  { label: "Today", value: "today", days: 1 },
  { label: "Yesterday", value: "yesterday", days: 1 },
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Custom", value: "custom", days: null },
] as const;

// Navigation items
export const NAV_ITEMS = {
  main: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: "LayoutDashboard",
    },
    {
      title: "Lifecycle",
      url: "/lifecycle",
      icon: "ListDetails",
      items: [
        {
          title: "Active Proposals",
          url: "/lifecycle/active",
        },
        {
          title: "Archived",
          url: "/lifecycle/archived",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: "ChartBar",
    },
    {
      title: "Projects",
      url: "/projects",
      icon: "Folder",
    },
    {
      title: "Team",
      url: "/team",
      icon: "Users",
    },
  ],
  secondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: "Settings",
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: "HelpCircle",
    },
    {
      title: "Documentation",
      url: "/docs",
      icon: "FileText",
    },
  ],
} as const;

// Default avatar for users
export const DEFAULT_AVATAR = "/images/default-avatar.png";

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    signin: "/api/auth/signin",
    signup: "/api/auth/signup",
    signout: "/api/auth/signout",
    callback: "/api/auth/callback",
    session: "/api/auth/session",
  },
  dashboard: {
    metrics: "/api/dashboard/metrics",
    channels: "/api/dashboard/channels",
    alerts: "/api/dashboard/alerts",
    inventory: "/api/dashboard/inventory",
  },
} as const;

// Form validation messages
export const VALIDATION_MESSAGES = {
  required: "This field is required",
  email: "Please enter a valid email address",
  passwordMin: "Password must be at least 8 characters",
  passwordMatch: "Passwords do not match",
} as const;

// Date formats
export const DATE_FORMATS = {
  short: "MMM dd, yyyy",
  medium: "MMMM dd, yyyy",
  long: "EEEE, MMMM dd, yyyy",
  time: "hh:mm a",
  datetime: "MMM dd, yyyy hh:mm a",
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;
