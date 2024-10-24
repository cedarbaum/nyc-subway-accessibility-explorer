"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Layer,
  LayerProps,
  MapRef,
  Source,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import NycBoundary from "@/gis-data/borough-boundaries-geojson.json";
import Stations from "@/gis-data/mta-subway-stations-geojson.json";
import SubwayLines from "@/gis-data/subway-lines-geojson.json";
import StationEntrancesExits from "@/gis-data/subway-entrances-exits.json";
import ElevatorAndEscalatorInfo from "@/gis-data/elevator-and-escalator-info.json";
import AdaProjects from "@/gis-data/mta-ada-projects.json";
import Neighborhoods from "@/gis-data/nyc-neighborhoods.json";
import { center } from "@turf/turf";
import { MapOverlay, Layer as DataLayer } from "@/components/map-overlay";

const imagesToLoad = [
  "stairs",
  "construction",
  "completed",
  "elevator",
  "escalator",
];

export default function Home() {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layers, setLayers] = useState<DataLayer[]>([
    { id: "city-boundary", name: "City boundary", active: false },
    { id: "neighborhoods", name: "Neighborhoods", active: false },
    {
      id: "neighborhoods-accessibility-score",
      name: "Neighborhood Accessibility Score",
      active: false,
      info: (
        <p className="text-base">
          The accessible stations score is calculated as the percentage of of
          the 5 nearest stations to the neighborhood that are accessible.
        </p>
      ),
      dependendLayers: ["neighborhoods"],
    },
    { id: "stations", name: "Stations", active: true },
    {
      id: "station-entrances-exits",
      name: "Station Entrances/Exits",
      active: false,
    },
    { id: "ada-projects", name: "Recent ADA projects", active: false },
    { id: "subway-lines", name: "Subway lines", active: true },
  ]);
  const [focusedStationId, setFocusedStationId] = useState<
    string | number | null
  >(null);
  const [focusedNeighborhoodId, setFocusedNeighborhoodId] = useState<
    string | number | null
  >(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null | undefined>(
    null,
  );

  useEffect(() => {
    if (!selectedRoute) {
      return;
    }
    setFocusedStationId(null);
    setFocusedNeighborhoodId(null);
  }, [selectedRoute]);

  useEffect(() => {
    if (!focusedNeighborhoodId) {
      return;
    }
    setFocusedStationId(null);
    setSelectedRoute(null);
  }, [focusedNeighborhoodId]);

  const showingAccessibilityScore = useMemo(() => {
    return layers.find(
      (layer) => layer.id === "neighborhoods-accessibility-score",
    )?.active;
  }, [layers]);

  const selectedStation = useMemo(() => {
    return Stations.features.find(
      (feature) => feature.properties.station_id === focusedStationId,
    );
  }, [focusedStationId]);

  const selectedNeighborhood = useMemo(() => {
    //@ts-ignore
    return Neighborhoods.features.find(
      (feature: any) => feature.id === focusedNeighborhoodId,
    );
  }, [focusedNeighborhoodId]);

  // Calculate the centroid of the GeoJSON for NYC boundaries
  const mapCenter = useMemo(() => {
    const centroid = center(NycBoundary as GeoJSON.FeatureCollection);
    return {
      longitude: centroid.geometry.coordinates[0],
      latitude: centroid.geometry.coordinates[1],
    };
  }, []);

  const onLayerToggle = (id: string, enabled: boolean) => {
    const layerIdsToToEnable = new Set<string>();
    const layerIdsToToDisable = new Set<string>();
    const layer = layers.find((layer) => layer.id === id);
    const dependentLayers = layer?.dependendLayers ?? [];

    if (enabled) {
      dependentLayers.forEach((dependentLayer) => {
        layerIdsToToEnable.add(dependentLayer);
      });
    } else {
      layers.forEach((layer) => {
        if (layer.dependendLayers?.includes(id)) {
          layerIdsToToDisable.add(layer.id);
        }
      });
    }

    setLayers((prevLayers) =>
      prevLayers.map((layer) => {
        if (layer.id === id) {
          return { ...layer, active: enabled };
        } else if (layerIdsToToEnable.has(layer.id)) {
          return { ...layer, active: true };
        } else if (layerIdsToToDisable.has(layer.id)) {
          return { ...layer, active: false };
        }
        return layer;
      }),
    );
  };

  const layerIsEnabled = (id: string) => {
    return layers.find((layer) => layer.id === id)?.active;
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

  const cityBoundary = layerIsEnabled("city-boundary") ? (
    <Source id="city-boundary" type="geojson" data={NycBoundary}>
      <Layer
        beforeId="subway-lines"
        id="city-boundary"
        type="fill"
        paint={{
          "fill-color": "#088",
          "fill-opacity": 0.2,
          "fill-color-transition": { duration: 0 },
          "fill-opacity-transition": { duration: 0 },
        }}
      />
    </Source>
  ) : (
    createEmptyLayer("city-boundary", "fill")
  );

  const neighborhoodBoundaries = layerIsEnabled("neighborhoods") ? (
    <Source id="neighborhood-bounds" type="geojson" data={neighborhoodData}>
      <Layer
        beforeId="neighborhood-labels"
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

  const neighborhoodLabels = layerIsEnabled("neighborhoods") ? (
    <Source id="neighborhood-labels" type="geojson" data={neighborhoodData}>
      <Layer
        beforeId="subway-lines"
        id="neighborhood-labels"
        type="symbol"
        layout={{
          "text-field": ["get", "NTAName"],
          "text-size": 14,
          "text-variable-anchor": ["top", "bottom", "left", "right"],
          "text-radial-offset": 0.5,
          "text-justify": "auto",
          "text-anchor": "center",
        }}
      />
    </Source>
  ) : (
    createEmptyLayer("neighborhood-labels", "symbol")
  );

  const neighborhoodFill = layerIsEnabled("neighborhoods") ? (
    <Source id="neighborhood-fill" type="geojson" data={neighborhoodData}>
      <Layer
        beforeId="neighborhood-labels"
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
        beforeId="stations"
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
    <Source id="ada-projects" type="geojson" data={AdaProjects}>
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
          "icon-size": 1.2,
        }}
      />
    </Source>
  ) : (
    createEmptyLayer("ada-projects", "symbol")
  );

  const stations = layerIsEnabled("stations") ? (
    <Source id="stations" type="geojson" data={stationsData}>
      <Layer
        id="stations"
        beforeId="ada-projects"
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

      setFocusedNeighborhoodId(null);
      setFocusedStationId(id);

      //@ts-expect-error - handled is not a standard property
      e.handled = true;
    });

    // Click handler to select neighborhood
    mapRef.current.on("click", "neighborhood-fill", (e) => {
      console.log("neighborhood-fill click", e);
      //@ts-expect-error - handled is not a standard property
      if (e.handled) {
        return;
      }

      if (e.features && e.features.length > 0) {
        setFocusedStationId(null);
        setFocusedNeighborhoodId(e.features[0]?.id ?? null);
      }
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
  }, [mapRef.current, mapLoaded]);

  const elevatorsAndEscalatorsForStation = useMemo(() => {
    return ElevatorAndEscalatorInfo.filter(
      (info) =>
        info.stationcomplexid === selectedStation?.properties?.complex_id,
    );
  }, [selectedStation]);

  return (
    <div className="flex flex-col w-full h-full bg-blue-200">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: mapCenter.longitude,
          latitude: mapCenter.latitude,
          zoom: 10,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
        onLoad={() => {
          setMapLoaded(true);
        }}
      >
        {adaProjects}
        {stations}
        {stationsEntrancesExits}
        {subwayLines}
        {neighborhoodLabels}
        {neighborhoodFill}
        {neighborhoodBoundaries}
        {cityBoundary}
      </Map>
      <MapOverlay
        station={selectedStation}
        neighborhood={selectedNeighborhood}
        elevatorsAndEscalators={elevatorsAndEscalatorsForStation}
        layers={layers}
        onLayerToggle={onLayerToggle}
        selectedRoute={selectedRoute}
        onRouteSelect={setSelectedRoute}
        routeInfo={routeInfo}
      />
    </div>
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
