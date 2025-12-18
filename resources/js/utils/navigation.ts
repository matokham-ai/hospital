// Navigation helper for doctor dashboard
export const doctorRoutes = {
  dashboard: '/doctor/dashboard',
  appointments: {
    today: '/appointments/today',
    create: '/appointments/create',
    calendar: '/appointments/calendar'
  },
  opd: {
    dashboard: '/opd/dashboard',
    queue: '/opd/queue',
    consultations: '/opd/consultations',
    prescriptions: '/opd/prescriptions'
  },
  inpatient: {
    dashboard: '/inpatient/dashboard',
    admissions: '/inpatient/admissions',
    carePlans: '/inpatient/care-plans',
    medications: '/inpatient/medications',
    labs: '/inpatient/labs',
    rounds: '/inpatient/rounds'
  },
  pharmacy: {
    dashboard: '/pharmacy/dashboard',
    prescriptions: '/pharmacy/prescriptions'
  },
  patients: {
    list: '/patients',
    create: '/patients/create'
  },
  reports: {
    dashboard: '/reports/dashboard'
  }
};

// Helper function to check if a route exists (for development)
export const isValidRoute = (path: string): boolean => {
  // In a real application, you might want to check against actual routes
  // For now, we'll assume all paths in doctorRoutes are valid
  return true;
};

// Helper to get route with fallback
export const getRoute = (path: string, fallback: string = '/doctor/dashboard'): string => {
  return isValidRoute(path) ? path : fallback;
};