'use client'
import { RefreshCw, Settings, Bell } from 'lucide-react';
import { TimeRangeSelector } from './TimeRangeSelector';
import { useState } from 'react';
import { SidebarTrigger } from '../ui/sidebar';

export function DashboardHeader() {
  const [timeRange, setTimeRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
              <SidebarTrigger className="-ml-1" />

      <div className="flex items-center gap-3">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors group"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors group relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-card" />
          </button>
          
          <button
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors group"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}
