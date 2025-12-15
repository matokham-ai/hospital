import React from 'react';

/**
 * Frontend validation utilities that mirror backend validation rules
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Department validation
export const validateDepartment = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push({ field: 'name', message: 'Department name is required.' });
  } else if (data.name.length > 255) {
    errors.push({ field: 'name', message: 'Department name cannot exceed 255 characters.' });
  }

  // Code validation
  if (!data.code || typeof data.code !== 'string') {
    errors.push({ field: 'code', message: 'Department code is required.' });
  } else {
    const code = data.code.toUpperCase().trim();
    if (!/^[A-Z0-9]{2,10}$/.test(code)) {
      errors.push({ field: 'code', message: 'Department code must be 2-10 characters long and contain only letters and numbers.' });
    } else {
      const reservedCodes = ['ADMIN', 'SYSTEM', 'TEST', 'TEMP', 'NULL', 'VOID'];
      if (reservedCodes.includes(code)) {
        errors.push({ field: 'code', message: `Department code "${code}" is reserved and cannot be used.` });
      }
    }
  }

  // Status validation
  if (!data.status || !['active', 'inactive'].includes(data.status)) {
    errors.push({ field: 'status', message: 'Department status must be either active or inactive.' });
  }

  // Description validation
  if (data.description && data.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 1000 characters.' });
  }

  // Sort order validation
  if (data.sort_order !== null && data.sort_order !== undefined) {
    const sortOrder = parseInt(data.sort_order);
    if (isNaN(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
      errors.push({ field: 'sort_order', message: 'Sort order must be between 0 and 9999.' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Ward validation
export const validateWard = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push({ field: 'name', message: 'Ward name is required.' });
  } else if (data.name.length > 255) {
    errors.push({ field: 'name', message: 'Ward name cannot exceed 255 characters.' });
  }

  // Type validation
  const validTypes = ['general', 'icu', 'maternity', 'pediatric', 'emergency', 'surgical'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.push({ field: 'type', message: 'Invalid ward type selected.' });
  }

  // Capacity validation
  if (!data.capacity || typeof data.capacity !== 'number') {
    errors.push({ field: 'capacity', message: 'Ward capacity is required.' });
  } else if (data.capacity < 1) {
    errors.push({ field: 'capacity', message: 'Ward capacity must be at least 1.' });
  } else if (data.capacity > 500) {
    errors.push({ field: 'capacity', message: 'Ward capacity cannot exceed 500 beds.' });
  }

  // Floor number validation
  if (data.floor_number !== null && data.floor_number !== undefined) {
    const floorNumber = parseInt(data.floor_number);
    if (isNaN(floorNumber) || floorNumber < 0 || floorNumber > 50) {
      errors.push({ field: 'floor_number', message: 'Floor number must be between 0 and 50.' });
    }
  }

  // Status validation
  const validStatuses = ['active', 'inactive', 'maintenance', 'renovation'];
  if (!data.status || !validStatuses.includes(data.status)) {
    errors.push({ field: 'status', message: 'Invalid ward status selected.' });
  }

  // Description validation
  if (data.description && data.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 1000 characters.' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Bed validation
export const validateBed = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Bed number validation
  if (!data.bed_number || typeof data.bed_number !== 'string') {
    errors.push({ field: 'bed_number', message: 'Bed number is required.' });
  } else if (data.bed_number.length > 20) {
    errors.push({ field: 'bed_number', message: 'Bed number cannot exceed 20 characters.' });
  }

  // Bed type validation
  const validTypes = ['standard', 'icu', 'isolation', 'maternity', 'pediatric', 'surgical'];
  if (!data.bed_type || !validTypes.includes(data.bed_type)) {
    errors.push({ field: 'bed_type', message: 'Invalid bed type selected.' });
  }

  // Status validation
  const validStatuses = ['available', 'occupied', 'maintenance', 'reserved', 'out_of_order'];
  if (!data.status || !validStatuses.includes(data.status)) {
    errors.push({ field: 'status', message: 'Invalid bed status selected.' });
  }

  // Maintenance notes validation
  if (data.maintenance_notes && data.maintenance_notes.length > 500) {
    errors.push({ field: 'maintenance_notes', message: 'Maintenance notes cannot exceed 500 characters.' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Test catalog validation
export const validateTestCatalog = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push({ field: 'name', message: 'Test name is required.' });
  } else if (data.name.length > 255) {
    errors.push({ field: 'name', message: 'Test name cannot exceed 255 characters.' });
  }

  // Code validation
  if (!data.code || typeof data.code !== 'string') {
    errors.push({ field: 'code', message: 'Test code is required.' });
  } else if (!/^[A-Z0-9_-]+$/.test(data.code)) {
    errors.push({ field: 'code', message: 'Test code can only contain uppercase letters, numbers, underscores, and hyphens.' });
  } else if (data.code.length > 20) {
    errors.push({ field: 'code', message: 'Test code cannot exceed 20 characters.' });
  }

  // Category validation
  const validCategories = [
    'Hematology', 'Biochemistry', 'Microbiology', 'Immunology', 'Pathology',
    'Radiology', 'Cardiology', 'Endocrinology', 'Toxicology', 'Genetics'
  ];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.push({ field: 'category', message: 'Invalid test category selected.' });
  }

  // Price validation
  if (data.price === null || data.price === undefined || typeof data.price !== 'number') {
    errors.push({ field: 'price', message: 'Test price is required.' });
  } else if (data.price < 0) {
    errors.push({ field: 'price', message: 'Test price must be at least 0.' });
  } else if (data.price > 999999.99) {
    errors.push({ field: 'price', message: 'Test price cannot exceed 999,999.99.' });
  } else if (Math.round(data.price * 100) / 100 !== data.price) {
    errors.push({ field: 'price', message: 'Test price can have at most 2 decimal places.' });
  }

  // Turnaround time validation
  if (!data.turnaround_time || typeof data.turnaround_time !== 'number') {
    errors.push({ field: 'turnaround_time', message: 'Turnaround time is required.' });
  } else if (data.turnaround_time < 1) {
    errors.push({ field: 'turnaround_time', message: 'Turnaround time must be at least 1 hour.' });
  } else if (data.turnaround_time > 168) {
    errors.push({ field: 'turnaround_time', message: 'Turnaround time cannot exceed 168 hours (1 week).' });
  }

  // Sample type validation
  if (data.sample_type) {
    const validSampleTypes = ['Blood', 'Urine', 'Stool', 'Saliva', 'Tissue', 'Swab', 'CSF', 'Other'];
    if (!validSampleTypes.includes(data.sample_type)) {
      errors.push({ field: 'sample_type', message: 'Invalid sample type selected.' });
    }
  }

  // Status validation
  if (!data.status || !['active', 'inactive'].includes(data.status)) {
    errors.push({ field: 'status', message: 'Invalid test status selected.' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Drug formulary validation
export const validateDrugFormulary = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push({ field: 'name', message: 'Drug name is required.' });
  } else if (data.name.length > 255) {
    errors.push({ field: 'name', message: 'Drug name cannot exceed 255 characters.' });
  }

  // Generic name validation
  if (!data.generic_name || typeof data.generic_name !== 'string') {
    errors.push({ field: 'generic_name', message: 'Generic name is required.' });
  } else if (data.generic_name.length > 255) {
    errors.push({ field: 'generic_name', message: 'Generic name cannot exceed 255 characters.' });
  }

  // ATC code validation
  if (data.atc_code && data.atc_code.trim()) {
    const atcCode = data.atc_code.trim();
    if (!/^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$/.test(atcCode)) {
      errors.push({ field: 'atc_code', message: 'ATC code must follow the format: A00AA00 (e.g., A02BC01).' });
    } else {
      const anatomicalGroups = ['A', 'B', 'C', 'D', 'G', 'H', 'J', 'L', 'M', 'N', 'P', 'R', 'S', 'V'];
      if (!anatomicalGroups.includes(atcCode[0])) {
        errors.push({ field: 'atc_code', message: 'ATC code has an invalid anatomical group.' });
      }
    }
  }

  // Strength validation
  if (!data.strength || typeof data.strength !== 'string') {
    errors.push({ field: 'strength', message: 'Drug strength is required.' });
  } else if (!/^[\d\.]+(mg|g|ml|mcg|IU|%)\s*(\/\s*[\d\.]+(mg|g|ml|mcg|IU|%)?)?$/.test(data.strength)) {
    errors.push({ field: 'strength', message: 'Invalid strength format. Use format like "500mg" or "5mg/ml".' });
  }

  // Form validation
  const validForms = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'powder', 'gel', 'patch', 'spray'];
  if (!data.form || !validForms.includes(data.form)) {
    errors.push({ field: 'form', message: 'Invalid drug form selected.' });
  }

  // Stock quantity validation
  if (data.stock_quantity === null || data.stock_quantity === undefined || typeof data.stock_quantity !== 'number') {
    errors.push({ field: 'stock_quantity', message: 'Stock quantity is required.' });
  } else if (data.stock_quantity < 0) {
    errors.push({ field: 'stock_quantity', message: 'Stock quantity must be at least 0.' });
  } else if (data.stock_quantity > 999999) {
    errors.push({ field: 'stock_quantity', message: 'Stock quantity cannot exceed 999,999.' });
  }

  // Reorder level validation
  if (data.reorder_level === null || data.reorder_level === undefined || typeof data.reorder_level !== 'number') {
    errors.push({ field: 'reorder_level', message: 'Reorder level is required.' });
  } else if (data.reorder_level < 0) {
    errors.push({ field: 'reorder_level', message: 'Reorder level must be at least 0.' });
  } else if (data.reorder_level > 999999) {
    errors.push({ field: 'reorder_level', message: 'Reorder level cannot exceed 999,999.' });
  }

  // Unit price validation
  if (data.unit_price === null || data.unit_price === undefined || typeof data.unit_price !== 'number') {
    errors.push({ field: 'unit_price', message: 'Unit price is required.' });
  } else if (data.unit_price < 0) {
    errors.push({ field: 'unit_price', message: 'Unit price must be at least 0.' });
  } else if (data.unit_price > 99999.99) {
    errors.push({ field: 'unit_price', message: 'Unit price cannot exceed 99,999.99.' });
  }

  // Status validation
  if (!data.status || !['active', 'discontinued'].includes(data.status)) {
    errors.push({ field: 'status', message: 'Invalid drug status selected.' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Real-time validation hook
export const useRealTimeValidation = (validationFn: (data: any) => ValidationResult) => {
  const [errors, setErrors] = React.useState<ValidationError[]>([]);
  const [isValid, setIsValid] = React.useState(true);

  const validate = React.useCallback((data: any) => {
    const result = validationFn(data);
    setErrors(result.errors);
    setIsValid(result.isValid);
    return result;
  }, [validationFn]);

  const getFieldError = React.useCallback((fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message;
  }, [errors]);

  const hasFieldError = React.useCallback((fieldName: string) => {
    return errors.some(error => error.field === fieldName);
  }, [errors]);

  return {
    errors,
    isValid,
    validate,
    getFieldError,
    hasFieldError
  };
};