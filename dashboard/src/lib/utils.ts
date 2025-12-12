/**
 * Formats a numeric value with locale-aware thousand separators and fixed decimal places.
 *
 * Uses the en-US locale for consistent number formatting across the application.
 * Ensures the specified number of decimal places is always displayed, padding with
 * zeros if necessary.
 *
 * @param num - The numeric value to format
 * @param decimals - Number of decimal places to display (default: 2)
 * @returns Formatted string with thousand separators (e.g., "1,234.57")
 *
 * @example
 * formatNumber(1234.5678, 2) // Returns: "1,234.57"
 * formatNumber(1000000, 0)   // Returns: "1,000,000"
 * formatNumber(0.5, 2)       // Returns: "0.50"
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats energy values with automatic unit scaling
 * Scales from kWh -> MWh -> GWh based on value magnitude
 * @param kWh - Energy value in kilowatt-hours
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with appropriate unit
 *
 * @example
 * formatEnergy(500, 2)      // Returns: "500.00 kWh"
 * formatEnergy(1500, 2)     // Returns: "1.50 MWh"
 * formatEnergy(2500000, 2)  // Returns: "2.50 GWh"
 */
export function formatEnergy(kWh: number, decimals: number = 2): string {
  if (kWh < 1000) {
    // Use kWh for values less than 1,000
    return `${formatNumber(kWh, decimals)} kWh`;
  } else if (kWh < 1000000) {
    // Use MWh for values between 1,000 and 999,999
    const mWh = kWh / 1000;
    return `${formatNumber(mWh, decimals)} MWh`;
  } else {
    // Use GWh for values 1,000,000+
    const gWh = kWh / 1000000;
    return `${formatNumber(gWh, decimals)} GWh`;
  }
}

/**
 * Generates gradient color based on relative emissions value
 * Color gradient: green (0) -> white (1) -> red (2+)
 * Returns RGB color string for maximum browser compatibility
 *
 * @param value - Relative emissions ratio (emissions % / node %). Values:
 *                - null/undefined: Returns empty string (no color)
 *                - 0.0: Green (low emissions relative to node count)
 *                - 1.0: White (emissions proportional to node count)
 *                - 2.0+: Red (high emissions relative to node count)
 * @returns RGB color string in format "rgb(r, g, b)" or empty string for null
 */
export const getEmissionsGradientColor = (value: number | null): string => {
  if (value === null || value === undefined) return '';

  let r: number, g: number, b: number;

  if (value <= 1) {
    // Medium green to white: 0 -> 1
    // Medium green (150, 240, 150) to White (255, 255, 255)
    const ratio = value; // 0 to 1
    r = Math.round(150 + (255 - 150) * ratio);
    g = Math.round(240 + (255 - 240) * ratio);
    b = Math.round(150 + (255 - 150) * ratio);
  } else {
    // White to medium red: 1 -> 2+
    // White (255, 255, 255) to Medium red (255, 150, 150)
    const ratio = Math.min(value - 1, 1); // 0 to 1 (capped at 2)
    r = 255;
    g = Math.round(255 - 105 * ratio);
    b = Math.round(255 - 105 * ratio);
  }

  return `rgb(${r}, ${g}, ${b})`;
};
