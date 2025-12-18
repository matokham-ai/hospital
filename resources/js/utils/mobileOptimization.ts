/**
 * Mobile optimization utilities for admin components
 */

export const mobileOptimizations = {
  // Touch-friendly button sizes
  touchButton: "min-h-[44px] min-w-[44px] touch-manipulation",
  
  // Touch-friendly input sizes
  touchInput: "min-h-[44px] touch-manipulation",
  
  // Mobile-friendly table scrolling
  mobileTable: "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
  
  // Mobile-friendly card spacing
  mobileCard: "p-4 sm:p-6",
  
  // Mobile-friendly grid layouts
  mobileGrid: {
    departments: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    stats: "grid-cols-2 sm:grid-cols-4",
    forms: "grid-cols-1 sm:grid-cols-2",
    actions: "flex-col sm:flex-row",
  },
  
  // Mobile-friendly text sizes
  mobileText: {
    title: "text-xl sm:text-2xl",
    subtitle: "text-sm sm:text-base",
    body: "text-sm",
  },
  
  // Mobile-friendly spacing
  mobileSpacing: {
    section: "space-y-4 sm:space-y-6",
    items: "gap-3 sm:gap-4",
    padding: "p-3 sm:p-4 lg:p-6",
  }
};

/**
 * Check if device is mobile based on screen width
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get responsive class names based on component type
 */
export const getResponsiveClasses = (component: string) => {
  const classes = {
    adminDashboard: {
      container: "max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6",
      header: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4",
      tabs: "grid w-full grid-cols-1 sm:grid-cols-3 lg:w-auto lg:grid-cols-3",
      statsGrid: "grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4",
      masterDataGrid: "grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6",
      cardsGrid: "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4",
    },
    departmentGrid: {
      container: mobileOptimizations.mobileSpacing.section,
      grid: `grid ${mobileOptimizations.mobileGrid.departments} gap-4 sm:gap-6`,
      card: mobileOptimizations.mobileCard,
      actions: `flex ${mobileOptimizations.mobileGrid.actions} gap-2 sm:gap-3`,
    },
    bedMatrix: {
      container: mobileOptimizations.mobileSpacing.section,
      header: "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4",
      statsGrid: `grid ${mobileOptimizations.mobileGrid.stats} gap-3 sm:gap-4`,
      bedGrid: "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1 sm:gap-2",
      wardCard: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4",
    },
    tables: {
      container: mobileOptimizations.mobileTable,
      header: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4",
      filters: "flex flex-col sm:flex-row gap-3 sm:gap-4",
      actions: `flex flex-col sm:flex-row gap-2 sm:gap-3`,
    }
  };
  
  return classes[component as keyof typeof classes] || {};
};

/**
 * Mobile-optimized dialog sizes
 */
export const getMobileDialogSize = (type: 'small' | 'medium' | 'large' = 'medium') => {
  const sizes = {
    small: "sm:max-w-[400px] max-w-[95vw]",
    medium: "sm:max-w-[500px] max-w-[95vw]",
    large: "sm:max-w-[700px] max-w-[95vw]",
  };
  
  return sizes[type];
};