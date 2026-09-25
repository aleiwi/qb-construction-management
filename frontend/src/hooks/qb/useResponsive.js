/**
 * Advanced Responsive Design Utilities
 * أدوات تصميم سريع الاستجابة المتقدمة
 */

import React from 'react';

// ═══════════════════════════════════════════════════════
// 1. Breakpoints Definition
// ═══════════════════════════════════════════════════════
export const breakpoints = {
  xs: 0,      // Extra small devices (phones)
  sm: 640,    // Small devices (tablets)
  md: 1024,   // Medium devices (small laptops)
  lg: 1280,   // Large devices (desktops)
  xl: 1536,   // Extra large devices
};

export const breakpointNames = Object.keys(breakpoints);

// ═══════════════════════════════════════════════════════
// 2. useMediaQuery Hook
// ═══════════════════════════════════════════════════════
export const useMediaQuery = (query) => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

// ═══════════════════════════════════════════════════════
// 3. useBreakpoint Hook
// ═══════════════════════════════════════════════════════
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState('md');

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < breakpoints.sm) setBreakpoint('xs');
      else if (width < breakpoints.md) setBreakpoint('sm');
      else if (width < breakpoints.lg) setBreakpoint('md');
      else if (width < breakpoints.xl) setBreakpoint('lg');
      else setBreakpoint('xl');
    };

    handleResize(); // Set initial breakpoint
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

