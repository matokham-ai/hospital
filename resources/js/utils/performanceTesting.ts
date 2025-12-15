/**
 * Performance testing utilities for admin components
 */

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  apiCallTime?: number;
  dataSize: number;
}

interface PerformanceTest {
  name: string;
  description: string;
  run: () => Promise<PerformanceMetrics>;
}

/**
 * Measure component render performance
 */
export const measureRenderPerformance = async (
  componentName: string,
  renderFunction: () => void
): Promise<number> => {
  const startTime = performance.now();
  
  // Use requestAnimationFrame to ensure DOM updates are complete
  await new Promise(resolve => {
    renderFunction();
    requestAnimationFrame(resolve);
  });
  
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
  return renderTime;
};

/**
 * Measure memory usage
 */
export const measureMemoryUsage = (): number => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
  }
  return 0;
};

/**
 * Measure API call performance
 */
export const measureApiPerformance = async (
  apiCall: () => Promise<any>
): Promise<{ data: any; duration: number }> => {
  const startTime = performance.now();
  const data = await apiCall();
  const endTime = performance.now();
  
  return {
    data,
    duration: endTime - startTime,
  };
};

/**
 * Generate large dataset for testing
 */
export const generateLargeDataset = (size: number) => {
  const departments = [];
  const departmentTypes = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency'];
  
  for (let i = 1; i <= size; i++) {
    departments.push({
      id: i,
      deptid: `DEPT${i.toString().padStart(4, '0')}`,
      name: `${departmentTypes[i % departmentTypes.length]} ${Math.ceil(i / departmentTypes.length)}`,
      code: `D${i.toString().padStart(3, '0')}`,
      description: `Department ${i} - ${departmentTypes[i % departmentTypes.length]} services`,
      icon: 'Building2',
      sort_order: i,
      status: i % 10 === 0 ? 'inactive' : 'active',
      wards_count: Math.floor(Math.random() * 5) + 1,
      test_catalogs_count: Math.floor(Math.random() * 20) + 5,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  
  return departments;
};

/**
 * Generate large bed matrix dataset
 */
export const generateLargeBedDataset = (wardCount: number, bedsPerWard: number) => {
  const wards = [];
  const beds = [];
  const wardTypes = ['GENERAL', 'ICU', 'MATERNITY', 'PEDIATRIC', 'ISOLATION'];
  const bedTypes = ['standard', 'icu', 'isolation'];
  const bedStatuses = ['available', 'occupied', 'maintenance', 'reserved'];
  
  for (let w = 1; w <= wardCount; w++) {
    const ward = {
      id: w,
      wardid: `WARD${w.toString().padStart(3, '0')}`,
      name: `Ward ${w}`,
      code: `W${w.toString().padStart(3, '0')}`,
      ward_type: wardTypes[w % wardTypes.length],
      total_beds: bedsPerWard,
      floor_number: Math.ceil(w / 10),
      description: `Ward ${w} description`,
      status: 'active',
      department: {
        id: Math.ceil(w / 5),
        name: `Department ${Math.ceil(w / 5)}`,
      },
      beds: [],
      occupancy_rate: Math.random() * 100,
      available_beds: Math.floor(Math.random() * bedsPerWard),
    };
    
    for (let b = 1; b <= bedsPerWard; b++) {
      const bed = {
        id: (w - 1) * bedsPerWard + b,
        bed_number: `${ward.code}-${b.toString().padStart(2, '0')}`,
        bed_type: bedTypes[b % bedTypes.length],
        status: bedStatuses[Math.floor(Math.random() * bedStatuses.length)],
        ward_id: w,
        maintenance_notes: Math.random() > 0.8 ? 'Routine maintenance required' : null,
        last_occupied_at: Math.random() > 0.5 ? new Date().toISOString() : null,
      };
      
      beds.push(bed);
      (ward.beds as any[]).push(bed);
    }
    
    wards.push(ward);
  }
  
  return { wards, beds };
};

/**
 * Performance test suite for admin components
 */
export const adminPerformanceTests: PerformanceTest[] = [
  {
    name: 'Department Grid - Small Dataset',
    description: 'Test department grid with 50 departments',
    run: async () => {
      const startMemory = measureMemoryUsage();
      const startTime = performance.now();
      
      const data = generateLargeDataset(50);
      
      const endTime = performance.now();
      const endMemory = measureMemoryUsage();
      
      return {
        renderTime: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        componentCount: 1,
        dataSize: data.length,
      };
    },
  },
  {
    name: 'Department Grid - Large Dataset',
    description: 'Test department grid with 500 departments',
    run: async () => {
      const startMemory = measureMemoryUsage();
      const startTime = performance.now();
      
      const data = generateLargeDataset(500);
      
      const endTime = performance.now();
      const endMemory = measureMemoryUsage();
      
      return {
        renderTime: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        componentCount: 1,
        dataSize: data.length,
      };
    },
  },
  {
    name: 'Bed Matrix - Medium Dataset',
    description: 'Test bed matrix with 20 wards, 30 beds each',
    run: async () => {
      const startMemory = measureMemoryUsage();
      const startTime = performance.now();
      
      const { wards, beds } = generateLargeBedDataset(20, 30);
      
      const endTime = performance.now();
      const endMemory = measureMemoryUsage();
      
      return {
        renderTime: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        componentCount: wards.length,
        dataSize: beds.length,
      };
    },
  },
  {
    name: 'Bed Matrix - Large Dataset',
    description: 'Test bed matrix with 50 wards, 50 beds each',
    run: async () => {
      const startMemory = measureMemoryUsage();
      const startTime = performance.now();
      
      const { wards, beds } = generateLargeBedDataset(50, 50);
      
      const endTime = performance.now();
      const endMemory = measureMemoryUsage();
      
      return {
        renderTime: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        componentCount: wards.length,
        dataSize: beds.length,
      };
    },
  },
];

/**
 * Run performance test suite
 */
export const runPerformanceTests = async (): Promise<void> => {
  console.log('🚀 Starting Admin Performance Tests...\n');
  
  const results: Array<{ test: PerformanceTest; metrics: PerformanceMetrics; error?: string }> = [];
  
  for (const test of adminPerformanceTests) {
    console.log(`Running: ${test.name}`);
    console.log(`Description: ${test.description}`);
    
    try {
      const metrics = await test.run();
      results.push({ test, metrics });
      
      console.log(`✅ Completed in ${metrics.renderTime.toFixed(2)}ms`);
      console.log(`📊 Memory usage: ${metrics.memoryUsage.toFixed(2)}MB`);
      console.log(`📦 Data size: ${metrics.dataSize} items`);
      console.log('---');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ test, metrics: { renderTime: 0, memoryUsage: 0, componentCount: 0, dataSize: 0 }, error: errorMessage });
      
      console.log(`❌ Failed: ${errorMessage}`);
      console.log('---');
    }
  }
  
  // Generate summary report
  console.log('\n📋 Performance Test Summary:');
  console.log('================================');
  
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  console.log(`✅ Successful tests: ${successful.length}`);
  console.log(`❌ Failed tests: ${failed.length}`);
  
  if (successful.length > 0) {
    const avgRenderTime = successful.reduce((sum, r) => sum + r.metrics.renderTime, 0) / successful.length;
    const avgMemoryUsage = successful.reduce((sum, r) => sum + r.metrics.memoryUsage, 0) / successful.length;
    
    console.log(`📊 Average render time: ${avgRenderTime.toFixed(2)}ms`);
    console.log(`💾 Average memory usage: ${avgMemoryUsage.toFixed(2)}MB`);
  }
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  console.log('================================');
  
  const slowTests = successful.filter(r => r.metrics.renderTime > 100);
  const memoryHeavyTests = successful.filter(r => r.metrics.memoryUsage > 10);
  
  if (slowTests.length > 0) {
    console.log('⚠️  Slow rendering detected in:');
    slowTests.forEach(r => {
      console.log(`   - ${r.test.name}: ${r.metrics.renderTime.toFixed(2)}ms`);
    });
    console.log('   Consider implementing virtual scrolling or pagination.');
  }
  
  if (memoryHeavyTests.length > 0) {
    console.log('⚠️  High memory usage detected in:');
    memoryHeavyTests.forEach(r => {
      console.log(`   - ${r.test.name}: ${r.metrics.memoryUsage.toFixed(2)}MB`);
    });
    console.log('   Consider implementing data caching and cleanup.');
  }
  
  if (slowTests.length === 0 && memoryHeavyTests.length === 0) {
    console.log('🎉 All tests performed within acceptable limits!');
  }
};

/**
 * Monitor real-time performance
 */
export const startPerformanceMonitoring = () => {
  let frameCount = 0;
  let lastTime = performance.now();
  
  const monitor = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      
      if (fps < 30) {
        console.warn(`⚠️  Low FPS detected: ${fps} fps`);
      }
      
      frameCount = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(monitor);
  };
  
  requestAnimationFrame(monitor);
  console.log('📊 Performance monitoring started');
};

/**
 * Optimize images for better performance
 */
export const optimizeImageLoading = () => {
  // Add loading="lazy" to all images
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
  });
  
  // Add intersection observer for critical images
  const criticalImages = document.querySelectorAll('img[data-critical]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  });
  
  criticalImages.forEach(img => imageObserver.observe(img));
};