import * as turf from "@turf/turf";

// Function to ensure right-hand rule for polygons and multipolygons
export function enforceRightHandRule(
  geometry: GeoJSON.GeometryObject,
): GeoJSON.GeometryObject {
  switch (geometry.type) {
    case "Polygon":
      return enforceRHRForPolygon(geometry);
    case "MultiPolygon":
      return enforceRHRForMultiPolygon(geometry);
    default:
      throw new Error(
        "Unsupported geometry type for right-hand rule enforcement",
      );
  }
}

// Function to ensure the outer ring of a single polygon is clockwise
// and any inner rings (holes) are counter-clockwise
export function enforceRHRForPolygon(polygon: GeoJSON.Polygon) {
  const coordinates = polygon.coordinates;

  // Check and correct the outer ring
  if (turf.booleanClockwise(coordinates[0])) {
    coordinates[0].reverse(); // Reverse the outer ring if it is clockwise
  }

  // Check and correct inner rings (holes)
  for (let i = 1; i < coordinates.length; i++) {
    if (!turf.booleanClockwise(coordinates[i])) {
      coordinates[i].reverse(); // Reverse the hole if it is counter-clockwise
    }
  }

  return polygon;
}

// Function to apply right-hand rule enforcement to each polygon in a multipolygon
export function enforceRHRForMultiPolygon(multipolygon: GeoJSON.MultiPolygon) {
  const polygons = multipolygon.coordinates;

  // Process each polygon
  for (let j = 0; j < polygons.length; j++) {
    const polygon = polygons[j];

    // Check and correct the outer ring
    if (turf.booleanClockwise(polygon[0])) {
      polygon[0].reverse();
    }

    // Check and correct inner rings (holes)
    for (let i = 1; i < polygon.length; i++) {
      if (!turf.booleanClockwise(polygon[i])) {
        polygon[i].reverse();
      }
    }
  }

  return multipolygon;
}

export function findNearestNPointFeaturesToGeometry(
  n: number,
  pointFeatures: GeoJSON.FeatureCollection<GeoJSON.Point>,
  geometry: GeoJSON.MultiPolygon | GeoJSON.Polygon | GeoJSON.Point,
  maxDistanceMeters: number = Infinity,
) {
  const centroid = turf.centroid(geometry);

  // Filter features by maxDistance first
  const filteredFeatures = pointFeatures.features.filter((feature) => {
    const distance = turf.distance(
      centroid,
      turf.point(feature.geometry.coordinates),
      { units: "meters" },
    );
    return distance <= maxDistanceMeters;
  });

  // Sort the filtered features by distance
  filteredFeatures.sort((a, b) => {
    const distanceA = turf.distance(
      centroid,
      turf.point(a.geometry.coordinates),
      { units: "meters" },
    );
    const distanceB = turf.distance(
      centroid,
      turf.point(b.geometry.coordinates),
      { units: "meters" },
    );
    return distanceA - distanceB;
  });

  // Return the first `n` features from the sorted and filtered array
  return filteredFeatures.slice(0, n);
}
