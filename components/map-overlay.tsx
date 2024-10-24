import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { allRoutes, NycSubwayIcon } from "./nyc-subway-icon";

import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { ScrollArea } from "./ui/scroll-area";
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

export interface Layer {
  id: string;
  name: string;
  info?: JSX.Element;
  dependendLayers?: string[];
}

interface MapOverlayProps {
  layers: Layer[];
  enabledLayers: string[] | null;
  onLayerToggle: (layerId: string, enabled: boolean) => void;
  selectedRoute: string | null;
  onRouteSelect?: (route: string | null) => void;
  selectedStationId?: string  | null;
  onStationSelect?: (stationId: string | null) => void;
  stations?: Station[];
  station?: {
    properties: {
      stop_name: string;
      station_id: string;
      daytime_routes: string;
      ada: string;
      ada_southbound: string;
      ada_northbound: string;
      ada_notes?: string | null;
      ada_projects?: {
        name: string;
        status: string;
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
  }[];
}

export function MapOverlay({
  layers,
  enabledLayers,
  onLayerToggle,
  selectedRoute,
  onRouteSelect,
  routeInfo,
  station,
  stations,
  selectedStationId,
  onStationSelect,
  neighborhood,
  elevatorsAndEscalators,
}: MapOverlayProps) {
  const routeIds = station?.properties.daytime_routes.split(/[\s,]+/);

  const accessible = station?.properties.ada === "1";
  let partialAccessible = false;
  let accessibleDirection = "";
  if (
    station?.properties.ada_southbound === "1" &&
    station?.properties.ada_northbound === "0"
  ) {
    partialAccessible = true;
    accessibleDirection = "Southbound";
  }
  if (
    station?.properties.ada_southbound === "0" &&
    station?.properties.ada_northbound === "1"
  ) {
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

  const numStationsConsidered =
    neighborhood?.properties.num_nearest_stations ?? 5;
  const accessibilityScoreTooltipContent = (
    <p className="text-base">
      The accessible stations score is calculated as the percentage of of the{" "}
      {numStationsConsidered} nearest stations to the neighborhood that are
      accessible.
    </p>
  );

  const enabledLayersSet = new Set(enabledLayers ?? []);
  const selectedRoutes = selectedRoute?.split(",");

  return (
    <Card className="absolute top-4 left-4 min-w-[420px] max-w-[450px] w-[25%] bg-white shadow-lg max-h-[95%] overflow-auto">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          NYC Subway Accessibility Explorer
        </CardTitle>
      </CardHeader>
      <CardContent>
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
        <div className="flex flex-col space-y-4 border-t">
          <h1 className="text-lg font-bold">Data layers</h1>
          {layers.map((layer) => (
            <div key={layer.id} className="flex items-center space-x-2">
              <Switch
                id={layer.id}
                checked={enabledLayersSet.has(layer.id)}
                onCheckedChange={(checked) => onLayerToggle(layer.id, checked)}
              />
              <Label htmlFor="airplane-mode">{layer.name}</Label>
              {layer.info ? <InfoButton tooltipContent={layer.info} /> : null}
            </div>
          ))}
        </div>
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
        {station?.properties.ada_projects && (
          <div className="mt-4 border-t">
            <h1 className="mt-2 text-lg font-bold">Recent ADA projects</h1>
            <ExternalLink
              href="https://new.mta.info/project/station-accessibility-upgrades"
              target="_blank"
            >
              Learn more
            </ExternalLink>
            <ScrollArea className="max-h-[250px] overflow-scroll mt-2">
              <div className="flex flex-col space-y-2">
                {station.properties.ada_projects.map((project) => (
                  <div key={project.name} className="flex flex-col">
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        {elevatorsAndEscalators && elevatorsAndEscalators.length > 0 && (
          <div className="mt-4 border-t">
            <h1 className="mt-2 text-lg font-bold">Elevators and escalators</h1>
            <ScrollArea className="max-h-[250px] overflow-scroll mt-2">
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
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
            <Alert className="mt-4 bg-blue-200 border-none">
              <InfoCircledIcon className="h-5 w-5" />
              <AlertDescription>
                For status of elevators/escalators, visit the{" "}
                <ExternalLink
                  href="https://new.mta.info/elevator-escalator-status"
                  target="_blank"
                >
                  MTA website
                </ExternalLink>
                .
              </AlertDescription>
            </Alert>
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
      </CardContent>
    </Card>
  );
}
