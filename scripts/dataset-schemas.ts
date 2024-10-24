import { z } from "zod";

export const SubwayStationSchema = z.object({
  gtfs_stop_id: z.string(),
  station_id: z.string(),
  complex_id: z.string(),
  division: z.string(),
  line: z.string(),
  stop_name: z.string(),
  borough: z.string(),
  cbd: z.union([z.literal("TRUE"), z.literal("FALSE")]),
  daytime_routes: z.string(),
  structure: z.string(),
  gtfs_latitude: z.string(),
  gtfs_longitude: z.string(),
  north_direction_label: z.string(),
  south_direction_label: z.string(),
  ada: z.string(),
  ada_northbound: z.string(),
  ada_southbound: z.string(),
  georeference: z.object({
    type: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
});

export const PlatformAvailabilitySchema = z.object({
  month: z.string(),
  borough: z.string(),
  minutes_platforms_available: z.string().transform(Number),
  minutes_platforms_in_service: z.string().transform(Number),
  availability: z.string().transform(Number),
  platform_count: z.string().transform(Number),
});

export const ElevatorAndEscalatorAvailabilitySchema = z.object({
  month: z.string(),
  borough: z.string(),
  equipment_type: z.string(),
  equipment_code: z.string(),
  total_outages: z.number(),
  scheduled_outages: z.number(),
  unscheduled_outages: z.number(),
  entrapments: z.number(),
  time_since_major_improvement: z.number(),
  am_peak_availability: z.number(),
  am_peak_hours_available: z.number(),
  am_peak_total_hours: z.number(),
  pm_peak_availability: z.number(),
  pm_peak_hours_available: z.number(),
  pm_peak_total_hours: z.number(),
  _24_hour_availability: z.number(),
  _24_hour_hours_available: z.number(),
  _24_hour_total_hours: z.number(),
  station_name: z.string(),
  station_mrn: z.string(),
  station_complex_name: z.string(),
  station_complex_mrn: z.string(),
});

export const ElevatorOrEscalatorInfoSchema = z.object({
  station: z.string(),
  borough: z.string().optional(), // Allows for an empty string as a valid value
  trainno: z.string(),
  equipmentno: z.string(),
  equipmenttype: z.enum(["EL", "ES"]), // "EL" for Elevators, "ES" for Escalators
  serving: z.string(),
  ADA: z.enum(["Y", "N"]), // ADA can be 'Y' or 'N'
  isactive: z.enum(["Y", "N"]),
  nonNYCT: z.enum(["Y", "N"]),
  shortdescription: z.string(),
  linesservedbyelevator: z.string(),
  elevatorsgtfsstopid: z.string(),
  elevatormrn: z.string(),
  stationcomplexid: z.string(),
  nextadanorth: z.string().optional(),
  nextadasouth: z.string().optional(),
  redundant: z.number(),
  busconnections: z.string().optional(), // May not always be present
  alternativeroute: z.string(),
});

const parseNumberFromString = (str?: string) =>
  !str ? undefined : parseInt(str.replace(/,/g, ""), 10);
const parseFloatFromString = (str?: string) =>
  !str ? undefined : parseFloat(str);

export const CensusDataSchema = z.object({
  Year: z.literal("2020"),
  GeoType: z.string(),
  Borough: z.string(),
  GeoID: z.string().optional(),
  BCT2020: z.string().optional(),
  Name: z.string().optional(),
  CDType: z.string().optional(),
  NTAType: z.string().optional(),
  Pop1: z.string().transform(parseNumberFromString),
  Pop1P: z.string().transform(parseFloatFromString),
  Male: z.string().optional().transform(parseNumberFromString),
  MaleP: z.string().optional().transform(parseFloatFromString),
  Fem: z.string().transform(parseNumberFromString),
  FemP: z.string().transform(parseFloatFromString),
  // Continue with population by age groups
  PopU5: z.string().transform(parseNumberFromString),
  PopU5P: z.string().transform(parseFloatFromString),
  Pop5t9: z.string().transform(parseNumberFromString),
  Pop5t9P: z.string().transform(parseFloatFromString),
  // Extend to other groups
  Pop10t14: z.string().transform(parseNumberFromString),
  Pop10t14P: z.string().transform(parseFloatFromString),
  Pop15t19: z.string().transform(parseNumberFromString),
  Pop15t19P: z.string().transform(parseFloatFromString),
  // And more
  Pop20t24: z.string().transform(parseNumberFromString),
  Pop20t24P: z.string().transform(parseFloatFromString),
  Pop25t29: z.string().transform(parseNumberFromString),
  Pop25t29P: z.string().transform(parseFloatFromString),
  // Continue adding all other age groups...
  Pop30t34: z.string().transform(parseNumberFromString),
  Pop30t34P: z.string().transform(parseFloatFromString),
  // Elderly population
  Pop65t69: z.string().transform(parseNumberFromString),
  Pop70t74: z.string().transform(parseNumberFromString),
  Pop75t79: z.string().transform(parseNumberFromString),
  Pop80t84: z.string().transform(parseNumberFromString),
  Pop85pl: z.string().transform(parseNumberFromString),
  // Demographic details
  MdAge: z.string().transform(parseFloatFromString),
  MdAgeP: z.string().transform(parseFloatFromString),
  PopU18: z.string().transform(parseNumberFromString),
  PopU18P: z.string().transform(parseFloatFromString),
  Pop65pl: z.string().transform(parseNumberFromString),
  Pop65plP: z.string().transform(parseFloatFromString),
  // Dependency ratios
  AgDpdRt: z.string().transform(parseFloatFromString),
  AgDpdRtP: z.string().transform(parseFloatFromString),
  OdAgDpdRt: z.string().transform(parseFloatFromString),
  OdAgDpdRtP: z.string().transform(parseFloatFromString),
  ChldDpdRt: z.string().transform(parseFloatFromString),
  ChldDpdRtP: z.string().transform(parseFloatFromString),
  // Housing data if present
  HUnits: z.string().optional().transform(parseNumberFromString),
  HUnitsP: z.string().optional().transform(parseFloatFromString),
  // Add all fields with similar transformations
});

// Schema for a GTFS route
export const RouteSchema = z.object({
  route_id: z.string(),
  agency_id: z.string().optional(), // Optional because not all feeds must specify it
  route_short_name: z.string(),
  route_long_name: z.string(),
  route_type: z.string().transform(Number),
  route_url: z.string().optional(),
  route_color: z.string().optional(),
  route_text_color: z.string().optional(),
});

// Schema for a GTFS stop
export const StopSchema = z.object({
  stop_id: z.string(),
  stop_code: z.string().optional(),
  stop_name: z.string(),
  stop_desc: z.string().optional(),
  stop_lat: z.string().transform(Number),
  stop_lon: z.string().transform(Number),
  zone_id: z.string().optional(),
  stop_url: z.string().optional(),
  location_type: z.string().optional().transform(Number),
  parent_station: z.string().optional(),
});

// Schema for a GTFS trip
export const TripSchema = z.object({
  route_id: z.string(),
  service_id: z.string(),
  trip_id: z.string(),
  trip_headsign: z.string().optional(),
  trip_short_name: z.string().optional(),
  direction_id: z.string().optional().transform(Number),
  block_id: z.string().optional(),
  shape_id: z.string().optional(),
  wheelchair_accessible: z.string().optional().transform(Number),
  bikes_allowed: z.string().optional().transform(Number),
});

// Schema for a GTFS Stop Time
export const StopTimeSchema = z.object({
  trip_id: z.string(),
  arrival_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/), // Validate as HH:MM:SS
  departure_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/), // Validate as HH:MM:SS
  stop_id: z.string(),
  stop_sequence: z.string().transform(Number),
  stop_headsign: z.string().optional(),
  pickup_type: z.string().optional().transform(Number),
  drop_off_type: z.string().optional().transform(Number),
  shape_dist_traveled: z.string().optional().transform(Number),
  timepoint: z.string().optional().transform(Number),
});

export const GtfsSchema = z.object({
  routes: z.array(RouteSchema),
  stops: z.array(StopSchema),
  trips: z.array(TripSchema),
  tripStopTimes: z.array(StopTimeSchema),
});
