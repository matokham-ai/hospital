import { useForm } from '@inertiajs/react';
import { useState, useCallback, useEffect } from 'react';
import { ValidationResult, ValidationError } from '@/utils/validation';

interface UseFormValidationOptions<T> {
  initialData: T;
  validationFn: (data: T) => ValidationResult;
  onSubmit: (data: T) => void;
  realTimeValidation?: boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  initialData,
  validationFn,
  onSubmit,
  realTimeValidation = true
}: UseFormValidationOptions<T>) {
  const form = useForm(initialData);
  const [clientErrors, setClientErrors] = useState<ValidationError[]>([]);
  const [isClientValid, setIsClientValid] = useState(true);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Validate form data
  const validateForm = useCallback((data: T) => {
    const result = validationFn(data);
    setClientErrors(result.errors);
    setIsClientValid(result.isValid);
    return result;
  }, [validationFn]);

  // Real-time validation when data changes
  useEffect(() => {
    if (realTimeValidation && touchedFields.size > 0) {
      validateForm(form.data);
    }
  }, [form.data, validateForm, realTimeValidation, touchedFields]);

  // Mark field as touched
  const touchField = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  }, []);

  // Get error for specific field (client-side or server-side)
  const getFieldError = useCallback((fieldName: string) => {
    // Check client-side errors first
    const clientError = clientErrors.find(error => error.field === fieldName);
    if (clientError) {
      return clientError.message;
    }

    // Check server-side errors from Inertia
    return form.errors[fieldName];
  }, [clientErrors, form.errors]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName: string) => {
    return Boolean(getFieldError(fieldName));
  }, [getFieldError]);

  // Get all errors (client + server)
  const getAllErrors = useCallback(() => {
    const allErrors: ValidationError[] = [...clientErrors];
    
    // Add server errors that aren't already in client errors
    Object.entries(form.errors).forEach(([field, message]) => {
      if (!clientErrors.some(error => error.field === field)) {
        allErrors.push({ field, message });
      }
    });

    return allErrors;
  }, [clientErrors, form.errors]);

  // Enhanced setData that marks field as touched
  const setData = useCallback((key: keyof T | Partial<T>, value?: any) => {
    if (typeof key === 'string') {
      touchField(key);
      form.setData(key, value);
    } else {
      // If setting multiple fields
      Object.keys(key).forEach(fieldName => touchField(fieldName));
      form.setData(key);
    }
  }, [form, touchField]);

  // Enhanced submit with client-side validation
  const submit = useCallback((method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string, options?: any) => {
    // Mark all fields as touched
    Object.keys(form.data).forEach(fieldName => touchField(fieldName));

    // Validate before submitting
    const validation = validateForm(form.data);
    
    if (!validation.isValid) {
      // Don't submit if client validation fails
      return;
    }

    // Clear client errors before submitting
    setClientErrors([]);

    // Submit with Inertia
    form.submit(method, url, {
      ...options,
      onError: (errors: Record<string, string>) => {
        // Server validation errors will be handled by Inertia automatically
        console.log('Server validation errors:', errors);
      }
    });
  }, [form, validateForm, touchField]);

  // Validate specific field
  const validateField = useCallback((fieldName: string, value: any) => {
    const tempData = { ...form.data, [fieldName]: value };
    const result = validationFn(tempData);
    const fieldError = result.errors.find(error => error.field === fieldName);
    return fieldError?.message;
  }, [form.data, validationFn]);

  return {
    // Form state
    data: form.data,
    errors: form.errors,
    processing: form.processing,
    recentlySuccessful: form.recentlySuccessful,
    
    // Enhanced methods
    setData,
    submit,
    
    // Validation state
    clientErrors,
    isClientValid,
    isValid: isClientValid && Object.keys(form.errors).length === 0,
    
    // Validation methods
    validateForm,
    validateField,
    getFieldError,
    hasFieldError,
    getAllErrors,
    touchField,
    
    // Original form methods (for compatibility)
    reset: form.reset,
    clearErrors: form.clearErrors,
    transform: form.transform,
    isDirty: form.isDirty,
    wasSuccessful: form.wasSuccessful
  };
}

// Import validation functions
import { 
  validateDepartment, 
  validateWard, 
  validateBed, 
  validateTestCatalog, 
  validateDrugFormulary 
} from '@/utils/validation';

// Specific validation hooks for each entity type
export function useDepartmentValidation(initialData: any) {
  return useFormValidation({
    initialData,
    validationFn: validateDepartment,
    onSubmit: () => {},
    realTimeValidation: true
  });
}

export function useWardValidation(initialData: any) {
  return useFormValidation({
    initialData,
    validationFn: validateWard,
    onSubmit: () => {},
    realTimeValidation: true
  });
}

export function useBedValidation(initialData: any) {
  return useFormValidation({
    initialData,
    validationFn: validateBed,
    onSubmit: () => {},
    realTimeValidation: true
  });
}

export function useTestCatalogValidation(initialData: any) {
  return useFormValidation({
    initialData,
    validationFn: validateTestCatalog,
    onSubmit: () => {},
    realTimeValidation: true
  });
}

export function useDrugFormularyValidation(initialData: any) {
  return useFormValidation({
    initialData,
    validationFn: validateDrugFormulary,
    onSubmit: () => {},
    realTimeValidation: true
  });
}