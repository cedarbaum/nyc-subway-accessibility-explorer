import React from "react";
import type { SVGProps } from "react";

export function ElevatorIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M7 14v3q0 .425.288.713T8 18h1q.425 0 .713-.288T10 17v-3q.275-.275.638-.437T11 13v-1.5q0-.825-.587-1.412T9 9.5H8q-.825 0-1.412.588T6 11.5V13q0 .4.363.563T7 14m1.5-5.5q.525 0 .888-.363t.362-.887t-.363-.888T8.5 6t-.888.363t-.362.887t.363.888t.887.362m5.4 2.5h3.2q.3 0 .438-.262t-.013-.513l-1.6-2.55q-.15-.25-.425-.25t-.425.25l-1.6 2.55q-.15.25-.012.513T13.9 11m2.025 5.325l1.6-2.55q.15-.25.013-.513T17.1 13h-3.2q-.3 0-.437.263t.012.512l1.6 2.55q.15.25.425.25t.425-.25M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm0-2h14V5H5zm0 0V5z"
      ></path>
    </svg>
  );
}