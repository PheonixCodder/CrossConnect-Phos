// Define the available tabs in the Settings view
export type SettingsTab = "profile" | "organizations";

export interface SettingsTabConfig {
  value: SettingsTab;
  label: string;
  icon: string; // lucide icon name
}