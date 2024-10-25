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
import { NycSubwayIcon } from "./nyc-subway-icon";
import { Separator } from "@radix-ui/react-separator";

const routes = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "A",
  "C",
  "E",
  "B",
  "D",
  "F",
  "M",
  "G",
  "J",
  "Z",
  "L",
  "N",
  "Q",
  "R",
  "W",
  "SIR",
];

function createKeyFromRouteGroup(group: string[]) {
  return group.map((route) => route.toLocaleLowerCase()).join(",");
}

const routeGroups = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7"],
  ["A", "C", "E"],
  ["B", "D", "F", "M"],
  ["G"],
  ["J", "Z"],
  ["L"],
  ["N", "Q", "R", "W"],
  ["SIR"],
];

const routeGroupsKey = routeGroups.map(createKeyFromRouteGroup);

interface RouteSelectorProps {
  value: string | null;
  onChange?: (value: string | null) => void;
  groupRoutes?: boolean;
}

export default function RouteSelector({
  value,
  onChange,
  groupRoutes,
}: RouteSelectorProps) {
  const [open, setOpen] = React.useState(false);
  let selected = null;
  if (groupRoutes) {
    selected = routeGroupsKey.find((group) => group === value);
  } else {
    selected = routes.find((route) => route === value?.toUpperCase());
  }

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
          className="w-[150px] justify-between"
        >
          {selected ? (
            groupRoutes ? (
              <div className="flex flex-row gap-x-1">
                {routeGroups
                  .find((group) => createKeyFromRouteGroup(group) === value)
                  ?.map((route) => (
                    <NycSubwayIcon
                      key={route}
                      route={route}
                      width={20}
                      height={20}
                    />
                  ))}
              </div>
            ) : (
              <NycSubwayIcon route={selected} width={20} height={20} />
            )
          ) : (
            "Select route..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandInput placeholder="Search routes..." />
          <CommandEmpty>No routes found.</CommandEmpty>
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
            {groupRoutes &&
              routeGroups.map((group) => (
                <CommandItem
                  key={createKeyFromRouteGroup(group)}
                  value={createKeyFromRouteGroup(group)}
                  onSelect={(currentValue) => {
                    onChange?.(currentValue);
                    setOpen(false);
                  }}
                >
                  {group.map((route) => (
                    <NycSubwayIcon
                      key={route}
                      route={route}
                      width={15}
                      height={15}
                    />
                  ))}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === createKeyFromRouteGroup(group)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            {!groupRoutes &&
              routes.map((route) => (
                <CommandItem
                  key={route}
                  value={route}
                  onSelect={(currentValue) => {
                    onChange?.(currentValue);
                    setOpen(false);
                  }}
                >
                  <NycSubwayIcon route={route} width={15} height={15} />
                  <div className="font-bold ml-2">{route}</div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === route ? "opacity-100" : "opacity-0",
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
