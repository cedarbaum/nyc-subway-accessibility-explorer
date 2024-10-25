"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { allRoutes, NycSubwayIcon } from "./nyc-subway-icon";

import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertTriangle, CheckIcon, ConstructionIcon } from "lucide-react";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { ElevatorIcon } from "./icons/elevator-icon";
import { EscalatorIcon } from "./icons/escalator-icon";
import {
  formatDecimalAsPercentage,
  formatNumberAsPercentage,
  formatNumberWithCommas,
} from "@/lib/number-format-utils";
import InfoButton from "./info-button";
import ExternalLink from "./external-link";
import RouteSelector from "./route-selector";
import { Station } from "@/lib/dataset-types";
import StationSelector from "./station-selector";
import EquipmentStatsTable from "./equipment-stats-table";
import { MultiSelect } from "./ui/multi-select";
import { cn } from "@/lib/utils";
import DynamicScrollArea from "./ui/dynamic-scroll-area";

export interface Layer {
  id: string;
  name: string;
  info?: JSX.Element;
}

interface MapOverlayProps {
  className?: string;
  scrollable?: boolean;
  stickyHeader?: boolean;
  layers: Layer[];
  clearAllSelections: () => void;
  enabledLayers: string[] | null;
  setEnabledLayers: (layers: string[]) => void;
  selectedRoute: string | null;
  onRouteSelect?: (route: string | null) => void;
  selectedStationId?: string | null;
  onStationSelect?: (stationId: string | null) => void;
  stations?: Station[];
  station?: {
    properties: {
      stop_name: string;
      station_id: string;
      daytime_routes: string;
      ridership_month?: string;
      ridership_last_full_month?: number;
      ada: string;
      ada_southbound: string;
      ada_northbound: string;
      ada_notes?: string | null;
      ada_projects?: {
        id: string;
        name: string;
        status: string;
        type: string;
        details?: string;
      }[];
    };
  } | null;
  routeInfo?: {
    num_stations: number;
    num_accessible_stations: number;
  } | null;
  neighborhood?: {
    properties: {
      NTAName: string;
      Borough: string;
      Pop1: number;
      Pop65t69: number;
      Pop70t74: number;
      Pop75t79: number;
      Pop80t84: number;
      Pop85pl: number;
      num_nearest_stations: number;
      num_accessible_stations: number;
      accessible_station_score: number;
    };
  } | null;
  elevatorsAndEscalators?: {
    shortdescription: string;
    equipmentno: string;
    equipmenttype: string;
    ADA: string;
    isactive: string;
    trainno: string;
    linesservedbyelevator: string;
    serving: string;
    stats?: {
      scheduled_outages: number;
      unscheduled_outages: number;
      total_outages: number;
      entrapments: number;
      am_peak_availability: number;
      pm_peak_availability: number;
      _24_hour_availability: number;
      dataMissing?: boolean;
    };
  }[];
  adaProject?: {
    properties: {
      name: string;
      status: string;
      type: string;
      details?: string;
    };
  };
}

