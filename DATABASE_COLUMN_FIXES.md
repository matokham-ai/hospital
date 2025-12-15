# 🔧 Database Column Fixes

**Date:** December 2, 2025  
**Status:** ✅ FIXED

---

## 🐛 Issue: Ward Table Primary Key

**Error:**
```
SQLSTATE[42S22]: Column not found: 1054 Unknown column 'id' in 'field list' 
(Connection: mysql, SQL: select `id`, `name` from `wards`)
```

**Root Cause:**
The `wards` table uses `wardid` as the primary key (string), not `id` (integer).

**Table Structure:**
```php
// wards table
$table->string('wardid',20)->primary();  // Primary key
$table->string('name', 100);
$table->string('code', 20)->unique();
$table->uuid('department_id')->nullable();
$table->enum('ward_type', ['GENERAL','ICU','MATERNITY','PEDIATRIC','ISOLATION','PRIVATE']);
$table->integer('total_beds')->default(0);
$table->boolean('is_active')->default(true);
```

**Ward Model Configuration:**
```php
protected $primaryKey = 'wardid';
public $incrementing = false;
protected $keyType = 'string';
```

---

## ✅ Fixes Applied

### File: `app/Http/Controllers/Nurse/WardController.php`

**Fix 1: bedAllocation() method**
```php
// BEFORE
$wards = Ward::select('id', 'name')->get();

// AFTER
$wards = Ward::select('wardid', 'name')->get();
```

**Fix 2: census() method**
```php
// BEFORE
return [
    'id' => $ward->id,
    'name' => $ward->name,
    ...
];

// AFTER
return [
    'id' => $ward->wardid,
    'name' => $ward->name,
    ...
];
```

---

## 📊 Database Schema Summary

### Tables with Non-Standard Primary Keys:

1. **wards**
   - Primary Key: `wardid` (string, 20 chars)
   - Used in: Ward model, bed relationships

2. **encounters**
   - Primary Key: `id` (standard)
   - Date columns: `admission_datetime`, `discharge_datetime` (not `admission_date`)

3. **beds**
   - Primary Key: `id` (standard)
   - Foreign Key: `ward_id` → references `wards.wardid`

4. **bed_assignments**
   - Primary Key: `id` (standard)
   - Foreign Keys: `encounter_id`, `bed_id`
   - Date columns: `assigned_at`, `released_at`

---

## 🧪 Testing Verification

### Queries Now Working:
- ✅ `Ward::select('wardid', 'name')->get()` - Ward list for dropdown
- ✅ `$ward->wardid` - Ward ID access
- ✅ `$ward->beds` - Ward to beds relationship
- ✅ Bed allocation page loads
- ✅ Ward census page loads

### Pages Verified:
- ✅ `/nurse/ipd/beds` - Bed Allocation
- ✅ `/nurse/ipd/census` - Ward Census
- ✅ `/nurse/ipd/admissions` - Admissions
- ✅ `/nurse/ipd/discharges` - Discharges

---

## 🎯 Key Takeaways

### Non-Standard Primary Keys in This System:
1. **wards.wardid** - String primary key
2. **departments.deptid** - String primary key (likely)
3. **patients.id** - Standard integer (likely)

### Always Check:
- ✅ Migration files for actual column names
- ✅ Model `$primaryKey` property
- ✅ Model `$incrementing` property
- ✅ Model `$keyType` property
- ✅ Foreign key references in relationships

### Best Practices:
1. Use model properties instead of hardcoding 'id'
2. Check migration files when encountering column errors
3. Verify model configuration matches database schema
4. Use `$model->getKeyName()` for dynamic primary key access

---

## 🔜 Recommendations

### For Future Development:
1. **Document non-standard primary keys** in README
2. **Create helper methods** for common queries
3. **Add database schema diagram** to documentation
4. **Use model events** to handle custom primary keys
5. **Consider migration** to standard `id` columns (if feasible)

### Code Improvements:
```php
// Instead of hardcoding
Ward::select('id', 'name')->get();

// Use model method
Ward::select((new Ward)->getKeyName(), 'name')->get();

// Or use all columns
Ward::all(['wardid', 'name']);
```

---

## ✅ Status

**All database column issues resolved!**

- ✅ Ward primary key fixed
- ✅ Encounter date columns fixed
- ✅ All queries working
- ✅ All pages loading
- ✅ No SQL errors

**Next Steps:**
- Test all IPD workflows
- Verify all ward-related features
- Check other models for non-standard primary keys

