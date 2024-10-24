import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { parse } from "csv-parse";
import StreamZip from "node-stream-zip";
import { z } from "zod";
import {
  GtfsSchema,
  CensusDataSchema,
  ElevatorAndEscalatorAvailabilitySchema,
  ElevatorOrEscalatorInfoSchema,
  PlatformAvailabilitySchema,
  SubwayStationSchema,
} from "./dataset-schemas";

export type GtfsData = z.infer<typeof GtfsSchema>;
export type SubwayStation = z.infer<typeof SubwayStationSchema>;
export type PlatformAvailability = z.infer<typeof PlatformAvailabilitySchema>;
export type ElevatorAndEscalatorAvailability = z.infer<
  typeof ElevatorAndEscalatorAvailabilitySchema
>;
export type ElevatorOrEscalatorInfo = z.infer<
  typeof ElevatorOrEscalatorInfoSchema
>;
export type CensusData = z.infer<typeof CensusDataSchema>;

export enum DatasetSource {
  NyOpenDataAPI = "NyOpenDataAPI",
  NycOpenDataAPI = "NycOpenDataAPI",
  GTFS = "GTFS",
  Other = "Other",
}

export enum DatasetType {
  JSON = "JSON",
  GeoJSON = "GeoJSON",
  KML = "KML",
  CSV = "CSV",
  GTFS = "GTFS",
}

export type DatasetId =
  | "mta-subway-gtfs"
  | "nyc-neighborhoods"
  | "mta-elevators-and-escalators"
  | "subway-entrances-exits"
  | "mta-subway-stations"
  | "mta-subway-stations-geojson"
  | "station-platform-availability"
  | "elevator-and-escalator-availability"
  | "borough-boundaries-geojson"
  | "subway-lines-geojson"
  | "2020-census-data"
  | "sir-line-points"
  | "mta-ada-projects"
  | "mta-ada-projects-supplement";

export interface Dataset {
  id: DatasetId;
  url: string;
  source: DatasetSource;
  type: DatasetType;
  schema: z.ZodObject<any> | z.ZodArray<any> | z.ZodAny;
  skipDownload?: boolean;
}

export const datasets: Dataset[] = [
  {
    id: "mta-subway-gtfs",
    url: "http://web.mta.info/developers/data/nyct/subway/google_transit.zip",
    source: DatasetSource.GTFS,
    type: DatasetType.GTFS,
    schema: GtfsSchema,
  },
  {
    id: "mta-elevators-and-escalators",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene_equipments.json",
    source: DatasetSource.Other,
    type: DatasetType.JSON,
    schema: z.array(ElevatorOrEscalatorInfoSchema),
  },
  {
    id: "subway-entrances-exits",
    url: "https://data.ny.gov/resource/i9wp-a4ja.geojson",
    source: DatasetSource.NyOpenDataAPI,
    type: DatasetType.GeoJSON,
    schema: z.any(),
  },
  {
    id: "mta-subway-stations",
    url: "https://data.ny.gov/resource/39hk-dx4f.json",
    source: DatasetSource.NyOpenDataAPI,
    type: DatasetType.JSON,
    schema: z.array(SubwayStationSchema),
  },
  {
    id: "mta-subway-stations-geojson",
    url: "https://data.ny.gov/resource/39hk-dx4f.geojson",
    source: DatasetSource.NyOpenDataAPI,
    type: DatasetType.GeoJSON,
    schema: z.any(),
  },
  {
    id: "station-platform-availability",
    url: "https://data.ny.gov/resource/thh2-syn7.json",
    source: DatasetSource.NyOpenDataAPI,
    type: DatasetType.JSON,
    schema: z.array(PlatformAvailabilitySchema),
  },
  {
    id: "elevator-and-escalator-availability",
    url: "https://data.ny.gov/resource/rc78-7x78.csv",
    source: DatasetSource.NyOpenDataAPI,
    type: DatasetType.CSV,
    schema: z.array(ElevatorAndEscalatorAvailabilitySchema),
  },
  {
    id: "nyc-neighborhoods",
    url: "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/NYC_Neighborhood_Tabulation_Areas_2020/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=pgeojson",
    source: DatasetSource.Other,
    type: DatasetType.GeoJSON,
    schema: z.any(),
  },
  {
    id: "borough-boundaries-geojson",
    url: "https://data.cityofnewyork.us/api/geospatial/qefp-jxjk?method=export&format=GeoJSON",
    source: DatasetSource.NycOpenDataAPI,
    type: DatasetType.GeoJSON,
    schema: z.any(),
  },
  {
    id: "subway-lines-geojson",
    url: "https://data.cityofnewyork.us/api/geospatial/3qz8-muuu?method=export&format=GeoJSON",
    source: DatasetSource.NycOpenDataAPI,
    type: DatasetType.GeoJSON,
    schema: z.any(),
  },
  {
    id: "2020-census-data",
    url: "https://www.nyc.gov/site/planning/data-maps/open-data.page#census",
    source: DatasetSource.Other,
    type: DatasetType.CSV,
    schema: z.array(CensusDataSchema),
    skipDownload: true,
  },
  {
    id: "mta-ada-projects",
    url: "https://www.google.com/maps/d/viewer?mid=1KyAOi9J92POQ7c_v-471XlbLvrOmIDQ&femb=1&ll=40.711780885201954%2C-73.99431625&z=12",
    source: DatasetSource.Other,
    type: DatasetType.KML,
    schema: z.any(),
    skipDownload: true,
  },
  {
    id: "mta-ada-projects-supplement",
    url: "https://new.mta.info/project/station-accessibility-upgrades",
    source: DatasetSource.Other,
    type: DatasetType.JSON,
    schema: z.any(),
    skipDownload: true,
  },
  {
    id: "sir-line-points",
    url: "N/A",
    source: DatasetSource.Other,
    type: DatasetType.JSON,
    schema: z.any(),
    skipDownload: true,
  },
];

