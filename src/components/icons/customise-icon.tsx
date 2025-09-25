
import * as React from 'react';

export function CustomiseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
          <stop offset="25%" style={{ stopColor: '#FF6347', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#4169E1', stopOpacity: 1 }} />
          <stop offset="75%" style={{ stopColor: '#32CD32', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path
        d="M2.5 13.5H3.5L10.5 6.5L9.5 5.5L2.5 12.5V13.5ZM12.5 4.5L11.5 5.5L9.5 3.5L10.5 2.5C10.75 2.25 11.25 2.25 11.5 2.5L12.5 3.5C12.75 3.75 12.75 4.25 12.5 4.5Z"
        fill="currentColor"
      />
      <rect
        x="1.5"
        y="1.5"
        width="13"
        height="13"
        rx="2"
        stroke="url(#grad)"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
