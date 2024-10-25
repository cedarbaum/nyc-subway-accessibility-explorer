"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, LayerProps, MapRef, Source } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import NycBoundary from "@/gis-data/borough-boundaries-geojson.json";
import BoroughCenters from "@/gis-data/borough-centers-geojson.json";
import Stations from "@/gis-data/mta-subway-stations-geojson.json";
import SubwayLines from "@/gis-data/subway-lines-geojson.json";
import StationEntrancesExits from "@/gis-data/subway-entrances-exits.json";
import ElevatorAndEscalatorInfo from "@/gis-data/mta-elevators-and-escalators.json";
import AdaProjects from "@/gis-data/mta-ada-projects.json";
import Neighborhoods from "@/gis-data/nyc-neighborhoods.json";
import { center, bbox } from "@turf/turf";
import { MapOverlay } from "@/components/map-overlay";
import {
  parseAsArrayOf,
  parseAsString,
  useQueryState,
} from "next-usequerystate";
import mapboxgl from "mapbox-gl";
import { useMediaQuery } from "usehooks-ts";

const imagesToLoad = [
  "stairs",
  "construction",
  "completed",
  "elevator",
  "escalator",
];

const layers = [
  { id: "neighborhoods", name: "Neighborhoods" },
  { id: "platform-availability", name: "Borough ADA platform availability" },
  {
    id: "neighborhoods-accessibility-score",
    name: "Neighborhood stations score",
    active: false,
    info: (
      <p className="text-base">
        The accessible stations score is calculated as the percentage of of the
        5 nearest stations to the neighborhood that are accessible.
      </p>
    ),
  },
  { id: "stations", name: "Stations" },
  {
    id: "station-entrances-exits",
    name: "Station Entrances/Exits",
    active: false,
  },
  { id: "ada-projects", name: "Recent ADA projects" },
  { id: "subway-lines", name: "Subway lines" },
];

