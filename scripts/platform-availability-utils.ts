import { parseISO, max, subMonths, isWithinInterval } from "date-fns";
import { PlatformAvailability } from "./datasets";

// Helper function to find the latest month in the dataset
function getLatestMonth(data: PlatformAvailability[]): Date {
  return max(data.map((entry) => parseISO(entry.month)));
}

// Helper function to check if a date is within the past 6 months
function isWithinLastSixMonths(date: Date, latestDate: Date): boolean {
  const sixMonthsAgo = subMonths(latestDate, 6);
  return isWithinInterval(date, { start: sixMonthsAgo, end: latestDate });
}

// Function to calculate the 6-month aggregate availability for each borough
export function calculateSixMonthAvailability(
  platformAvailability: PlatformAvailability[],
) {
  // Find the latest month in the dataset
  const latestMonth = getLatestMonth(platformAvailability);

  // Filter the data to get records within the last 6 months from the latest month
  const sixMonthData = platformAvailability.filter((entry) =>
    isWithinLastSixMonths(parseISO(entry.month), latestMonth),
  );

  // Aggregate total availability by borough over the past 6 months using a Map
  const availabilityByBorough = new Map<
    string,
    { totalAvailable: number; totalInService: number }
  >();

  sixMonthData.forEach((entry) => {
    const borough = entry.borough;
    const minutesAvailable = entry.minutes_platforms_available;
    const minutesInService = entry.minutes_platforms_in_service;

    if (!availabilityByBorough.has(borough)) {
      availabilityByBorough.set(borough, {
        totalAvailable: 0,
        totalInService: 0,
      });
    }

    const boroughData = availabilityByBorough.get(borough)!;
    boroughData.totalAvailable += minutesAvailable;
    boroughData.totalInService += minutesInService;
  });

  // Calculate availability percentage for each borough
  const result = Array.from(availabilityByBorough.entries()).map(
    ([borough, totals]) => ({
      borough,
      availability: totals.totalInService / totals.totalAvailable,
    }),
  );

  return result;
}
