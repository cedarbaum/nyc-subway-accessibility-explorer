import path from "path";
import dotenv from "dotenv";
import {
  copyDatasetToOutput,
  loadDatasetById,
  ElevatorOrEscalatorInfo,
  CensusData,
  writeModifiedDatasetJsonToOutput,
  getDatasetPathById,
  ElevatorAndEscalatorAvailability,
  RidershipData,
  PlatformAvailability,
  writeDatasetJsonToOutput,
} from "./datasets";
import {
  enforceRightHandRule,
  findNearestNPointFeaturesToGeometry,
} from "./gis-utils";
import { mapRouteIdToColor } from "./mta-utils";
import { convertMtaAdaProjectsKmlToGeoJson } from "./kml-utils";
import { convertLinePointsFileToGeoJSON } from "./route-geojson-utils";
import { getAggregateStatsForAllEquipment } from "./equipment-utils";
import { booleanPointInPolygon, centroid } from "@turf/turf";
import { calculateSixMonthAvailability } from "./platform-availability-utils";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const datasetsToSkip = process.env.SKIP_DATASETS?.split(",") || [];

async function main(): Promise<void> {
  try {
    console.log("Will skip datasets:", datasetsToSkip);

    // Copy these datasets unchanged to the output directory
    copyDatasetToOutput("subway-entrances-exits");

    const boroughBoundaries = await loadDatasetById<GeoJSON.FeatureCollection>(
      "borough-boundaries-geojson",
    );

    // Assign each borough a feature ID based on the borough name
    boroughBoundaries.features.forEach((feature, index) => {
      feature.id = index;
    });

    // Load platform availability data
    const platformAvailability = await loadDatasetById<PlatformAvailability[]>(
      "station-platform-availability",
    );
    const latestMonthWithData = platformAvailability.sort((a, b) => {
      return a.month.localeCompare(b.month);
    })[platformAvailability.length - 1].month;
    console.log(
      "Latest month with platform availability data:",
      latestMonthWithData,
    );

    const availabilityByBorough =
      calculateSixMonthAvailability(platformAvailability);
    console.log("Platform availability by borough:", availabilityByBorough);

    boroughBoundaries.features.forEach((feature) => {
      const boroughName = feature.properties?.boroname;
      const availabilityForBorough = availabilityByBorough.find(
        (entry) => entry.borough === boroughName,
      );
      if (availabilityForBorough) {
        feature.properties = {
          ...feature.properties,
          platform_availability: availabilityForBorough.availability,
        };
      } else {
        console.warn(
          "No platform availability data found for borough:",
          boroughName,
        );
        // Set to -1 to indicate missing data
        feature.properties = {
          ...feature.properties,
          platform_availability: -1,
        };
      }
    });

    const boroughCenters = boroughBoundaries.features.map((feature) => {
      const boroughCenter = centroid(
        feature as GeoJSON.Feature<GeoJSON.MultiPolygon>,
      );

      return {
        type: "Feature",
        properties: {
          name: feature.properties?.boroname,
          platform_availability: feature.properties?.platform_availability,
        },
        geometry: boroughCenter.geometry,
      } as GeoJSON.Feature<GeoJSON.Point>;
    });

    writeDatasetJsonToOutput("borough-centers-geojson", {
      type: "FeatureCollection",
      features: boroughCenters,
    });

    writeModifiedDatasetJsonToOutput(
      "borough-boundaries-geojson",
      boroughBoundaries,
    );

    // ETL of MTA accessibility projects
    const kmlPath = getDatasetPathById("mta-ada-projects");
    const suppplmentalDataPath = getDatasetPathById(
      "mta-ada-projects-supplement",
    );
    const adaProjectsGeoJSON = convertMtaAdaProjectsKmlToGeoJson(
      kmlPath,
      suppplmentalDataPath,
    ) as GeoJSON.FeatureCollection<GeoJSON.Point>;
    writeModifiedDatasetJsonToOutput("mta-ada-projects", adaProjectsGeoJSON);

    // ETL of station data
    const stationsGeoJSON = await loadDatasetById<
      GeoJSON.FeatureCollection<GeoJSON.Point>
    >("mta-subway-stations-geojson");
    const transformedFeatures = [];
    const mergedStationIndex = new Set<number>();
    for (let i = 0; i < stationsGeoJSON.features.length; i++) {
      if (mergedStationIndex.has(i)) {
        continue;
      }

      const station = stationsGeoJSON.features[i];
      transformedFeatures.push(station);

      const coords = station.geometry.coordinates;
      for (let j = i + 1; j < stationsGeoJSON.features.length; j++) {
        const otherStation = stationsGeoJSON.features[j];
        const otherCoords = otherStation.geometry.coordinates;
        if (coords[0] === otherCoords[0] && coords[1] === otherCoords[1]) {
          console.log(
            "Duplicate station found location found, merging:",
            station.properties?.stop_name,
          );
          for (const [key, value] of Object.entries(
            otherStation.properties || {},
          )) {
            if (station.properties![key] !== otherStation.properties![key]) {
              station.properties![key] = `${station.properties![key]},${value}`;
            }
          }

          mergedStationIndex.add(j);
        }
      }
    }

    const mergedStationsGeoJSON = {
      ...stationsGeoJSON,
      features: transformedFeatures,
    };

    mergedStationsGeoJSON.features.forEach((feature) => {
      // Label stations with ADA accessibility
      const adaSouthbound = feature?.properties?.ada_southbound === "1";
      const adaNorthbound = feature?.properties?.ada_northbound === "1";
      let adaScore = 0;
      if (adaSouthbound && adaNorthbound) {
        feature!.properties!.ada = "full";
        adaScore = 10;
      } else if (adaSouthbound) {
        feature!.properties!.ada = "southbound";
        adaScore = 5;
      } else if (adaNorthbound) {
        feature!.properties!.ada = "northbound";
        adaScore = 5;
      } else {
        feature!.properties!.ada = "no";
      }

      feature!.properties!.ada_score = adaScore;
    });

    // Associate ongoing/completed ADA projects with stations
    adaProjectsGeoJSON.features.forEach((project) => {
      const projectStatus = project.properties?.status;
      if (projectStatus === "Completed" || projectStatus === "Ongoing") {
        const projectLocation = project.geometry.coordinates;
        const nearestStations = findNearestNPointFeaturesToGeometry(
          1,
          mergedStationsGeoJSON,
          { type: "Point", coordinates: projectLocation },
          200,
        );
        if (nearestStations.length > 0) {
          const nearestStation = nearestStations[0];
          if (!nearestStation.properties?.ada_projects) {
            nearestStation.properties!.ada_projects = [];
          }
          nearestStation.properties!.ada_projects.push({
            id: project.id,
            name: project.properties?.name,
            status: projectStatus,
            type: project.properties?.type,
            details: project.properties?.details,
          });
        } else {
          console.warn(
            "No station found within 100 meters of project:",
            project.properties?.name,
          );
        }
      }
    });

    // Load ridership data and assocaite with stations
    const ridershipData = await loadDatasetById<RidershipData[]>(
      "mta-last-full-month-ridership",
    );
    mergedStationsGeoJSON.features.forEach((station) => {
      const stationComplexId = station.properties?.complex_id;
      if (stationComplexId) {
        const ridershipDataForStation = ridershipData.find(
          (data) => data.station_complex_id === stationComplexId,
        );
        if (ridershipDataForStation) {
          station.properties = {
            ...station.properties,
            ridership_month: "September, 2024",
            ridership_last_full_month: ridershipDataForStation.ridership,
          };
        } else {
          console.warn(
            "No ridership data found for station:",
            station.properties?.stop_name,
          );
        }
      }
    });

    writeModifiedDatasetJsonToOutput(
      "mta-subway-stations-geojson",
      mergedStationsGeoJSON,
    );

    // ETL of neighborhood data
    const censusData = await loadDatasetById<CensusData[]>("2020-census-data");
    const nycNeighborhoods =
      await loadDatasetById<GeoJSON.FeatureCollection>("nyc-neighborhoods");
    const accessibilityStatsForNeighborhoods = new Map<string, number>();
    for (const neighborhood of nycNeighborhoods.features) {
      const neighborhoodData = censusData.find(
        (data) =>
          data.GeoType === "NTA2020" &&
          data.GeoID === neighborhood.properties?.NTA2020,
      );
      if (neighborhoodData) {
        neighborhood.properties = {
          ...neighborhood.properties,
          ...neighborhoodData,
        };
      } else {
        console.log(
          "No census data found for neighborhood:",
          neighborhood.properties?.NTA2020,
        );
      }

      // Convert all polygons to MultiPolygons
      if (neighborhood.geometry.type === "Polygon") {
        neighborhood.geometry = enforceRightHandRule({
          type: "MultiPolygon",
          coordinates: neighborhood.geometry.coordinates.map((polygon) => [
            polygon,
          ]),
        }) as GeoJSON.MultiPolygon;
      }

      // First get all stations within the neighborhood
      const stationsToScore = mergedStationsGeoJSON.features.filter(
        (station) => {
          const stationLocation = station.geometry.coordinates;
          return booleanPointInPolygon(
            stationLocation,
            neighborhood.geometry as GeoJSON.MultiPolygon,
          );
        },
      );

      const n = 5;
      const numStationsInNeighborhood = stationsToScore.length;
      if (numStationsInNeighborhood < n) {
        const stationsNotInNeighborhood = mergedStationsGeoJSON.features.filter(
          (station) =>
            !stationsToScore.find(
              (s) =>
                s.properties?.station_id === station.properties?.station_id,
            ),
        );
        const stationsNotInNeighborhoodFeatureCollection = {
          type: "FeatureCollection",
          features: stationsNotInNeighborhood,
        } as GeoJSON.FeatureCollection<GeoJSON.Point>;

        const nearestStations = findNearestNPointFeaturesToGeometry(
          n - numStationsInNeighborhood,
          stationsNotInNeighborhoodFeatureCollection,
          neighborhood.geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon,
          1600,
        );
        stationsToScore.push(...nearestStations);
      }

      const accessibleStations = stationsToScore.filter(
        (station) =>
          station.properties?.ada == "full" ||
          station.properties?.ada == "southbound" ||
          station.properties?.ada == "northbound",
      );
      const numAccessibleStations = accessibleStations.length;
      const accessibleStationScore = stationsToScore.length
        ? numAccessibleStations / stationsToScore.length
        : 0;

      const neighborhoodPopulation = neighborhood.properties?.Pop1;
      const accessibleStationsPer10000 =
        neighborhoodPopulation > 0
          ? numAccessibleStations / (neighborhoodPopulation / 10000)
          : 0;
      const neighborhooId = neighborhood.properties?.NTA2020;
      accessibilityStatsForNeighborhoods.set(
        neighborhooId,
        accessibleStationsPer10000,
      );

      neighborhood.properties = {
        ...neighborhood.properties,
        num_nearest_stations: n,
        num_accessible_stations: numAccessibleStations,
        accessible_station_score: accessibleStationScore,
      };
    }

    const maxAccessibility = Math.max(
      ...Array.from(accessibilityStatsForNeighborhoods.values()),
    );
    const minAccessibility = Math.min(
      ...Array.from(accessibilityStatsForNeighborhoods.values()),
    );
    const scale = maxAccessibility - minAccessibility;
    for (const neighborhood of nycNeighborhoods.features) {
      const neighborhoodId = neighborhood.properties?.NTA2020;
      const accessibility =
        accessibilityStatsForNeighborhoods.get(neighborhoodId)!;
      const accessibilityScore = (accessibility - minAccessibility) / scale;
      neighborhood.properties = {
        ...neighborhood.properties,
        accessible_station_score_by_pop: accessibilityScore,
      };
    }

    writeModifiedDatasetJsonToOutput("nyc-neighborhoods", nycNeighborhoods);

    // Load subway lines data
    const subwayLines = await loadDatasetById<GeoJSON.FeatureCollection>(
      "subway-lines-geojson",
    );
    for (const feature of subwayLines.features) {
      const routeId = feature.properties?.rt_symbol;
      if (routeId) {
        feature.properties!.color = mapRouteIdToColor(routeId);
      }
    }

    // Append SIR feature (does not exist in the original dataset)
    const sirLinePointsFilePath = getDatasetPathById("sir-line-points");
    const sirLineFeature = convertLinePointsFileToGeoJSON(
      sirLinePointsFilePath,
      "SIR",
      mapRouteIdToColor("SIR"),
    );
    subwayLines.features.push(sirLineFeature);

    writeModifiedDatasetJsonToOutput("subway-lines-geojson", subwayLines);

    //Load elevator and escalator availability data
    if (!datasetsToSkip.includes("mta-elevators-and-escalators")) {
      const elevatorAndEscalatorAvailability = await loadDatasetById<
        ElevatorAndEscalatorAvailability[]
      >("elevator-and-escalator-availability");
      const startTime = "2024-09-01T00:00:00.000";
      const months = 6;
      const equipmentStats = getAggregateStatsForAllEquipment(
        elevatorAndEscalatorAvailability,
        startTime,
        months,
      );

      const elevatorAndEscalatorInfo = await loadDatasetById<
        ElevatorOrEscalatorInfo[]
      >("mta-elevators-and-escalators");
      const minimaElevatorAndEscalatorInfo = elevatorAndEscalatorInfo.map(
        (elevator) => {
          const statsForEquipment = equipmentStats.get(elevator.equipmentno);
          if (!statsForEquipment) {
            console.warn(
              `No equipment stats found for ${elevator.equipmentno}`,
            );
          }

          return {
            station: elevator.station,
            stationcomplexid: elevator.stationcomplexid,
            equipmentno: elevator.equipmentno,
            equipmenttype: elevator.equipmenttype,
            ADA: elevator.ADA,
            isactive: elevator.isactive,
            shortdescription: elevator.shortdescription,
            trainno: elevator.trainno,
            linesservedbyelevator: elevator.linesservedbyelevator,
            serving: elevator.serving,
            stats: statsForEquipment,
          };
        },
      );

      writeModifiedDatasetJsonToOutput(
        "mta-elevators-and-escalators",
        minimaElevatorAndEscalatorInfo,
      );
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
