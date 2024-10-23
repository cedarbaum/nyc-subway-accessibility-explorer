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
