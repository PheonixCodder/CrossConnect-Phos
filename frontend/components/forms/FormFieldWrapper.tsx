import React from "react";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

interface FormFieldWrapperProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

export function FormFieldWrapper({
  label,
  description,
  error,
  required,
  children,
  className,
  labelClassName,
  descriptionClassName,
}: FormFieldWrapperProps) {
  return (
    <FormItem className={cn("space-y-2", className)}>
      {label && (
        <FormLabel className={labelClassName}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FormLabel>
      )}
      <FormControl>{children}</FormControl>
      {description && (
        <FormDescription className={descriptionClassName}>
          {description}
        </FormDescription>
      )}
      {error && (
        <FormMessage className="text-destructive text-sm">
          {error}
        </FormMessage>
      )}
    </FormItem>
  );
}

// Also create a simplified version without Form dependencies
interface FieldWrapperProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export function FieldWrapper({
  label,
  description,
  error,
  required,
  children,
  className,
  htmlFor,
}: FieldWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}