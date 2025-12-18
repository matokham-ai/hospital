# Lab Test Ordering in Consultation - User Guide ✅

## Overview
You can order lab tests for patients during consultation BEFORE completing the consultation. The lab test ordering feature is fully functional and integrated into the SOAP Notes page.

## How to Order Lab Tests During Consultation

### Step 1: Start or Continue Consultation
1. Go to **OPD → Queue** or **OPD → Consultations**
2. Find your patient
3. Click **"Start Consultation"** or **"Continue Consultation"**
4. You'll be taken to the SOAP Notes page

### Step 2: Navigate to Laboratory Tests Section
1. Scroll down on the SOAP Notes page
2. You'll see a section titled **"🧪 Laboratory Tests"**
3. This section appears BEFORE you complete the consultation

### Step 3: Search for Lab Test
1. In the Laboratory Tests section, you'll see a search box
2. Type the name of the test you want to order
   - Example: "CBC", "Blood Sugar", "Urinalysis", etc.
3. As you type, suggestions will appear
4. You can also filter by category if needed

### Step 4: Select a Test
1. Click on the test you want from the suggestions
2. A form will appear with test details:
   - Test name and code
   - Price
   - Sample type
   - Normal range
   - Standard turnaround time

### Step 5: Set Priority Level
Choose the urgency level for the test:
- **🔴 URGENT** - Critical, results needed immediately (2 hours)
- **🟡 FAST** - High priority, results needed today (6 hours)
- **🔵 NORMAL** - Standard processing time (24 hours)

### Step 6: Add Clinical Notes (Optional)
- Add any relevant clinical information
- Special instructions for the laboratory
- Example: "Patient is on anticoagulants", "Fasting sample required"

### Step 7: Save Lab Order
1. Click **"Add Lab Order"** button
2. The test will be added to the list below
3. You'll see a success message
4. The test appears in the "Laboratory Tests" list

### Step 8: Add More Tests (If Needed)
- Repeat steps 3-7 to add more lab tests
- You can add as many tests as needed
- Each test can have different priority levels

### Step 9: Review Lab Orders
In the Laboratory Tests list, you can see:
- Test name and code
- Priority level (with color coding)
- Expected turnaround time
- Clinical notes
- Status

### Step 10: Edit or Delete Lab Orders (Before Completion)
- **Edit**: Click the edit icon to modify priority or notes
- **Delete**: Click the delete icon to remove a test
- ⚠️ You can only edit/delete BEFORE completing the consultation

### Step 11: Complete Consultation
1. Fill in SOAP notes (Subjective, Objective, Assessment, Plan)
2. Add prescriptions if needed
3. Review all lab orders
4. Click **"Complete Consultation"**
5. Confirm in the summary modal
6. Lab orders are submitted to the laboratory system

## Features

### ✅ What You Can Do:
- Search for any active lab test in the catalog
- Filter tests by category
- Set priority level (Urgent/Fast/Normal)
- Add clinical notes for each test
- Order multiple tests in one consultation
- Edit lab orders before completion
- Delete lab orders before completion
- See expected turnaround time for each priority
- View test details (price, sample type, normal range)

### ❌ What You Cannot Do After Completion:
- Add new lab orders
- Edit existing lab orders
- Delete lab orders
- The consultation is locked after completion

## Lab Test Priority Levels Explained

### 🔴 RED - Urgent (STAT)
- **Turnaround**: 2 hours
- **Use for**: Critical/life-threatening situations
- **Example**: Emergency troponin, critical blood gases
- **Processing**: Immediate priority in lab

### 🟡 YELLOW - Fast
- **Turnaround**: 6 hours
- **Use for**: High priority, results needed same day
- **Example**: Pre-operative tests, acute conditions
- **Processing**: Expedited processing

### 🔵 BLUE - Normal
- **Turnaround**: 24 hours
- **Use for**: Routine tests, follow-ups
- **Example**: Regular CBC, routine chemistry
- **Processing**: Standard workflow

## What Happens After You Order Tests

### Immediate:
1. ✅ Lab order saved to database
2. ✅ Appears in your consultation's lab orders list
3. ✅ Can be edited/deleted before completion

### After Consultation Completion:
1. ✅ Lab orders submitted to laboratory system
2. ✅ Lab receives orders with priority levels
3. ✅ Billing items created automatically
4. ✅ Patient can proceed to lab for sample collection
5. ✅ Lab processes based on priority
6. ✅ Results entered and linked to consultation

