import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DynamicScrollAreaProps {
  scrollable?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function DynamicScrollArea({
  scrollable = false,
  className,
  children,
}: DynamicScrollAreaProps) {
  if (scrollable) {
    return <ScrollArea className={cn(className)}>{children}</ScrollArea>;
  }

  return <div className={className}>{children}</div>;
}
