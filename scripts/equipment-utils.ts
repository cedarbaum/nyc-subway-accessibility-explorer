import { ElevatorAndEscalatorAvailability } from "./datasets";
import { subMonths, parseISO, isAfter } from "date-fns";

interface AggregateStats {
  total_outages: number;
  scheduled_outages: number;
  unscheduled_outages: number;
  entrapments: number;
  am_peak_availability: number;
  pm_peak_availability: number;
  _24_hour_availability: number;
  dataMissing?: boolean;
}

// Utility function to filter and return aggregate stats
function getAggregateStatsForEquipment(
  dataset: ElevatorAndEscalatorAvailability[],
  equipmentCode: string,
  startTime: string,
  months: number,
): AggregateStats {
  const startDate = parseISO(startTime);
  const endDate = subMonths(startDate, months - 1);

  // Filter the dataset by the given equipment code and time period
  const filteredData = dataset.filter((entry) => {
    const entryDate = parseISO(entry.month);
    return (
      entry.equipment_code === equipmentCode && isAfter(entryDate, endDate)
    );
  });

  const dataMissing = filteredData.find((entry) => {
    return (
      entry.total_outages === undefined ||
      entry.scheduled_outages === undefined ||
      entry.unscheduled_outages === undefined ||
      entry.entrapments === undefined ||
      entry.am_peak_hours_available === undefined ||
      entry.am_peak_total_hours === undefined ||
      entry.pm_peak_hours_available === undefined
    );
  });

  // Aggregate statistics
  const aggregateStats = filteredData.reduce(
    (acc, entry) => {
      acc.total_outages += entry.total_outages ?? 0;
      acc.scheduled_outages += entry.scheduled_outages ?? 0;
      acc.unscheduled_outages += entry.unscheduled_outages ?? 0;
      acc.entrapments += entry.entrapments ?? 0;
      acc.am_peak_hours_available += entry.am_peak_hours_available ?? 0;
      acc.am_peak_total_hours += entry.am_peak_total_hours ?? 0;
      acc.pm_peak_hours_available += entry.pm_peak_hours_available ?? 0;
      acc.pm_peak_total_hours += entry.pm_peak_total_hours ?? 0;
      acc._24_hour_hours_available += entry._24_hour_hours_available ?? 0;
      acc._24_hour_total_hours += entry._24_hour_total_hours ?? 0;

      return acc;
    },
    {
      total_outages: 0,
      scheduled_outages: 0,
      unscheduled_outages: 0,
      entrapments: 0,
      am_peak_hours_available: 0,
      am_peak_total_hours: 0,
      pm_peak_hours_available: 0,
      pm_peak_total_hours: 0,
      _24_hour_hours_available: 0,
      _24_hour_total_hours: 0,
    },
  );

  // Calculate availability percentages
  const am_peak_availability =
    aggregateStats.am_peak_hours_available /
      aggregateStats.am_peak_total_hours || 0;
  const pm_peak_availability =
    aggregateStats.pm_peak_hours_available /
      aggregateStats.pm_peak_total_hours || 0;
  const _24_hour_availability =
    aggregateStats._24_hour_hours_available /
      aggregateStats._24_hour_total_hours || 0;

  return {
    total_outages: aggregateStats.total_outages,
    scheduled_outages: aggregateStats.scheduled_outages,
    unscheduled_outages: aggregateStats.unscheduled_outages,
    entrapments: aggregateStats.entrapments,
    am_peak_availability,
    pm_peak_availability,
    _24_hour_availability,
    dataMissing: dataMissing !== undefined,
  };
}

// Function to get aggregate stats for all equipment
export function getAggregateStatsForAllEquipment(
  dataset: ElevatorAndEscalatorAvailability[],
  startTime: string,
  months: number,
): Map<string, AggregateStats> {
  const equipmentMap = new Map<string, AggregateStats>();

  // Get a unique list of all equipment codes
  const uniqueEquipmentCodes = Array.from(
    new Set(dataset.map((entry) => entry.equipment_code)),
  );

  // Loop through each equipment code and calculate its stats
  uniqueEquipmentCodes.forEach((equipmentCode) => {
    const aggregateStats = getAggregateStatsForEquipment(
      dataset,
      equipmentCode,
      startTime,
      months,
    );
    equipmentMap.set(equipmentCode, aggregateStats);
  });

  return equipmentMap;
}
