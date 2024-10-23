const enum MtaColors {
  Red = "#EE352E",
  Green = "#6CBE45",
  Blue = "#0039A6",
  Orange = "#FF6319",
  Purple = "#B933AD",
  Green2 = "#00933C",
  Yellow = "#FCCC0A",
  Gray = "#A7A9AC",
  Brown = "#996633",
  SirBlue = "#007AC7",
}

export function mapRouteIdToColor(routeId: string): string {
  switch (routeId) {
    case "1":
    case "2":
    case "3":
      return MtaColors.Red;
    case "4":
    case "5":
    case "6":
      return MtaColors.Green;
    case "7":
      return MtaColors.Purple;
    case "A":
    case "C":
    case "E":
      return MtaColors.Blue;
    case "B":
    case "D":
    case "F":
    case "M":
      return MtaColors.Orange;
    case "G":
      return MtaColors.Green2;
    case "J":
    case "Z":
      return MtaColors.Brown;
    case "L":
      return MtaColors.Gray;
    case "N":
    case "Q":
    case "R":
    case "W":
      return MtaColors.Yellow;
    case "SIR":
      return MtaColors.SirBlue;
    default:
      return MtaColors.Gray;
  }
}
