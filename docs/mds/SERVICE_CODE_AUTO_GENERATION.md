# Service Code Auto-Generation System

## Overview

The service code auto-generation system automatically creates unique service codes based on category and department. This eliminates manual code entry and ensures consistency across your service catalogue.

## How It Works

### Code Format
Service codes follow this pattern: `[CATEGORY_PREFIX][DEPARTMENT_CODE][SEQUENTIAL_NUMBER]`

**Examples:**
- `CONS001` - Consultation service #1
- `LABCA002` - Lab test #2 for Cardiology department
- `IMG003` - Imaging service #3

### Category Prefixes
- **CONS** - Consultation
- **LAB** - Lab Test
- **IMG** - Imaging
- **PROC** - Procedure
- **MED** - Medication
- **CONS** - Consumable
- **BED** - Bed Charge
- **NURS** - Nursing
- **OTH** - Other
- **SVC** - Default fallback

## Features

### 1. Automatic Generation
Service codes are automatically generated when creating new services if no code is provided.

### 2. Manual Generation
Use API endpoints to generate codes on-demand:

```javascript
// Generate a single code
POST /inpatient/service-catalogue/generate-code
{
    "category": "consultation",
    "department_id": 1
}

// Generate multiple suggestions
POST /inpatient/service-catalogue/generate-code-suggestions
{
    "category": "lab_test",
    "department_id": 2,
    "count": 5
}

// Check if code exists
POST /inpatient/service-catalogue/check-code-exists
{
    "code": "CONS001"
}
```

### 3. Frontend Integration
Use the JavaScript utility for seamless frontend integration:

```javascript
import { ServiceCodeGenerator } from '@/utils/serviceCodeGenerator';

// Auto-fill code when category changes
const code = await ServiceCodeGenerator.generateCode('consultation', departmentId);

// Get multiple suggestions
const suggestions = await ServiceCodeGenerator.generateCodeSuggestions('lab_test', departmentId, 3);

// Validate existing code
const result = await ServiceCodeGenerator.validateAndSuggest(userEnteredCode, category, departmentId);
```

## Implementation Details

### Backend Components

1. **ServiceCodeGeneratorService** - Core logic for code generation
2. **ServiceCatalogueController** - API endpoints for code operations
3. **ServiceCatalogue Model** - Auto-generation on model creation

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/inpatient/service-catalogue/generate-code` | POST | Generate single code |
| `/inpatient/service-catalogue/generate-code-suggestions` | POST | Generate multiple suggestions |
| `/inpatient/service-catalogue/check-code-exists` | POST | Check code availability |

### Database Changes
No database migrations required - uses existing `service_catalogues` table structure.

## Usage Examples

### Creating a Service (Backend)
```php
// Code will be auto-generated if not provided
ServiceCatalogue::create([
    'name' => 'General Consultation',
    'category' => 'consultation',
    'department_id' => 1,
    'unit_price' => 100.00,
    // 'code' => '', // Will auto-generate: CONS001
]);
```

### Frontend Form Integration
```javascript
// React component example
const ServiceForm = () => {
    const [formData, setFormData] = useState({
        code: '',
        category: '',
        department_id: null,
    });

    // Auto-generate when category/department changes
    useEffect(() => {
        if (formData.category && !formData.code) {
            ServiceCodeGenerator.autoFillCode(formData, setFormData);
        }
    }, [formData.category, formData.department_id]);

    return (
        <form>
            <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
                <option value="">Select Category</option>
                <option value="consultation">Consultation</option>
                <option value="lab_test">Lab Test</option>
                {/* ... other options */}
            </select>
            
            <input 
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="Code will auto-generate"
            />
        </form>
    );
};
```

## Benefits

1. **Consistency** - Standardized code format across all services
2. **Efficiency** - No manual code entry required
3. **Uniqueness** - Automatic collision detection and resolution
4. **Flexibility** - Manual override still possible
5. **Integration** - Seamless frontend and backend integration

## Testing

Run the test script to verify functionality:
```bash
php test_service_code_generation.php
```

This will test all generation scenarios and confirm the system is working correctly.

## Configuration

The code generation logic can be customized in `ServiceCodeGeneratorService.php`:
- Modify category prefixes
- Adjust sequential number padding
- Change department code integration logic
- Customize code format patterns