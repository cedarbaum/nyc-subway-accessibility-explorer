import { z } from "zod";

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
