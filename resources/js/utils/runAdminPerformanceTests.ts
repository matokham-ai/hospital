/**
 * Admin Performance Test Runner
 * 
 * This utility can be run in the browser console to test admin component performance
 */

import { runPerformanceTests, startPerformanceMonitoring, optimizeImageLoading } from './performanceTesting';

// Make functions available globally for console access
declare global {
  interface Window {
    adminPerformanceTests: {
      runTests: () => Promise<void>;
      startMonitoring: () => void;
      optimizeImages: () => void;
      generateTestData: (size: number) => any[];
    };
  }
}

// Initialize performance testing utilities
window.adminPerformanceTests = {
  runTests: runPerformanceTests,
  startMonitoring: startPerformanceMonitoring,
  optimizeImages: optimizeImageLoading,
  generateTestData: (size: number) => {
    const departments = [];
    for (let i = 1; i <= size; i++) {
      departments.push({
        id: i,
        deptid: `DEPT${i.toString().padStart(4, '0')}`,
        name: `Department ${i}`,
        code: `D${i.toString().padStart(3, '0')}`,
        description: `Test department ${i}`,
        sort_order: i,
        status: i % 10 === 0 ? 'inactive' : 'active',
        wards_count: Math.floor(Math.random() * 5) + 1,
        test_catalogs_count: Math.floor(Math.random() * 20) + 5,
      });
    }
    return departments;
  },
};

// Auto-start performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Admin Performance Testing Available');
  console.log('Run window.adminPerformanceTests.runTests() to start performance tests');
  console.log('Run window.adminPerformanceTests.startMonitoring() to monitor FPS');
  
  // Auto-optimize images
  document.addEventListener('DOMContentLoaded', () => {
    optimizeImageLoading();
  });
}

export {};