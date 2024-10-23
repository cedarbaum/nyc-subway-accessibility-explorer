export function formatNumberWithCommas(number?: number | null): string {
  if (number === undefined || number === null) {
    return "";
  }
  return new Intl.NumberFormat("en-US").format(number);
}

export function formatDecimalAsPercentage(decimal?: number | null): string {
  if (decimal === undefined || decimal === null) {
    return "";
  }
  // Here we're using 'en-US' but you can change the locale as needed
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1, // Set the number of digits after the decimal
    maximumFractionDigits: 2, // You can adjust this for more precision
  }).format(decimal);
}

export function formatNumberAsPercentage(
  number?: number | null,
  total?: number | null,
): string {
  if (
    number === undefined ||
    number === null ||
    total === undefined ||
    total === null
  ) {
    return "";
  }
  const percentage = number / total;
  return `${number} (${formatDecimalAsPercentage(percentage)})`;
}