export default function Home() {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [enabledLayerIds, setEnabledLayerIds] = useQueryState(
    "layers",
    parseAsArrayOf(parseAsString).withDefault(["stations", "subway-lines"]),
  );

  const [focusedStationId, setFocusedStationId] = useQueryState("stationID");
  const [selectedRoute, setSelectedRoute] = useQueryState("routes");
  const [focusedNeighborhoodId, setFocusedNeighborhoodId] = useState<
    string | number | null
  >(null);
  const [focusedAdaProjectId, setFocusedAdaProjectId] = useState<string | null>(
    null,
  );
  const [mapBottomPadding, setMapBottomPadding] = useState(0);

  const onLayerSelect = (layerIds: string[]) => {
    if (focusedStationId && !layerIds.includes("stations")) {
      setFocusedStationId(null);
    }

    if (selectedRoute && !layerIds.includes("subway-lines")) {
      setSelectedRoute(null);
    }

    if (focusedNeighborhoodId && !layerIds.includes("neighborhoods")) {
      setFocusedNeighborhoodId(null);
    }

    setEnabledLayerIds(layerIds);
  };

  const clearAllSelections = () => {
    setFocusedStationId(null);
    setFocusedNeighborhoodId(null);
    setSelectedRoute(null);
    setFocusedAdaProjectId(null);
  };

  useEffect(() => {
    if (!focusedStationId) {
      return;
    }
    setFocusedNeighborhoodId(null);
    setSelectedRoute(null);
    setFocusedAdaProjectId(null);

    const station = Stations.features.find(
      (feature) => feature.properties.station_id === focusedStationId,
    );
    if (mapLoaded && mapRef.current && station) {
      const timeout = setTimeout(() => {
        mapRef.current?.flyTo({
          center: [
            station.geometry.coordinates[0],
            station.geometry.coordinates[1],
          ],
          zoom: 15,
          padding: { top: 0, bottom: mapBottomPadding, left: 0, right: 0 },
        });
      }, 50);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [
    focusedStationId,
    mapLoaded,
    setFocusedNeighborhoodId,
    setSelectedRoute,
    setFocusedAdaProjectId,
    mapBottomPadding,
  ]);

  useEffect(() => {
    if (!focusedStationId) {
      return;
    }
    if (!enabledLayerIds.includes("stations")) {
      setEnabledLayerIds((prevEnabledLayers) => [
        ...prevEnabledLayers,
        "stations",
      ]);
    }
  }, [focusedStationId, enabledLayerIds, setEnabledLayerIds]);

  useEffect(() => {
    if (!selectedRoute) {
      return;
    }
    if (!enabledLayerIds.includes("subway-lines")) {
      setEnabledLayerIds((prevEnabledLayers) => [
        ...prevEnabledLayers,
        "subway-lines",
      ]);
    }
  }, [selectedRoute, enabledLayerIds, setEnabledLayerIds]);

  useEffect(() => {
    if (!focusedAdaProjectId) {
      return;
    }
    setFocusedStationId(null);
    setFocusedNeighborhoodId(null);
    setSelectedRoute(null);
  }, [
    focusedAdaProjectId,
    setFocusedStationId,
    setFocusedNeighborhoodId,
    setSelectedRoute,
  ]);

  useEffect(() => {
    if (!selectedRoute) {
      return;
    }
    setFocusedStationId(null);
    setFocusedNeighborhoodId(null);
    setFocusedAdaProjectId(null);

    const routes = new Set(selectedRoute.split(",").map((r) => r.trim()));
    const routesFeatures = SubwayLines.features.filter((feature) =>
      routes.has(feature.properties?.rt_symbol?.toLowerCase()),
    );
    const routesFeatureCollection = {
      type: "FeatureCollection",
      features: routesFeatures,
    } as GeoJSON.FeatureCollection;

    if (mapLoaded && mapRef.current && routesFeatures.length > 0) {
      const routeBounds = bbox(routesFeatureCollection) as [
        number,
        number,
        number,
        number,
      ];

      const timeout = setTimeout(() => {
        mapRef.current?.fitBounds(routeBounds, {
          padding: {
            top: 50,
            bottom: mapBottomPadding + 50,
            left: 50,
            right: 50,
          },
        });
      }, 50);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [
    mapBottomPadding,
    selectedRoute,
    mapLoaded,
    setFocusedStationId,
    setFocusedNeighborhoodId,
    setFocusedAdaProjectId,
  ]);

  useEffect(() => {
    if (!focusedNeighborhoodId) {
      return;
    }
    setFocusedStationId(null);
    setSelectedRoute(null);
  }, [focusedNeighborhoodId, setFocusedStationId, setSelectedRoute]);

  const showingAccessibilityScore = useMemo(() => {
    return (
      enabledLayerIds?.find(
        (id) => id === "neighborhoods-accessibility-score",
      ) !== undefined
    );
  }, [enabledLayerIds]);

  const selectedStation = useMemo(() => {
    return Stations.features.find(
      (feature) => feature.properties.station_id === focusedStationId,
    );
  }, [focusedStationId]);

  const stations = useMemo(() => {
    return Stations.features.map((feature) => feature.properties);
  }, []);

  const selectedNeighborhood = useMemo(() => {
    //@ts-ignore
    return Neighborhoods.features.find(
      (feature: any) => feature.id === focusedNeighborhoodId,
    );
  }, [focusedNeighborhoodId]);

  const selectedAdaProject = useMemo(() => {
    return AdaProjects.features.find(
      (feature) => feature.properties.id === focusedAdaProjectId,
    );
  }, [focusedAdaProjectId]);

  // Calculate the centroid of the GeoJSON for NYC boundaries
  const mapCenter = useMemo(() => {
    const centroid = center(NycBoundary as GeoJSON.FeatureCollection);
    return {
      longitude: centroid.geometry.coordinates[0],
      latitude: centroid.geometry.coordinates[1],
    };
  }, []);

  const layerIsEnabled = (id: string) => {
    return enabledLayerIds?.includes(id) ?? false;
  };

  const stationsData = useMemo(() => {
    const newStations = JSON.parse(
      JSON.stringify(Stations),
    ) as GeoJSON.FeatureCollection;
    newStations.features.forEach((feature) => {
      feature!.properties!.focused =
        feature?.properties?.station_id === focusedStationId;
    });

    newStations.features = newStations.features.filter((feature) => {
      if (!selectedRoute) {
        return true;
      }
      const selectedRoutes = new Set(
        selectedRoute.split(",").map((r) => r.trim()),
      );
      const stationRoutes = feature.properties?.daytime_routes
        .split(/[\s,]+/)
        .map((r: string) => r.toLowerCase()) as string[];
      if (!stationRoutes) {
        return false;
      }
      return stationRoutes.some((route) => selectedRoutes.has(route));
    });

    return newStations;
  }, [focusedStationId, selectedRoute]);

  const routeInfo = useMemo(() => {
    if (!selectedRoute) {
      return undefined;
    }

    const numStations = stationsData.features.length;
    const numAccessibleStations = stationsData.features.filter(
      (feature) =>
        feature.properties?.ada === "full" ||
        feature.properties?.ada === "southbound" ||
        feature.properties?.ada === "northbound",
    ).length;

    return {
      num_stations: numStations,
      num_accessible_stations: numAccessibleStations,
    };
  }, [stationsData, selectedRoute]);

  const neighborhoodData = useMemo(() => {
    const newNeighborhoods = JSON.parse(
      JSON.stringify(Neighborhoods),
    ) as GeoJSON.FeatureCollection;
    newNeighborhoods.features.forEach((feature) => {
      feature!.properties!.focused = feature?.id === focusedNeighborhoodId;
      feature!.properties!.showingAccessibilityScore =
        showingAccessibilityScore;
    });
    return newNeighborhoods;
  }, [focusedNeighborhoodId, showingAccessibilityScore]);

  const subwayLineData = useMemo(() => {
    const newSubwayLines = JSON.parse(
      JSON.stringify(SubwayLines),
    ) as GeoJSON.FeatureCollection;
    newSubwayLines.features = newSubwayLines.features.filter((feature) => {
      if (!selectedRoute) {
        return true;
      }
      const selectedRoutes = new Set(
        selectedRoute.split(",").map((r) => r.trim()),
      );
      return selectedRoutes.has(feature.properties?.rt_symbol?.toLowerCase());
    });
    return newSubwayLines;
  }, [selectedRoute]);

  const adaProjectsData = useMemo(() => {
    const newAdaProjects = JSON.parse(
      JSON.stringify(AdaProjects),
    ) as GeoJSON.FeatureCollection;
    newAdaProjects.features.forEach((feature) => {
      feature!.properties!.focused =
        feature?.properties?.id === focusedAdaProjectId;
    });
    return newAdaProjects;
  }, [focusedAdaProjectId]);

  const boroughBoundaries = layerIsEnabled("platform-availability") ? (
    <Source id="borough-boundaries" type="geojson" data={NycBoundary}>
      <Layer
        id="borough-boundaries"
        beforeId="borough-availability-labels"
        type="line"
        paint={{
          "line-color": "#088",
          "line-width": 2,
        }}
      />
      <Layer
        id="borough-boundaries-fill"
        beforeId="borough-availability-labels"
        type="fill"
        paint={{
          "fill-color": [
            "case",
            // If availability is -1 (missing data), set color to light gray
            ["==", ["get", "platform_availability"], -1],
            "#d3d3d3", // Light gray for missing data
            // Use an interpolation to color from red to green based on availability (0 to 1)
            [
              "interpolate",
              ["linear"],
              ["get", "platform_availability"],
              0,
              "#ff3030", // Red for 0 availability
              0.5,
              "#fee08b", // Yellow for mid-range availability
              1,
              "#1a9850", // Green for 1 availability
            ],
          ],
          "fill-opacity": 0.7,
        }}
      />
    </Source>
  ) : (
    createEmptySourceWithLayers("borough-boundaries", [
      { id: "borough-boundaries", type: "line" },
      { id: "borough-boundaries-fill", type: "fill" },
    ])
  );

  const boroughAvailabilityLabels = layerIsEnabled("platform-availability") ? (
    <Source
      id="borough-availability-labels"
      type="geojson"
      data={BoroughCenters}
    >
      <Layer
        id="borough-availability-labels"
        beforeId="stations"
        type="symbol"
        layout={{
          "text-field": [
            "case",
            ["==", ["get", "platform_availability"], -1],
            "6 Month (03/2024-08/2024) Platform Availability: N/A",
            [
              "concat",
              "6 Month (03/2024-08/2024) Platform Availability: ",
              [
                "to-string",
                ["round", ["*", ["get", "platform_availability"], 100]],
              ],
              "%",
            ],
          ],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 14,
          "text-anchor": "center",
          "symbol-placement": "point", // Places one label per polygon
          "text-allow-overlap": true, // Ensures labels appear even if they overlap slightly
        }}
        paint={{
          "text-color": "#333333", // Dark color for readability
          "text-halo-color": "#ffffff", // White halo for better visibility
          "text-halo-width": 1,
        }}
      />
    </Source>
  ) : (
    createEmptyLayer("borough-availability-labels", "symbol")
  );

  const neighborhoodBoundaries =
    layerIsEnabled("neighborhoods") ||
    layerIsEnabled("neighborhoods-accessibility-score") ? (
      <Source id="neighborhood-bounds" type="geojson" data={neighborhoodData}>
        <Layer
          id="neighborhood-bounds"
          type="line"
          paint={{
            "line-color": "#088",
            "line-width": 2,
          }}
        />
      </Source>
    ) : (
      createEmptyLayer("neighborhood-bounds", "line")
    );

  const neighborhoodLabels = (
    <Source id="neighborhood-labels" type="geojson" data={neighborhoodData}>
      <Layer
        id="neighborhood-labels"
        type="symbol"
        layout={{
          "text-field": ["get", "NTAName"],
          "text-size": 14,
          "text-variable-anchor": ["top", "bottom", "left", "right"],
          "text-radial-offset": 0.5,
          "text-justify": "auto",
          "text-anchor": "center",
          "text-allow-overlap": false,
        }}
        paint={{
          "text-opacity":
            layerIsEnabled("neighborhoods") ||
            layerIsEnabled("neighborhoods-accessibility-score")
              ? 1
              : 0,
        }}
      />
    </Source>
  );

  const neighborhoodFill =
    layerIsEnabled("neighborhoods") ||
    layerIsEnabled("neighborhoods-accessibility-score") ? (
      <Source id="neighborhood-fill" type="geojson" data={neighborhoodData}>
        <Layer
          id="neighborhood-fill"
          type="fill"
          paint={{
            "fill-color": [
              "case",
              ["boolean", ["get", "showingAccessibilityScore"], false],
              [
                "interpolate",
                ["linear"],
                ["get", "accessible_station_score"],
                0.1,
                "#ff3030",
                0.2,
                "#d73027",
                0.3,
                "#f46d43",
                0.4,
                "#fdae61",
                0.5,
                "#fee08b",
                0.6,
                "#d9ef8b",
                0.7,
                "#a6d96a",
                0.8,
                "#66bd63",
                0.9,
                "#1a9850",
              ],
              "#088",
            ],
            "fill-opacity": [
              "case",
              [
                "all",
                ["boolean", ["get", "showingAccessibilityScore"], false],
                ["boolean", ["feature-state", "hover"], false],
              ],
              0.9,
              [
                "all",
                ["boolean", ["get", "showingAccessibilityScore"], false],
                ["boolean", ["get", "focused"], false],
              ],
              0.9,
              ["boolean", ["get", "showingAccessibilityScore"], false],
              0.7,
              ["boolean", ["feature-state", "hover"], false],
              0.5,
              ["boolean", ["get", "focused"], false],
              0.5,
              0.0,
            ],
            "fill-color-transition": { duration: 0 },
            "fill-opacity-transition": { duration: 0 },
          }}
        />
      </Source>
    ) : (
      createEmptyLayer("neighborhood-fill", "fill")
    );

  const subwayLines = layerIsEnabled("subway-lines") ? (
    <Source id="subway-lines" type="geojson" data={subwayLineData}>
      <Layer
        id="subway-lines"
        type="line"
        paint={{
          "line-color": ["get", "color"],
          "line-width": 4,
        }}
      />
    </Source>
  ) : (
    createEmptyLayer("subway-lines", "line")
  );

  const adaProjects = layerIsEnabled("ada-projects") ? (
    <Source id="ada-projects" type="geojson" data={adaProjectsData}>
      <Layer
        id="ada-projects"
        type="symbol"
        layout={{
          "icon-image": [
            "case",
            ["==", ["get", "status"], "Completed"],
            "completed",
            "construction",
          ],
          "icon-size": ["case", ["==", ["get", "focused"], true], 1.4, 1.0],
          "icon-allow-overlap": true,
        }}
      />
    </Source>
  ) : (
    createEmptyLayer("ada-projects", "symbol")
  );

  const stationsLayer = layerIsEnabled("stations") ? (
    <Source id="stations" type="geojson" data={stationsData}>
      <Layer
        id="stations"
        type="circle"
        paint={{
          "circle-color": [
            "case",
            ["==", ["get", "ada"], "full"],
            "#046B99",
            ["==", ["get", "ada"], "southbound"],
            "#FDF18A",
            ["==", ["get", "ada"], "northbound"],
            "#FDF18A",
            "#FF361C",
          ],
          "circle-radius": ["case", ["==", ["get", "focused"], true], 10, 7],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        }}
      />
    </Source>
  ) : (
    createEmptyLayer("stations", "circle")
  );

  const stationsEntrancesExits = layerIsEnabled("station-entrances-exits") ? (
    <Source
      id="station-entrances-exits"
      type="geojson"
      data={StationEntrancesExits}
    >
      <Layer
        id="station-entrances-exits"
        type="symbol"
        layout={{
          "icon-image": [
            "case",
            ["==", ["get", "entrance_type"], "Elevator"],
            "elevator",
            ["==", ["get", "entrance_type"], "Escalator"],
            "escalator",
            ["==", ["get", "entrance_type"], "Stair/Escalator"],
            "escalator",
            "stairs",
          ],
          "icon-size": 1,
        }}
      />
    </Source>
  ) : (
    createEmptyLayer("station-entrances-exits", "symbol")
  );

  const hoveredNeighborhoodId = useRef<string | number | undefined>(undefined);
  useEffect(() => {
    if (!mapRef.current?.loaded) {
      return;
    }

    mapRef.current.on("click", "stations", (e) => {
      const features = mapRef.current!.queryRenderedFeatures(e.point, {
        layers: ["stations"],
      });

      if (features.length === 0) {
        setFocusedStationId(null);
        return;
      }

      const id = features[0]?.properties?.station_id;
      if (!id) {
        console.error("No id found in properties", features[0]);
        setFocusedStationId(null);
        return;
      }

      setFocusedStationId(id);

      //@ts-expect-error - handled is not a standard property
      e.handled = true;
    });

    // Click handler to select neighborhood
    mapRef.current.on("click", "neighborhood-fill", (e) => {
      //@ts-expect-error - handled is not a standard property
      if (e.handled) {
        return;
      }

      if (e.features && e.features.length > 0) {
        setFocusedNeighborhoodId(e.features[0]?.id ?? null);
      }
    });

    // Click handler for ADA projects
    mapRef.current.on("click", "ada-projects", (e) => {
      //@ts-expect-error - handled is not a standard property
      if (e.handled) {
        return;
      }

      const features = mapRef.current!.queryRenderedFeatures(e.point, {
        layers: ["ada-projects"],
      });

      if (features.length === 0) {
        setFocusedAdaProjectId(null);
        return;
      }

      const id = features[0]?.properties?.id;
      if (!id) {
        console.error("No id found in properties", features[0]);
        setFocusedAdaProjectId(null);
        return;
      }

      setFocusedAdaProjectId(id);

      //@ts-expect-error - handled is not a standard property
      e.handled = true;
    });

    mapRef.current.on("mousemove", "neighborhood-fill", (e) => {
      if (e.features && e.features.length > 0) {
        if (hoveredNeighborhoodId.current !== undefined) {
          mapRef.current!.setFeatureState(
            { source: "neighborhood-fill", id: hoveredNeighborhoodId.current },
            { hover: false },
          );
        }
        hoveredNeighborhoodId.current = e.features[0]?.id;
        mapRef.current!.setFeatureState(
          { source: "neighborhood-fill", id: hoveredNeighborhoodId.current! },
          { hover: true },
        );
      }
    });

    mapRef.current.on("mouseleave", "neighborhood-fill", () => {
      if (hoveredNeighborhoodId.current !== undefined) {
        mapRef.current!.setFeatureState(
          { source: "neighborhood-fill", id: hoveredNeighborhoodId.current! },
          { hover: false },
        );
      }
      hoveredNeighborhoodId.current = undefined;
    });

    // Load images
    imagesToLoad.forEach((imageName) => {
      if (mapRef.current!.hasImage(imageName)) {
        return;
      }
      mapRef.current!.loadImage(`/${imageName}.png`, (error, image) => {
        if (error) throw error;
        mapRef.current!.addImage(imageName, image!);
      });
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
  }, [mapLoaded, setFocusedStationId, setFocusedNeighborhoodId]);

  const elevatorsAndEscalatorsForStation = useMemo(() => {
    return ElevatorAndEscalatorInfo.filter(
      (info) =>
        info.stationcomplexid === selectedStation?.properties?.complex_id,
    );
  }, [selectedStation]);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isTallScreen = useMediaQuery("(min-height: 1024px)");
  const [showOverLay, setShowOverlay] = useState(false);
  useEffect(() => {
    setShowOverlay(true);
  }, []);

  const [overlayHeight, setOverlayHeight] = useState<number | undefined>(
    undefined,
  );
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setOverlayHeight(overlayRef.current?.clientHeight);
  }, [isDesktop, showOverLay]);

  useEffect(() => {
    if (isDesktop || overlayHeight === undefined || !mapLoaded) {
      mapRef.current?.setPadding({ left: 0, top: 0, right: 0, bottom: 0 });
      setMapBottomPadding(0);
      return;
    }
    mapRef.current?.setPadding({
      left: 0,
      top: 0,
      right: 0,
      bottom: overlayHeight,
    });
    setMapBottomPadding(overlayHeight);
  }, [isDesktop, overlayHeight, mapLoaded, setMapBottomPadding]);

  return (
    <div className="flex flex-col w-full h-full bg-[#EFE9E1]">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: mapCenter.longitude,
          latitude: mapCenter.latitude,
          zoom: 12,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
        onLoad={() => {
          setMapLoaded(true);
        }}
      >
        {boroughBoundaries}
        {neighborhoodFill}
        {neighborhoodLabels}
        {neighborhoodBoundaries}
        {subwayLines}
        {stationsEntrancesExits}
        {adaProjects}
        {stationsLayer}
        {boroughAvailabilityLabels}
      </Map>
      {showOverLay && isDesktop && (
        <MapOverlay
          className="absolute top-4 left-4 min-w-[420px] max-w-[450px] w-[25%] bg-white shadow-lg max-h-[95%] z-50 overflow-scroll"
          scrollable={isTallScreen}
          stickyHeader={!isTallScreen}
          station={selectedStation}
          stations={stations}
          selectedStationId={focusedStationId}
          onStationSelect={setFocusedStationId}
          neighborhood={selectedNeighborhood}
          elevatorsAndEscalators={elevatorsAndEscalatorsForStation}
          layers={layers}
          enabledLayers={enabledLayerIds}
          setEnabledLayers={onLayerSelect}
          selectedRoute={selectedRoute}
          onRouteSelect={setSelectedRoute}
          routeInfo={routeInfo}
          adaProject={selectedAdaProject}
          clearAllSelections={clearAllSelections}
        />
      )}
      {showOverLay && !isDesktop && (
        <div
          ref={overlayRef}
          className="fixed bottom-0 left-0 right-0 h-[50%] z-50 bg-white"
        >
          <MapOverlay
            className="w-full max-h-full shadow-none rounded-none border-none overflow-auto pb-4"
            scrollable={false}
            stickyHeader={false}
            station={selectedStation}
            stations={stations}
            selectedStationId={focusedStationId}
            onStationSelect={setFocusedStationId}
            neighborhood={selectedNeighborhood}
            elevatorsAndEscalators={elevatorsAndEscalatorsForStation}
            layers={layers}
            enabledLayers={enabledLayerIds}
            setEnabledLayers={onLayerSelect}
            selectedRoute={selectedRoute}
            onRouteSelect={setSelectedRoute}
            routeInfo={routeInfo}
            adaProject={selectedAdaProject}
            clearAllSelections={clearAllSelections}
          />
        </div>
      )}
    </div>
  );
}

function createEmptySourceWithLayers(
  sourceId: string,
  layers: { id: string; type: LayerProps["type"] }[],
) {
  return (
    <Source
      id={sourceId}
      type="geojson"
      data={{ type: "FeatureCollection", features: [] }}
    >
      {layers.map((layer) => (
        <Layer key={layer.id} id={layer.id} type={layer.type} />
      ))}
    </Source>
  );
}

function createEmptyLayer(
  layerId: string,
  type: LayerProps["type"] = "circle",
) {
  return (
    <Source
      id={layerId}
      type="geojson"
      data={{ type: "FeatureCollection", features: [] }}
    >
      <Layer id={layerId} type={type} />
    </Source>
  );
}
