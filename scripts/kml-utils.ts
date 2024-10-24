import fs from "fs";
import { DOMParser } from "xmldom";
import * as toGeoJSON from "@tmcw/togeojson";

type SupplementalData = {
  type: string;
  name: string;
  details?: string;
};

// Function to read KML and convert to GeoJSON
export function convertMtaAdaProjectsKmlToGeoJson(
  kmlFilePath: string,
  supplmentalDataPath: string,
) {
  // Check if the file exists
  if (!fs.existsSync(kmlFilePath)) {
    throw new Error(`KML File not found: ${kmlFilePath}`);
  }

  if (!fs.existsSync(supplmentalDataPath)) {
    throw new Error(`Supplemental data not found: ${supplmentalDataPath}`);
  }

  // Read the KML file
  const kmlText = fs.readFileSync(kmlFilePath, "utf-8");
  const parser = new DOMParser();
  const kml = parser.parseFromString(kmlText, "text/xml");

  // Convert KML to GeoJSON
  const converted = toGeoJSON.kml(kml);

  const supplementalData = JSON.parse(
    fs.readFileSync(supplmentalDataPath, "utf-8"),
  ) as SupplementalData[];

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

    const featureName = feature.properties?.name;
    const supplemental = supplementalData.find(
      (data) => data.name === featureName,
    );
    if (supplemental) {
      feature.properties = {
        ...feature.properties,
        ...supplemental,
      };
    } else {
      feature.properties = {
        ...feature.properties,
        type: "Elevator addition or replacement",
      };
    }
  });

  return converted;
}
