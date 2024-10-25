"use client";

import * as React from "react";
import { Check, ChevronsUpDown, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Station } from "@/lib/dataset-types";
import { NycSubwayIcon } from "./nyc-subway-icon";

interface StationSelectorProps {
  values?: Station[];
  value?: string | null;
  onChange?: (value: string | null) => void;
}

function getKeyFromStation(station: Station) {
  return `${station.stop_name} - ${station.daytime_routes}`;
}

function getRoutesFromStation(station?: Station) {
  if (!station) return [];
  return station.daytime_routes.split(/[\s,]+/);
}

export default function StationSelector({
  value,
  values,
  onChange,
}: StationSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const selected = values?.find((v) => v.station_id === value);
  const selectedRoutes = getRoutesFromStation(selected);

  const handleClear = () => {
    onChange?.(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {selected ? (
            <div className="flex flex-row">
              <span className="font-bold mr-2 max-w-[80px] text-ellipsis overflow-hidden  whitespace-nowrap">
                {selected.stop_name}
              </span>
              <div className="flex flex-row gap-x-1 max-w-[60px]">
                {selectedRoutes?.map((route) => (
                  <NycSubwayIcon
                    key={route}
                    route={route}
                    height={20}
                    width={20}
                  />
                ))}
              </div>
            </div>
          ) : (
            "Select station..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search stations..." />
          <CommandEmpty>No stations found.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {selected && (
              <>
                <CommandItem
                  onSelect={handleClear}
                  className="flex flex-row cursor-pointer"
                >
                  <XIcon className="h-4 mr-2 cursor-pointer text-slate-700" />
                  Clear
                </CommandItem>
              </>
            )}
            {values?.map((station) => (
              <CommandItem
                key={station.station_id}
                value={getKeyFromStation(station)}
                onSelect={() => {
                  onChange?.(station.station_id);
                  setOpen(false);
                }}
              >
                <div className="flex flex-row items-center">
                  <div className="font-bold ml-2 mr-2">{station.stop_name}</div>
                  {getRoutesFromStation(station).map((route) => (
                    <NycSubwayIcon
                      key={route}
                      route={route}
                      height={15}
                      width={15}
                    />
                  ))}
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === station.station_id ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
