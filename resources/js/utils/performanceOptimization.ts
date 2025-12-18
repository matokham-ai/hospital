/**
 * Performance optimization utilities for admin components
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';

/**
 * Debounce hook for search inputs and API calls
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook for scroll events and frequent updates
 */
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

/**
 * Virtual scrolling hook for large datasets
 */
export const useVirtualScroll = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    ...visibleItems,
    handleScroll,
  };
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return { elementRef, isIntersecting, entry };
};

/**
 * Memoized search filter for large datasets
 */
export const useOptimizedSearch = <T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  delay: number = 300
) => {
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return items;

    const searchLower = debouncedSearchTerm.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && 
               String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [items, debouncedSearchTerm, searchFields]);

  return filteredItems;
};

/**
 * Optimized pagination hook
 */
export const useOptimizedPagination = <T>(
  items: T[],
  itemsPerPage: number = 50
) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      items: items.slice(startIndex, endIndex),
      totalPages: Math.ceil(items.length / itemsPerPage),
      totalItems: items.length,
      currentPage,
      hasNextPage: currentPage < Math.ceil(items.length / itemsPerPage),
      hasPrevPage: currentPage > 1,
    };
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, paginatedData.totalPages)));
  }, [paginatedData.totalPages]);

  const nextPage = useCallback(() => {
    if (paginatedData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginatedData.hasNextPage]);

  const prevPage = useCallback(() => {
    if (paginatedData.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginatedData.hasPrevPage]);

  return {
    ...paginatedData,
    goToPage,
    nextPage,
    prevPage,
    setCurrentPage,
  };
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
    }

    startTime.current = performance.now();
  });

  return renderCount.current;
};

/**
 * Optimized table sorting
 */
export const useOptimizedSort = <T>(
  items: T[],
  defaultSortKey?: keyof T,
  defaultSortOrder: 'asc' | 'desc' = 'asc'
) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({
    key: defaultSortKey || null,
    direction: defaultSortOrder,
  });

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [items, sortConfig]);

  const requestSort = useCallback((key: keyof T) => {
    setSortConfig(prevConfig => ({
      key,
      direction: 
        prevConfig.key === key && prevConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc',
    }));
  }, []);

  return {
    sortedItems,
    sortConfig,
    requestSort,
  };
};

/**
 * Batch operations for better performance
 */
export const useBatchOperations = <T>(
  batchSize: number = 100,
  delay: number = 10
) => {
  const [queue, setQueue] = useState<T[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processBatch = useCallback(async (
    items: T[],
    processor: (batch: T[]) => Promise<void>
  ) => {
    setIsProcessing(true);
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await processor(batch);
      
      // Allow UI to update between batches
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    setIsProcessing(false);
  }, [batchSize, delay]);

  const addToQueue = useCallback((items: T[]) => {
    setQueue(prev => [...prev, ...items]);
  }, []);

  const processQueue = useCallback(async (
    processor: (batch: T[]) => Promise<void>
  ) => {
    if (queue.length > 0) {
      await processBatch(queue, processor);
      setQueue([]);
    }
  }, [queue, processBatch]);

  return {
    queue,
    isProcessing,
    addToQueue,
    processQueue,
    processBatch,
  };
};

/**
 * Memory-efficient data caching
 */
export const useDataCache = <T>(maxSize: number = 100) => {
  const cache = useRef(new Map<string, { data: T; timestamp: number }>());

  const set = useCallback((key: string, data: T) => {
    // Remove oldest entries if cache is full
    if (cache.current.size >= maxSize) {
      const oldestKey = cache.current.keys().next().value;
      if (oldestKey) {
        cache.current.delete(oldestKey);
      }
    }

    cache.current.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, [maxSize]);

  const get = useCallback((key: string, maxAge: number = 300000): T | null => {
    const entry = cache.current.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > maxAge) {
      cache.current.delete(key);
      return null;
    }
    
    return entry.data;
  }, []);

  const clear = useCallback(() => {
    cache.current.clear();
  }, []);

  return { set, get, clear };
};

/**
 * Progressive loading component wrapper
 */
export const withProgressiveLoading = <P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent: React.ComponentType = () => React.createElement('div', null, 'Loading...')
) => {
  return (props: P) => {
    const { elementRef, isIntersecting } = useIntersectionObserver();
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
      if (isIntersecting && !hasLoaded) {
        setHasLoaded(true);
      }
    }, [isIntersecting, hasLoaded]);

    return React.createElement(
      'div',
      { ref: elementRef },
      hasLoaded ? React.createElement(Component, props) : React.createElement(LoadingComponent)
    );
  };
};