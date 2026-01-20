"use client";

import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code } from "lucide-react";

interface PayloadViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: unknown;
  title: string;
}

export function PayloadViewerDialog({
  open,
  onOpenChange,
  payload,
  title,
}: PayloadViewerDialogProps) {
  return (
    <ResponsiveDialog
      title="Event Payload"
      description={`Viewing data for: ${title}`}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Code className="h-4 w-4" />
        <span>Raw JSON Data</span>
      </div>
      <ScrollArea className="h-[500px] w-full rounded-md border bg-muted/50 p-4">
        <pre className="text-xs font-mono text-foreground">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </ScrollArea>
    </ResponsiveDialog>
  );
}