function parseCSV(data: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    parse(
      data,
      {
        columns: true,
        skip_empty_lines: true,
      },
      (err, output) => {
        if (err) reject(err);
        else resolve(output);
      },
    );
  });
}

export async function loadDatasetById<T>(id: DatasetId): Promise<T> {
  const dataset = datasets.find((dataset) => dataset.id === id);
  if (!dataset) {
    throw new Error(`Dataset ${id} does not exist`);
  }
  return loadDataset(dataset);
}

export async function loadDataset<T>(dataset: Dataset): Promise<T> {
  const downloadPath = getDatasetPath(dataset);
  if (!existsSync(downloadPath)) {
    throw new Error(`Dataset ${dataset.id} does not exist`);
  }

  if (!dataset.schema) {
    throw new Error(`Dataset ${dataset.id} does not have a schema`);
  }

  const data = readFileSync(downloadPath, "utf-8"); // Read file synchronously

  switch (dataset.type) {
    case DatasetType.JSON:
    case DatasetType.GeoJSON:
      // Validate JSON data using the attached schema
      return dataset.schema.parse(JSON.parse(data)) as T;
    case DatasetType.CSV:
      // Parse CSV data and validate using the attached schema
      const records = await parseCSV(data);
      return dataset.schema.parse(records) as T;
    case DatasetType.GTFS:
      // Unzip GTFS file and return the path to the extracted directory
      const zip = new StreamZip.async({ file: downloadPath });

      const stopsFile = await zip.entryData("stops.txt");
      const stops = await parseCSV(stopsFile.toString("utf-8"));

      const routesFile = await zip.entryData("routes.txt");
      const routes = await parseCSV(routesFile.toString("utf-8"));

      const tripsFile = await zip.entryData("trips.txt");
      const trips = await parseCSV(tripsFile.toString("utf-8"));

      const tripStopTimesFile = await zip.entryData("stop_times.txt");
      const tripStopTimes = await parseCSV(tripStopTimesFile.toString("utf-8"));

      await zip.close();

      const gtfsData = {
        stops,
        routes,
        trips,
        tripStopTimes,
      };
      return dataset.schema.parse(gtfsData) as T;
    default:
      throw new Error(`Unsupported dataset type: ${dataset.type}`);
  }
}

export function getDatasetPathById(id: DatasetId): string {
  const dataset = datasets.find((dataset) => dataset.id === id);
  if (!dataset) {
    throw new Error(`Dataset ${id} does not exist`);
  }
  return getDatasetPath(dataset);
}

export function getDatasetPath(dataset: Dataset): string {
  const downloadPath = path.join(__dirname, "..", "datasets");
  const fileExtension = getDatasetExtension(dataset);
  const fileName = `${dataset.id}${fileExtension}`;
  const filePath = path.join(downloadPath, fileName);
  return filePath;
}

export function copyDatasetToOutput(
  datasetId: DatasetId,
  outDir: string = "gis-data",
): void {
  const dataset = datasets.find((dataset) => dataset.id === datasetId);
  if (!dataset) {
    throw new Error(`Dataset ${datasetId} does not exist`);
  }
  const filePath = getDatasetPath(dataset);
  const fileExtension = getDatasetExtension(dataset);
  const fileName = `${dataset.id}${fileExtension}`;
  const outputFilePath = path.join(__dirname, "..", outDir, fileName);
  console.log(`Copying ${filePath} to ${outputFilePath}`);
  copyFileSync(filePath, outputFilePath);
}

export function writeModifiedDatasetJsonToOutput(
  datasetId: DatasetId,
  data: any,
  outDir: string = "gis-data",
): void {
  const dataset = datasets.find((dataset) => dataset.id === datasetId);
  if (!dataset) {
    throw new Error(`Dataset ${datasetId} does not exist`);
  }
  const fileName = `${dataset.id}.json`;
  const outputFilePath = path.join(__dirname, "..", outDir, fileName);
  console.log(`Writing modified dataset $${datasetId} to ${outputFilePath}`);
  const jsonData = JSON.stringify(data);
  writeFileSync(outputFilePath, jsonData);
}

export function getDatasetExtension(dataset: Dataset): string {
  switch (dataset.type) {
    case DatasetType.CSV:
      return ".csv";
    case DatasetType.GTFS:
      return ".zip";
    case DatasetType.JSON:
    case DatasetType.GeoJSON:
      return ".json";
    case DatasetType.KML:
      return ".kml";
    default:
      throw new Error(`Unsupported dataset type: ${dataset.type}`);
  }
}
