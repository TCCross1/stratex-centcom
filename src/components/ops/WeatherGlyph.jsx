import React from "react";

/** Calendar / map weather mark. Never renders a sunny glyph for missing data. */
export function WeatherGlyph({ icon, size = 22, title }) {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 24 24", "aria-hidden": title ? undefined : true };
  if (!icon) {
    return (
      <svg {...common} title={title || "unavailable"}>
        <circle cx="12" cy="12" r="8" fill="none" stroke="#6E839B" strokeWidth="1.4" strokeDasharray="3 3" />
      </svg>
    );
  }
  if (icon === "sun") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="5" fill="#FFD873" />
        <g stroke="#F0B429" strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M5.2 18.8l1.7-1.7M17.1 6.9l1.7-1.7" />
        </g>
      </svg>
    );
  }
  if (icon === "storm") {
    return (
      <svg {...common}>
        <path d="M7 16a5 5 0 01.4-9.9A6.2 6.2 0 0118.5 9 4.2 4.2 0 0118 17" fill="#8AA4C4" />
        <path d="M11 12l-2.2 5h3l-1.6 5 5.4-7H13l1.6-3z" fill="#FFD873" />
      </svg>
    );
  }
  if (icon === "rain") {
    return (
      <svg {...common}>
        <path d="M7 15a5 5 0 01.4-9.9A6.2 6.2 0 0118.5 8 4.2 4.2 0 0118 16H7z" fill="#7E9BB8" />
        <g stroke="#4D9BFF" strokeWidth="1.5" strokeLinecap="round">
          <path d="M8 17.5l-1 3M12 17.5l-1 3M16 17.5l-1 3" />
        </g>
      </svg>
    );
  }
  if (icon === "snow") {
    return (
      <svg {...common}>
        <path d="M7 15a5 5 0 01.4-9.9A6.2 6.2 0 0118.5 8 4.2 4.2 0 0118 16H7z" fill="#C5D4E6" />
        <g stroke="#E9F1F9" strokeWidth="1.3" strokeLinecap="round">
          <path d="M8 18.5h0M12 19.2h0M16 18.4h0" />
        </g>
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M7 17a5 5 0 01.5-10A6.3 6.3 0 0118.6 10 4.3 4.3 0 0118 18H7z" fill="#9BB0C8" />
      <path d="M5 14a3.4 3.4 0 01.3-6.8 4.4 4.4 0 018.2 1.6" fill="#B9C9DB" />
    </svg>
  );
}
