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

export function findNearestNPointFeaturesToGeometryConsideringBoundaries(
  n: number,
  pointFeatures: GeoJSON.FeatureCollection<GeoJSON.Point>,
  featureArg: GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon>,
  maxDistanceMetersCenter: number = Infinity,
  maxDistanceMetersBoundary: number = Infinity,
) {
  const centroid = turf.centroid(featureArg.geometry);
  let boundaryLines: GeoJSON.FeatureCollection<GeoJSON.LineString>;

  // Convert Polygon or MultiPolygon to LineString(s) representing boundaries
  if (featureArg.geometry.type === "Polygon") {
    boundaryLines = turf.polygonToLine(
      featureArg,
    ) as GeoJSON.FeatureCollection<GeoJSON.LineString>;
  } else if (featureArg.geometry.type === "MultiPolygon") {
    // Flatten MultiPolygon to multiple Polygons, then convert each to LineString
    const polygons = turf.flatten(
      featureArg,
    ) as GeoJSON.FeatureCollection<GeoJSON.Polygon>;
    boundaryLines = turf.featureCollection(
      polygons.features.map(
        (feature) =>
          turf.polygonToLine(
            feature.geometry,
          ) as GeoJSON.Feature<GeoJSON.LineString>,
      ),
    ) as GeoJSON.FeatureCollection<GeoJSON.LineString>;
  }

  // Calculate the minimum distance from each point to the geometry
  const filteredFeatures = pointFeatures.features
    .map((feature) => {
      const point = turf.point(feature.geometry.coordinates);

      // Distance from the point to the centroid
      const distanceToCentroid = turf.distance(centroid, point, {
        units: "meters",
      });

      let minBoundaryDistance = Infinity;

      // If geometry is Polygon or MultiPolygon, calculate the distance to the boundary
      if (
        featureArg.geometry.type === "Polygon" ||
        featureArg.geometry.type === "MultiPolygon"
      ) {
        const distancesToBoundary = boundaryLines.features.map((line) =>
          turf.pointToLineDistance(point, line, { units: "meters" }),
        );
        const distanceToBoundary = Math.min(...distancesToBoundary);
        minBoundaryDistance = Math.min(minBoundaryDistance, distanceToBoundary);
      }

      return {
        feature,
        distanceCenter: distanceToCentroid,
        distanceBoundary: minBoundaryDistance,
      };
    })
    .filter(({ distanceCenter, distanceBoundary }) => {
      return (
        distanceCenter <= maxDistanceMetersCenter ||
        distanceBoundary <= maxDistanceMetersBoundary
      );
    })
    .map(({ feature, distanceCenter, distanceBoundary }) => {
      return {
        feature,
        distance: Math.min(distanceCenter, distanceBoundary),
      };
    });

  // Sort features by the calculated minimum distance
  filteredFeatures.sort((a, b) => a.distance - b.distance);

  // Return the first `n` features from the sorted array
  return filteredFeatures.slice(0, n).map((item) => item.feature);
}
