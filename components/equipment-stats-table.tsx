import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDecimalAsPercentage } from "@/lib/number-format-utils";

interface EquipmentStat {
  dataMissing?: boolean;
  outages?: number;
  peakAmAvailability?: number;
  peakPmAvailability?: number;
}

interface EquipmentStatsTableProps {
  stats: EquipmentStat;
}

function getOutageColor(outages?: number, dataMissing?: boolean): string {
  if (outages === undefined || dataMissing)
    return "bg-gray-100 dark:bg-gray-900";
  if (outages < 10) return "bg-green-100 dark:bg-green-900";
  if (outages < 50) return "bg-yellow-100 dark:bg-yellow-900";
  return "bg-red-100 dark:bg-red-900";
}

function getAvailabilityColor(
  availability?: number,
  dataMissing?: boolean,
): string {
  if (availability === undefined || dataMissing)
    return "bg-gray-100 dark:bg-gray-900";
  if (availability >= 0.98) return "bg-green-100 dark:bg-green-900";
  if (availability >= 0.9) return "bg-yellow-100 dark:bg-yellow-900";
  return "bg-red-100 dark:bg-red-900";
}

export default function EquipmentStatsTable({
  stats,
}: EquipmentStatsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">Outages</TableHead>
            <TableHead className="text-right">
              Peak AM Availability
            </TableHead>
            <TableHead className="text-right">
              Peak PM Availability
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              className={`text-right font-medium ${getOutageColor(stats.outages)}`}
            >
              {stats.outages !== undefined && !stats.dataMissing
                ? stats.outages
                : "N/A"}
            </TableCell>
            <TableCell
              className={`text-right font-medium ${getAvailabilityColor(stats.peakAmAvailability)}`}
            >
              {stats.peakAmAvailability !== undefined && !stats.dataMissing
                ? formatDecimalAsPercentage(stats.peakAmAvailability)
                : "N/A"}
            </TableCell>
            <TableCell
              className={`text-right font-medium ${getAvailabilityColor(stats.peakPmAvailability)}`}
            >
              {stats.peakPmAvailability !== undefined && !stats.dataMissing
                ? formatDecimalAsPercentage(stats.peakPmAvailability)
                : "N/A"}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
