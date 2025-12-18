/**
 * Service Code Generator Utility
 * 
 * This utility provides functions to interact with the service code generation API
 */

import axios from 'axios';

export class ServiceCodeGenerator {
    /**
     * Generate a single service code
     */
    static async generateCode(category, departmentId = null) {
        try {
            const response = await axios.post('/inpatient/service-catalogue/generate-code', {
                category,
                department_id: departmentId
            });
            return response.data.code;
        } catch (error) {
            console.error('Error generating service code:', error);
            throw error;
        }
    }

    /**
     * Generate multiple code suggestions
     */
    static async generateCodeSuggestions(category, departmentId = null, count = 3) {
        try {
            const response = await axios.post('/inpatient/service-catalogue/generate-code-suggestions', {
                category,
                department_id: departmentId,
                count
            });
            return response.data.suggestions;
        } catch (error) {
            console.error('Error generating code suggestions:', error);
            throw error;
        }
    }

    /**
     * Check if a service code already exists
     */
    static async checkCodeExists(code) {
        try {
            const response = await axios.post('/inpatient/service-catalogue/check-code-exists', {
                code
            });
            return response.data.exists;
        } catch (error) {
            console.error('Error checking code existence:', error);
            throw error;
        }
    }

    /**
     * Auto-fill service code based on category and department selection
     */
    static async autoFillCode(formData, setFormData) {
        if (formData.category && !formData.code) {
            try {
                const generatedCode = await this.generateCode(
                    formData.category, 
                    formData.department_id
                );
                setFormData(prev => ({
                    ...prev,
                    code: generatedCode
                }));
            } catch (error) {
                console.error('Auto-fill failed:', error);
            }
        }
    }

    /**
     * Validate and suggest alternative codes if current one exists
     */
    static async validateAndSuggest(code, category, departmentId = null) {
        try {
            const exists = await this.checkCodeExists(code);
            
            if (exists) {
                const suggestions = await this.generateCodeSuggestions(
                    category, 
                    departmentId, 
                    3
                );
                return {
                    exists: true,
                    suggestions
                };
            }
            
            return { exists: false };
        } catch (error) {
            console.error('Error validating code:', error);
            throw error;
        }
    }
}

// Example usage in a React component:
/*
import { ServiceCodeGenerator } from '@/utils/serviceCodeGenerator';

const ServiceForm = () => {
    const [formData, setFormData] = useState({
        code: '',
        category: '',
        department_id: null,
        // ... other fields
    });

    // Auto-generate code when category or department changes
    useEffect(() => {
        ServiceCodeGenerator.autoFillCode(formData, setFormData);
    }, [formData.category, formData.department_id]);

    // Manual code generation
    const handleGenerateCode = async () => {
        try {
            const code = await ServiceCodeGenerator.generateCode(
                formData.category, 
                formData.department_id
            );
            setFormData(prev => ({ ...prev, code }));
        } catch (error) {
            // Handle error
        }
    };

    // Code validation on blur
    const handleCodeBlur = async () => {
        if (formData.code) {
            try {
                const result = await ServiceCodeGenerator.validateAndSuggest(
                    formData.code,
                    formData.category,
                    formData.department_id
                );
                
                if (result.exists) {
                    // Show suggestions to user
                    console.log('Code exists, suggestions:', result.suggestions);
                }
            } catch (error) {
                // Handle error
            }
        }
    };

    return (
        // Your form JSX here
    );
};
*/