import fs from "fs";
import { DOMParser } from "xmldom";
import * as toGeoJSON from "@tmcw/togeojson";

// Function to read KML and convert to GeoJSON
export function convertMtaAdaProjectsKmlToGeoJson(kmlFilePath: string) {
  // Check if the file exists
  if (!fs.existsSync(kmlFilePath)) {
    throw new Error(`File not found: ${kmlFilePath}`);
  }

  // Read the KML file
  const kmlText = fs.readFileSync(kmlFilePath, "utf-8");
  const parser = new DOMParser();
  const kml = parser.parseFromString(kmlText, "text/xml");

  // Convert KML to GeoJSON
  const converted = toGeoJSON.kml(kml);

  // Modify feature properties based on styleUrl to mark project status
  converted.features.forEach((feature) => {
    if (feature.properties?.styleUrl) {
      // Check the styleUrl to determine the project status
      if (feature.properties.styleUrl.includes("icon-1769-0288D1-nodesc")) {
        feature.properties.status = "Completed";
      } else if (
        feature.properties.styleUrl.includes("icon-1590-A52714-nodesc")
      ) {
        feature.properties.status = "Ongoing";
      }
    }
  });

  return converted;
}
