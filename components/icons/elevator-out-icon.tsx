import React from "react";
import type { SVGProps } from "react";

export function ElevatorIcon(props: SVGProps<SVGSVGElement>) {
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
        d="M22.11 21.46L2.39 1.73L1.11 3L3 4.9V19c0 1.1.9 2 2 2h14.1l1.74 1.73zM5 19V6.89l2.65 2.65C6.71 9.71 6 10.5 6 11.5V14h1v4h3v-4h1v-1.11L17.11 19zM8.2 5l-2-2H19c1.1 0 2 .9 2 2v12.8l-2-2V5zm9.8 6h-3.8l-.74-.74L15.5 7zm-.69 3.11L16.2 13H18z"
      ></path>
    </svg>
  );
}