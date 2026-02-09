import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Color gradient: green (0) -> white (1) -> red (2+) based on relative emissions ratio */
const EMISSIONS_LOW = { r: 150, g: 240, b: 150 };
const EMISSIONS_NEUTRAL = { r: 255, g: 255, b: 255 };
const EMISSIONS_HIGH = { r: 255, g: 150, b: 150 };

const interpolate = (from: number, to: number, ratio: number): number =>
  Math.round(from + (to - from) * ratio);

export const getEmissionsGradientColor = (value: number | null): string => {
  if (value === null) return '';

  let r: number, g: number, b: number;

  if (value <= 1) {
    // Green to white: 0 -> 1
    const ratio = value;
    r = interpolate(EMISSIONS_LOW.r, EMISSIONS_NEUTRAL.r, ratio);
    g = interpolate(EMISSIONS_LOW.g, EMISSIONS_NEUTRAL.g, ratio);
    b = interpolate(EMISSIONS_LOW.b, EMISSIONS_NEUTRAL.b, ratio);
  } else {
    // White to red: 1 -> 2+
    const ratio = Math.min(value - 1, 1);
    r = interpolate(EMISSIONS_NEUTRAL.r, EMISSIONS_HIGH.r, ratio);
    g = interpolate(EMISSIONS_NEUTRAL.g, EMISSIONS_HIGH.g, ratio);
    b = interpolate(EMISSIONS_NEUTRAL.b, EMISSIONS_HIGH.b, ratio);
  }

  return `rgb(${r}, ${g}, ${b})`;
};
