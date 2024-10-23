import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface InfoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltipContent: React.ReactNode;
}

export default function InfoButton({
  tooltipContent,
  ...props
}: InfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTooltip = () => setIsOpen(!isOpen);

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full p-0"
            onClick={toggleTooltip}
            {...props}
          >
            <Info className="h-4 w-4" />
            <span className="sr-only">Info</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px]">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
