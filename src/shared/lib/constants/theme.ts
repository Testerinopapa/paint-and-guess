export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1400px",
} as const;

export const colorTokens = {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },
  sidebar: {
    DEFAULT: "hsl(var(--sidebar-background))",
    foreground: "hsl(var(--sidebar-foreground))",
    primary: "hsl(var(--sidebar-primary))",
    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
    accent: "hsl(var(--sidebar-accent))",
    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
    border: "hsl(var(--sidebar-border))",
    ring: "hsl(var(--sidebar-ring))",
  },
  canvas: {
    bg: "hsl(var(--canvas-bg))",
  },
  toolbar: {
    bg: "hsl(var(--toolbar-bg))",
  },
};

export const gradientTokens = {
  primary: "var(--gradient-primary)",
  secondary: "var(--gradient-secondary)",
  accent: "var(--gradient-accent)",
};

export const shadowTokens = {
  soft: "var(--shadow-soft)",
  medium: "var(--shadow-medium)",
  strong: "var(--shadow-strong)",
};

export const transitionTokens = {
  smooth: "var(--transition-smooth)",
};

export const radiusTokens = {
  lg: "var(--radius)",
  md: "calc(var(--radius) - 2px)",
  sm: "calc(var(--radius) - 4px)",
};

export const layoutTokens = {
  containerPadding: "2rem",
};

export const designTokens = {
  breakpoints,
  colors: colorTokens,
  gradients: gradientTokens,
  shadows: shadowTokens,
  transitions: transitionTokens,
  radii: radiusTokens,
  layout: layoutTokens,
};