// ═══════════════════════════════════════════════════════
// 4. useViewport Hook
// ═══════════════════════════════════════════════════════
export const useViewport = () => {
  const [viewport, setViewport] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

// ═══════════════════════════════════════════════════════
// 5. Responsive Component Props
// ═══════════════════════════════════════════════════════
export const useResponsive = (breakpointValues) => {
  const breakpoint = useBreakpoint();
  
  return React.useMemo(() => {
    // Get the appropriate value for current breakpoint
    let value = breakpointValues.xs;

    if (breakpoint === 'xs') value = breakpointValues.xs;
    else if (breakpoint === 'sm') value = breakpointValues.sm || breakpointValues.xs;
    else if (breakpoint === 'md') value = breakpointValues.md || breakpointValues.sm || breakpointValues.xs;
    else if (breakpoint === 'lg') value = breakpointValues.lg || breakpointValues.md || breakpointValues.sm || breakpointValues.xs;
    else if (breakpoint === 'xl') value = breakpointValues.xl || breakpointValues.lg || breakpointValues.md || breakpointValues.sm || breakpointValues.xs;

    return value;
  }, [breakpoint, breakpointValues]);
};

// ═══════════════════════════════════════════════════════
// 6. Conditional Rendering Component
// ═══════════════════════════════════════════════════════
export const ShowOn = ({ xs, sm, md, lg, xl, children }) => {
  const breakpoint = useBreakpoint();

  const shouldShow = {
    xs: xs,
    sm: sm,
    md: md,
    lg: lg,
    xl: xl,
  }[breakpoint];

  return shouldShow ? children : null;
};

export const HideOn = ({ xs, sm, md, lg, xl, children }) => {
  const breakpoint = useBreakpoint();

  const shouldHide = {
    xs: xs,
    sm: sm,
    md: md,
    lg: lg,
    xl: xl,
  }[breakpoint];

  return !shouldHide ? children : null;
};

// ═══════════════════════════════════════════════════════
// 7. Responsive Grid Component
// ═══════════════════════════════════════════════════════
export const ResponsiveGrid = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = '1rem',
  ...props
}) => {
  const numCols = useResponsive(cols);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${numCols}, 1fr)`,
        gap: gap,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// 8. Responsive Container Component
// ═══════════════════════════════════════════════════════
export const ResponsiveContainer = ({ children, maxWidth = '1200px', ...props }) => {
  return (
    <div
      style={{
        maxWidth: maxWidth,
        margin: '0 auto',
        padding: '0 1rem',
        width: '100%',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// 9. Responsive Sidebar Component
// ═══════════════════════════════════════════════════════
export const ResponsiveSidebar = ({ sidebar, main }) => {
  const breakpoint = useBreakpoint();
  const showSidebar = breakpoint !== 'xs' && breakpoint !== 'sm';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: showSidebar ? '250px 1fr' : '1fr',
        gap: '2rem',
      }}
    >
      {showSidebar && <aside>{sidebar}</aside>}
      <main>{main}</main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// 10. Responsive Font Size
// ═══════════════════════════════════════════════════════
export const useResponsiveFontSize = (sizes) => {
  // sizes: { xs: '14px', sm: '16px', md: '18px', lg: '20px', xl: '24px' }
  const fontSize = useResponsive(sizes);
  return fontSize;
};

// ═══════════════════════════════════════════════════════
// 11. Touch Device Detection
// ═══════════════════════════════════════════════════════
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);

  React.useEffect(() => {
    const hasTouch = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };

    setIsTouchDevice(hasTouch());
  }, []);

  return isTouchDevice;
};

// ═══════════════════════════════════════════════════════
// 12. Device Orientation Detection
// ═══════════════════════════════════════════════════════
export const useOrientation = () => {
  const [orientation, setOrientation] = React.useState('portrait');

  React.useEffect(() => {
    const handleOrientationChange = () => {
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  return orientation;
};

// ═══════════════════════════════════════════════════════
// 13. Responsive Typography Scale
// ═══════════════════════════════════════════════════════
export const typographyScale = {
  h1: { xs: '24px', sm: '28px', md: '32px', lg: '40px', xl: '48px' },
  h2: { xs: '20px', sm: '24px', md: '28px', lg: '32px', xl: '36px' },
  h3: { xs: '18px', sm: '20px', md: '24px', lg: '28px', xl: '32px' },
  h4: { xs: '16px', sm: '18px', md: '20px', lg: '24px', xl: '28px' },
  body: { xs: '14px', sm: '14px', md: '16px', lg: '16px', xl: '18px' },
  small: { xs: '12px', sm: '12px', md: '14px', lg: '14px', xl: '16px' },
};

// ═══════════════════════════════════════════════════════
// 14. Responsive Spacing Scale
// ═══════════════════════════════════════════════════════
export const spacingScale = {
  xs: { xs: '4px', sm: '4px', md: '6px', lg: '8px', xl: '10px' },
  sm: { xs: '8px', sm: '8px', md: '12px', lg: '14px', xl: '16px' },
  md: { xs: '12px', sm: '14px', md: '16px', lg: '20px', xl: '24px' },
  lg: { xs: '16px', sm: '20px', md: '24px', lg: '28px', xl: '32px' },
  xl: { xs: '24px', sm: '28px', md: '32px', lg: '36px', xl: '40px' },
  xxl: { xs: '32px', sm: '36px', md: '40px', lg: '44px', xl: '48px' },
};

// ═══════════════════════════════════════════════════════
// 15. Responsive Utilities
// ═══════════════════════════════════════════════════════
export const responsiveUtils = {
  // Get CSS media query
  getMediaQuery: (breakpoint) => {
    return `@media (min-width: ${breakpoints[breakpoint]}px)`;
  },

  // Get padding based on breakpoint
  getResponsivePadding: (values) => {
    return useResponsive(values);
  },

  // Get margin based on breakpoint
  getResponsiveMargin: (values) => {
    return useResponsive(values);
  },

  // Check if below breakpoint
  isBelowBreakpoint: (breakpoint) => {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    return currentWidth < breakpoints[breakpoint];
  },

  // Check if above breakpoint
  isAboveBreakpoint: (breakpoint) => {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    return currentWidth >= breakpoints[breakpoint];
  },
};

// ═══════════════════════════════════════════════════════
// 16. Mobile Menu Hook
// ═══════════════════════════════════════════════════════
export const useMobileMenu = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const breakpoint = useBreakpoint();

  React.useEffect(() => {
    if (breakpoint !== 'xs' && breakpoint !== 'sm') {
      setIsOpen(false);
    }
  }, [breakpoint]);

  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return { isOpen, toggle, open, close };
};

export default {
  breakpoints,
  breakpointNames,
  useMediaQuery,
  useBreakpoint,
  useViewport,
  useResponsive,
  ShowOn,
  HideOn,
  ResponsiveGrid,
  ResponsiveContainer,
  ResponsiveSidebar,
  useResponsiveFontSize,
  useTouchDevice,
  useOrientation,
  typographyScale,
  spacingScale,
  responsiveUtils,
  useMobileMenu,
};
