import path from "path";
import dotenv from "dotenv";
import {
  copyDatasetToOutput,
  loadDatasetById,
  ElevatorOrEscalatorInfo,
  CensusData,
  writeModifiedDatasetJsonToOutput,
  getDatasetPathById,
} from "./datasets";
import {
  enforceRightHandRule,
  findNearestNPointFeaturesToGeometry,
} from "./gis-utils";
import { mapRouteIdToColor } from "./mta-utils";
import { convertMtaAdaProjectsKmlToGeoJson } from "./kml-utils";
import { convertLinePointsFileToGeoJSON } from "./route-geojson-utils";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

async function main(): Promise<void> {
  try {
    // Copy these datasets unchanged to the output directory
    copyDatasetToOutput("borough-boundaries-geojson");
    copyDatasetToOutput("subway-entrances-exits");

    // ETL of MTA accessibility projects
    const kmlPath = getDatasetPathById("mta-ada-projects");
    const adaProjectsGeoJSON = convertMtaAdaProjectsKmlToGeoJson(
      kmlPath,
    ) as GeoJSON.FeatureCollection<GeoJSON.Point>;
    writeModifiedDatasetJsonToOutput("mta-ada-projects", adaProjectsGeoJSON);

    // ETL of station data
    const stationsGeoJSON = await loadDatasetById<
      GeoJSON.FeatureCollection<GeoJSON.Point>
    >("mta-subway-stations-geojson");
    const transformedFeatures = [];
    const mergedStationIndex = new Set<number>();
    for (let i = 0; i < stationsGeoJSON.features.length; i++) {
      const station = stationsGeoJSON.features[i];
      transformedFeatures.push(station);

      if (mergedStationIndex.has(i)) {
        continue;
      }

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
            name: project.properties?.name,
            status: projectStatus,
          });
        } else {
          console.warn(
            "No station found within 100 meters of project:",
            project.properties?.name,
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

      const n = 10;
      const nearestStations = findNearestNPointFeaturesToGeometry(
        n,
        mergedStationsGeoJSON,
        neighborhood.geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon,
        1600,
      );

      const accessibleStations = nearestStations.filter(
        (station) =>
          station.properties?.ada == "full" ||
          station.properties?.ada == "southbound" ||
          station.properties?.ada == "northbound",
      );
      const numAccessibleStations = accessibleStations.length;
      const accessibleStationScore = numAccessibleStations / n;
      neighborhood.properties = {
        ...neighborhood.properties,
        num_nearest_stations: n,
        num_accessible_stations: numAccessibleStations,
        accessible_station_score: accessibleStationScore,
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

    // Load elevator and escalator availability data
    //const elevatorAndEscalatorAvailability = await loadDatasetById<ElevatorAndEscalatorAvailability[]>("elevator-and-escalator-availability");

    const elevatorAndEscalatorInfo = await loadDatasetById<
      ElevatorOrEscalatorInfo[]
    >("mta-elevators-and-escalators");
    const minimaElevatorAndEscalatorInfo = elevatorAndEscalatorInfo.map(
      (elevator) => ({
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
      }),
    );

    writeModifiedDatasetJsonToOutput(
      "mta-elevators-and-escalators",
      minimaElevatorAndEscalatorInfo,
    );
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
