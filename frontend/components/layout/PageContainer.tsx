import { cn } from "@/lib/utils";
import React from "react";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

const maxWidthClasses = {
  sm: "max-w-4xl",
  md: "max-w-6xl",
  lg: "max-w-7xl",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full"
};

const paddingClasses = {
  none: "",
  sm: "px-4 sm:px-6",
  md: "px-4 sm:px-6 lg:px-8",
  lg: "px-4 sm:px-6 lg:px-8 xl:px-12"
};

export function PageContainer({
  children,
  className,
  maxWidth = "xl",
  padding = "md",
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}