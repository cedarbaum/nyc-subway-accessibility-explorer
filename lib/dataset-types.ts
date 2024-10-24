export type Station = {
  stop_name: string;
  station_id: string;
  daytime_routes: string;
  ada: string;
  ada_southbound: string;
  ada_northbound: string;
  ada_notes?: string | null;
};
