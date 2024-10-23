import fs from "fs";

interface Point {
  latitude: number;
  longitude: number;
}

interface InputJSON {
  id: string;
  points: Point[];
}

export function convertLinePointsFileToGeoJSON(
  inputFile: string,
  routeId: string,
  color: string,
): GeoJSON.Feature {
  const fileContents = fs.readFileSync(inputFile, "utf-8");
  const json = JSON.parse(fileContents) as InputJSON;

  return {
    type: "Feature",
    properties: {
      trip_id: json.id,
      rt_symbol: routeId,
      color,
    },
    geometry: {
      type: "LineString",
      coordinates: json.points.map((point) => [
        point.longitude,
        point.latitude,
      ]),
    },
  };
}
