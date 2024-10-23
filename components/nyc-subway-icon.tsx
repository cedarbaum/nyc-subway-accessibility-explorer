import Image from "next/image";

export interface SubwayIconProps extends React.HTMLAttributes<HTMLDivElement> {
  route: string;
  isDiamond?: boolean;
  border?: string;
  opacity?: number;
  width: string | number;
  height: string | number;
}

export const allRoutes = new Set([
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "6X",
  "7",
  "7X",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "FS",
  "FX",
  "G",
  "J",
  "L",
  "M",
  "N",
  "Q",
  "R",
  "S",
  "SI",
  "SIR",
  "T",
  "W",
  "Z",
]);

export const NycSubwayIcon: React.FC<SubwayIconProps> = ({
  route,
  border,
  opacity,
  width,
  height,
  ...rest
}) => {
  return (
    <span
      {...rest}
      className="inline-block relative select-none"
      style={{ width, height, opacity }}
    >
      <Image
        style={{ border }}
        className={`select-none pointer-events-none ${border ? "rounded-[100%]" : ""}`}
        src={`/nyc-subway-icons/${route.toLowerCase()}.svg`}
        alt={route}
        fill
      />
    </span>
  );
};