export function MapOverlay({
  className,
  layers,
  scrollable = true,
  stickyHeader = true,
  clearAllSelections,
  enabledLayers,
  setEnabledLayers,
  selectedRoute,
  onRouteSelect,
  routeInfo,
  station,
  stations,
  selectedStationId,
  onStationSelect,
  neighborhood,
  elevatorsAndEscalators,
  adaProject,
}: MapOverlayProps) {
  const routeIds = station?.properties.daytime_routes.split(/[\s,]+/);

  const accessible = station?.properties.ada === "full";
  let partialAccessible = false;
  let accessibleDirection = "";
  if (station?.properties.ada === "southbound") {
    partialAccessible = true;
    accessibleDirection = "Southbound";
  }
  if (station?.properties.ada === "northbound") {
    partialAccessible = true;
    accessibleDirection = "Northbound";
  }

  const neighborhoodPopulationOver65 = neighborhood?.properties
    ? neighborhood?.properties.Pop65t69 +
      neighborhood?.properties.Pop70t74 +
      neighborhood?.properties.Pop75t79 +
      neighborhood?.properties.Pop80t84 +
      neighborhood?.properties.Pop85pl
    : null;

  const accessibilityScoreTooltipContent = (
    <p className="text-base">
      The accessible stations score is calculated as the percentage of of the{" "}
      nearest (within a threshold) stations to the neighborhood that are
      accessible.
    </p>
  );

  const selectedRoutes = selectedRoute?.split(",");
  const isShowingStationScores = enabledLayers?.includes(
    "neighborhoods-accessibility-score",
  );
  const nothingFocused =
    !station &&
    !neighborhood &&
    !adaProject &&
    !selectedRoute &&
    !isShowingStationScores;

  return (
    <Card className={className}>
      <CardHeader
        className={cn("p-4 pb-2", stickyHeader && "sticky top-0 bg-white z-20")}
      >
        <CardTitle className="text-lg font-bold">
          NYC Subway Accessibility Explorer
        </CardTitle>
        <div className="flex flex-col">
          <div className="flex flex-row items-center pb-2 gap-x-2 mb-2">
            <RouteSelector
              value={selectedRoute}
              onChange={onRouteSelect}
              groupRoutes
            />
            <StationSelector
              value={selectedStationId}
              values={stations}
              onChange={onStationSelect}
            />
          </div>
          <div
            className="text-sm text-blue-500 cursor-pointer hover:underline"
            onClick={clearAllSelections}
          >
            Clear all selections
          </div>
        </div>
        <div className="flex flex-col space-y-4 border-t my-2">
          <h1 className="text-lg font-bold mt-2">Data layers</h1>
          <MultiSelect
            options={layers.map((layer) => ({
              label: layer.name,
              value: layer.id,
            }))}
            onValueChange={setEnabledLayers}
            selectedValues={enabledLayers ?? []}
            placeholder="Select data layers"
            variant="inverted"
            maxCount={3}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isShowingStationScores && (
          <Alert className="mt-4 bg-blue-200 border-none flex flex-row">
            <InfoCircledIcon className="h-5 w-5" />
            <AlertDescription>
              <span className="text-sm">
                Station scores are calculated based on the percentage of close
                by stations that are accessible.
              </span>
            </AlertDescription>
          </Alert>
        )}
        {nothingFocused && (
          <div className="mt-2 border-t">
            <h1 className="mt-2 text-lg font-bold">Welcome!</h1>
            <span className="mt-2">
              This tool provides information about accessibility features of New
              York City subway stations. To get started, you can:
              <ul className="list-disc list-inside">
                <li>Select a station/route above or by clicking on the map</li>
                <li>Select different data layers to view additional info</li>
              </ul>
            </span>
          </div>
        )}
        {station && (
          <div className="mt-4 border-t">
            <div className="w-full flex flex-row justify-between items-center">
              <h1 className="mt-2 text-lg font-bold">
                {station.properties.stop_name}
              </h1>
              <div className="relative" style={{ width: 25, height: 25 }}>
                {(accessible || partialAccessible) && (
                  <Image
                    src="International_Symbol_of_Access.svg"
                    alt="Accessibility icon"
                    fill
                  />
                )}
              </div>
            </div>
            <div className="flex flex-row space-x-1 mt-2">
              {routeIds?.map((routeId) => (
                <NycSubwayIcon
                  key={routeId}
                  route={routeId}
                  width={25}
                  height={25}
                />
              ))}
            </div>
            {!(partialAccessible || accessible) && (
              <Alert className="mt-4 bg-red-200 border-none">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="font-bold">Not accessible</AlertTitle>
                <AlertDescription>
                  This station is not accessible! If you want to get involved,
                  you can{" "}
                  <ExternalLink
                    href="https://a816-dohbesp.nyc.gov/IndicatorPublic/take-action/email-electeds/"
                    target="_blank"
                  >
                    contact your local representatives
                  </ExternalLink>{" "}
                  and advocate for more accessible public transportation.
                </AlertDescription>
              </Alert>
            )}
            {partialAccessible && (
              <Alert className="mt-4 bg-yellow-200 border-none">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="font-bold">
                  Partial accessibility
                </AlertTitle>
                <AlertDescription>
                  {station.properties.ada_notes ? (
                    station.properties.ada_notes
                  ) : (
                    <>
                      This station is only accessible in the{" "}
                      <strong>{accessibleDirection}</strong> direction.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        {station?.properties.ridership_last_full_month !== undefined && (
          <div className="mt-4 border-t">
            <h1 className="mt-2 text-lg font-bold">
              Station Complex Ridership
            </h1>
            <div className="flex flex-row items-center mt-2">
              <div className="font-bold text-sm mr-2">{`Last full month (${station.properties.ridership_month}):`}</div>
              <div className="text-sm">
                {formatNumberWithCommas(
                  station.properties.ridership_last_full_month,
                )}
              </div>
            </div>
          </div>
        )}
        {station?.properties.ada_projects && (
          <div className="mt-4 border-t">
            <h1 className="mt-2 text-lg font-bold">Recent ADA projects</h1>
            <ExternalLink
              href="https://new.mta.info/project/station-accessibility-upgrades"
              target="_blank"
            >
              Learn more
            </ExternalLink>
            <DynamicScrollArea
              scrollable={scrollable}
              className={cn(
                scrollable
                  ? "max-h-[250px] overflow-scroll"
                  : "overflow-visible",
                "mt-2",
              )}
            >
              <div className="flex flex-col space-y-2">
                {station.properties.ada_projects.map((project) => (
                  <div key={project.id} className="flex flex-col">
                    <div className="flex flex-row space-x-2">
                      <div
                        className="relative"
                        style={{ width: 25, height: 25 }}
                      >
                        {project.status === "Completed" && (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        )}
                        {project.status === "Ongoing" && (
                          <ConstructionIcon className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="font-bold">{project.name}</p>
                        <p className="text-sm">{project.type}</p>
                        {project.details && (
                          <p className="text-sm">{project.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DynamicScrollArea>
          </div>
        )}
        {elevatorsAndEscalators && elevatorsAndEscalators.length > 0 && (
          <div className="mt-4 border-t">
            <h1 className="mt-2 text-lg font-bold">Elevators and escalators</h1>

            <Alert className="mt-4 bg-blue-200 border-none flex flex-row">
              <InfoCircledIcon className="h-5 w-5" />
              <AlertDescription>
                <span className="text-sm">
                  Availability data based on past 6 months from September, 2024
                </span>
              </AlertDescription>
            </Alert>
            <DynamicScrollArea
              scrollable={scrollable}
              className={cn(
                scrollable && "max-h-[250px] overflow-scroll",
                "mt-2",
              )}
            >
              <div className="flex flex-col space-y-2">
                {elevatorsAndEscalators
                  .filter((e) => e.isactive)
                  .map((equipment) => (
                    <div key={equipment.equipmentno} className="flex flex-col">
                      <div className="flex flex-row space-x-2">
                        <div
                          className="relative"
                          style={{ width: 25, height: 25 }}
                        >
                          {equipment.equipmenttype === "EL" && (
                            <ElevatorIcon width={30} height={30} />
                          )}
                          {equipment.equipmenttype === "ES" && (
                            <EscalatorIcon width={30} height={30} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold">{equipment.serving}</p>
                          <div>
                            {equipment.linesservedbyelevator
                              .split("/")
                              .filter((r) => allRoutes.has(r))
                              .map((train) => (
                                <NycSubwayIcon
                                  key={train}
                                  route={train}
                                  width={15}
                                  height={15}
                                />
                              ))}
                          </div>
                          <EquipmentStatsTable
                            stats={{
                              outages: equipment.stats?.total_outages,
                              peakAmAvailability:
                                equipment.stats?.am_peak_availability,
                              peakPmAvailability:
                                equipment.stats?.pm_peak_availability,
                              dataMissing: equipment.stats?.dataMissing,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </DynamicScrollArea>
          </div>
        )}
        {selectedRoute && !station && !neighborhood && (
          <div className="mt-4 border-t">
            <div className="flex flex-row gap-x-1 mt-4">
              {selectedRoutes?.map((routeId) => (
                <NycSubwayIcon
                  key={routeId}
                  route={routeId}
                  width={25}
                  height={25}
                />
              ))}
            </div>
            <div className="flex flex-row mt-4">
              <div className="font-bold mr-2">Number of stations:</div>
              <div>{formatNumberWithCommas(routeInfo?.num_stations)}</div>
            </div>
            <div className="flex flex-row mt-2">
              <div className="font-bold mr-2">
                Number of accessible stations:
              </div>
              <div>
                {formatNumberAsPercentage(
                  routeInfo?.num_accessible_stations,
                  routeInfo?.num_stations,
                )}
              </div>
            </div>
          </div>
        )}
        {neighborhood && (
          <div className="mt-4 border-t flex flex-col">
            <div className="w-full flex flex-col">
              <h1 className="mt-2 text-lg font-bold">
                {neighborhood.properties.NTAName}
              </h1>
              <h2 className="font-bold text-slate-600">
                {neighborhood.properties.Borough}
              </h2>
            </div>
            <div className="flex flex-row mt-4">
              <div className="font-bold mr-2">Population:</div>
              <div>{formatNumberWithCommas(neighborhood.properties.Pop1)}</div>
            </div>
            <div className="flex flex-row mt-2">
              <div className="font-bold mr-2">Population over 65:</div>
              <div>
                {formatNumberAsPercentage(
                  neighborhoodPopulationOver65,
                  neighborhood.properties.Pop1,
                )}
              </div>
            </div>
            <div className="flex flex-row mt-2">
              <div className="font-bold mr-2">Accessible stations score:</div>
              <div>
                {formatDecimalAsPercentage(
                  neighborhood.properties.accessible_station_score,
                )}
              </div>
              <InfoButton tooltipContent={accessibilityScoreTooltipContent} />
            </div>
          </div>
        )}
        {adaProject && (
          <div className="mt-4 border-t">
            <h1 className="mt-2 text-lg font-bold">
              {`ADA project: ${adaProject.properties.name}`}
            </h1>
            <ExternalLink
              href="https://new.mta.info/project/station-accessibility-upgrades"
              target="_blank"
            >
              Learn more
            </ExternalLink>
            <div className="flex flex-row space-x-2 mt-2">
              <div className="relative" style={{ width: 25, height: 25 }}>
                {adaProject.properties.status === "Completed" && (
                  <CheckIcon className="h-5 w-5 text-green-500" />
                )}
                {adaProject.properties.status === "Ongoing" && (
                  <ConstructionIcon className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-sm">{adaProject.properties.type}</p>
                {adaProject.properties.details && (
                  <p className="text-sm">{adaProject.properties.details}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