## Troubleshooting

### "I don't see the lab test search box"
**Check**:
- Are you on the SOAP Notes page? (URL should be `/opd/consultations/{id}/soap`)
- Scroll down to the "🧪 Laboratory Tests" section
- Make sure consultation is not already completed

### "Search is not showing any results"
**Check**:
- Are there active tests in the test catalog?
- Go to Admin → Test Catalogs to verify
- Check if tests have status = "active"
- Try searching with different terms

### "Lab order not saving"
**Check**:
- Browser console for errors (F12)
- Make sure you selected a priority level (required)
- Check Laravel logs: `storage/logs/laravel.log`
- Verify you're logged in and session is active

### "Getting 'Unauthenticated' error"
**Solution**: This was fixed! Make sure you:
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Log out and log back in
- Check CSRF token is present in page

### "Lab orders disappear after page refresh"
**Check**:
- Were they saved successfully? (Check for success message)
- Look in database: `SELECT * FROM opd_lab_orders WHERE appointment_id = ?`
- Check browser console for API errors

## Database Tables

Lab orders are stored in:
```sql
-- Lab orders table
opd_lab_orders
- id
- appointment_id
- test_id
- test_name
- priority (urgent/fast/normal)
- clinical_notes
- status
- expected_completion_at
- created_at
- updated_at
```

## API Endpoints Used

### Search Tests:
```
GET /api/test-catalogs/search/advanced?query={term}&status=active
```

### Get Categories:
```
GET /api/test-catalogs/categories/list
```

### Save Lab Order:
```
POST /api/opd/appointments/{id}/lab-orders
Body: {
  test_id: number,
  test_name: string,
  priority: 'urgent'|'fast'|'normal',
  clinical_notes: string
}
```

### Delete Lab Order:
```
DELETE /api/opd/appointments/{id}/lab-orders/{labOrderId}
```

## Example Workflow

### Scenario: Patient with suspected diabetes

1. **Start consultation** for patient
2. **Fill SOAP notes**:
   - Subjective: "Patient complains of increased thirst and urination"
   - Objective: "BP 130/85, Weight 85kg"
   - Assessment: "Suspected diabetes mellitus"
   - Plan: "Order lab tests, start lifestyle modifications"

3. **Order lab tests**:
   - Search "Fasting Blood Sugar"
   - Priority: FAST (need results today)
   - Clinical notes: "Patient fasting since last night"
   - Click "Add Lab Order"
   
   - Search "HbA1c"
   - Priority: NORMAL
   - Clinical notes: "For diabetes screening"
   - Click "Add Lab Order"
   
   - Search "Lipid Profile"
   - Priority: NORMAL
   - Clinical notes: "Cardiovascular risk assessment"
   - Click "Add Lab Order"

4. **Review orders**:
   - 3 lab tests added
   - 1 FAST priority (6 hours)
   - 2 NORMAL priority (24 hours)

5. **Complete consultation**:
   - Click "Complete Consultation"
   - Review summary showing 3 lab orders
   - Confirm completion
   - Lab orders submitted to laboratory

6. **Patient proceeds to lab**:
   - Lab receives 3 test orders
   - Processes FBS first (FAST priority)
   - Then processes HbA1c and Lipid Profile

## Tips for Efficient Lab Ordering

1. **Use Priority Wisely**: Don't mark everything as URGENT
2. **Add Clinical Notes**: Helps lab technicians understand context
3. **Order Related Tests Together**: More efficient for patient
4. **Check Test Availability**: Ensure tests are in catalog
5. **Review Before Completion**: Double-check all orders
6. **Consider Turnaround Time**: Set patient expectations

## Success Indicators

✅ Search box appears in consultation
✅ Tests appear in search results
✅ Can select a test
✅ Form shows test details
✅ Can set priority level
✅ Can add clinical notes
✅ "Add Lab Order" button works
✅ Test appears in list below
✅ Success message shows
✅ Can add multiple tests
✅ Can edit/delete before completion
✅ Tests included in completion summary
✅ Lab receives orders after completion

---

**Status**: Fully functional and ready to use
**Last Updated**: December 5, 2024
**Related Fixes**: Authentication issues resolved in CONSULTATION_FIXES_APPLIED.md
