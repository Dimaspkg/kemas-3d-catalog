import * as React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 50"
      width="100"
      height="50"
      {...props}
    >
      <path
        d="M10,25 C10,10 40,10 50,25 C60,10 90,10 90,25 C90,40 60,45 50,45 C40,45 10,40 10,25 Z"
        fill="#D40001"
      />
      <circle cx="30" cy="15" r="3" fill="black" />
    </svg>
  );
}
