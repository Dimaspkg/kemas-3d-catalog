
import * as React from 'react';

export function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.93 13.5L9 12l-.93 1.5L6.5 15l1.57.5.93 1.5.93-1.5 1.57-.5z" />
      <path d="M18.5 9.5L17 11l-1.5-1.5L14 8l1.5-1.5L17 5l1.5 1.5L20 8z" />
      <path d="M11.5 3.5L10 5l-1.5-1.5L7 2l1.5-1.5L10 -1l1.5 1.5L13 2z" />
      <path d="M3 14h3" />
      <path d="M18 14h3" />
      <path d="M10.5 21v-3" />
      <path d="M13.5 21v-3" />
      <path d="M4.5 4.5l2.12 2.12" />
      <path d="M17.38 17.38l2.12 2.12" />
      <path d="M4.5 19.5l2.12-2.12" />
      <path d="M17.38 6.62l2.12-2.12" />
    </svg>
  );
}
