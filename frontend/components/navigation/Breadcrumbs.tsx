"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

export function Breadcrumbs({
  items,
  className,
  separator = <ChevronRight className="w-4 h-4" />,
}: BreadcrumbsProps) {
  return (
    <nav
      className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
      aria-label="Breadcrumb"
    >
      <Link
        href="/dashboard"
        className="hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={item.label}>
            {separator}
            {isLast ? (
              <span className="font-medium text-foreground">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}