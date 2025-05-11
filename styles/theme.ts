// Theme configuration for the entire application
// This centralizes our design tokens and makes them easy to modify

export const themeConfig = {
  colors: {
    // Primary brand colors
    primary: {
      50: "var(--color-primary-50)",
      100: "var(--color-primary-100)",
      200: "var(--color-primary-200)",
      300: "var(--color-primary-300)",
      400: "var(--color-primary-400)",
      500: "var(--color-primary-500)",
      600: "var(--color-primary-600)",
      700: "var(--color-primary-700)",
      800: "var(--color-primary-800)",
      900: "var(--color-primary-900)",
    },
    // Secondary brand colors
    secondary: {
      50: "var(--color-secondary-50)",
      100: "var(--color-secondary-100)",
      200: "var(--color-secondary-200)",
      300: "var(--color-secondary-300)",
      400: "var(--color-secondary-400)",
      500: "var(--color-secondary-500)",
      600: "var(--color-secondary-600)",
      700: "var(--color-secondary-700)",
      800: "var(--color-secondary-800)",
      900: "var(--color-secondary-900)",
    },
    // Neutral colors
    gray: {
      50: "var(--color-gray-50)",
      100: "var(--color-gray-100)",
      200: "var(--color-gray-200)",
      300: "var(--color-gray-300)",
      400: "var(--color-gray-400)",
      500: "var(--color-gray-500)",
      600: "var(--color-gray-600)",
      700: "var(--color-gray-700)",
      800: "var(--color-gray-800)",
      900: "var(--color-gray-900)",
    },
  },
  gradients: {
    primary: "var(--gradient-primary)",
    secondary: "var(--gradient-secondary)",
    background: "var(--gradient-background)",
  },
  borderRadius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    full: "var(--radius-full)",
  },
  spacing: {
    1: "var(--spacing-1)",
    2: "var(--spacing-2)",
    3: "var(--spacing-3)",
    4: "var(--spacing-4)",
    5: "var(--spacing-5)",
    6: "var(--spacing-6)",
    8: "var(--spacing-8)",
    10: "var(--spacing-10)",
    12: "var(--spacing-12)",
    16: "var(--spacing-16)",
  },
  typography: {
    fontSizes: {
      xs: "var(--font-size-xs)",
      sm: "var(--font-size-sm)",
      md: "var(--font-size-md)",
      lg: "var(--font-size-lg)",
      xl: "var(--font-size-xl)",
      "2xl": "var(--font-size-2xl)",
      "3xl": "var(--font-size-3xl)",
      "4xl": "var(--font-size-4xl)",
    },
    fontWeights: {
      normal: "var(--font-weight-normal)",
      medium: "var(--font-weight-medium)",
      semibold: "var(--font-weight-semibold)",
      bold: "var(--font-weight-bold)",
    },
  },
  shadows: {
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
  },
}

// Helper function to access theme values
export function theme(path: string): string {
  const parts = path.split(".")
  let result: any = themeConfig

  for (const part of parts) {
    if (result[part] === undefined) {
      console.warn(`Theme path "${path}" not found`)
      return ""
    }
    result = result[part]
  }

  return result
}
