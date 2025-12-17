# Nursing Tasks Dynamic Display Fix

## Issue
The Nursing Tasks section on the nurse dashboard was showing a static count of 4 tasks, regardless of actual pending work.

## Root Cause
The dashboard controller was always creating 4 system-generated task cards:
1. Medication rounds
2. Vital signs monitoring
3. Care plan updates
4. Patient assessments

These tasks were displayed even when there was no pending work (count = 0), making the task list appear static.

## Solution
Modified `app/Http/Controllers/Nurse/DashboardController.php` to filter out system tasks that have no pending items.

### Changes Made
Added a filter to the system tasks collection:
```php
->filter(function($task) {
    // Only show system tasks that have pending items
    return $task['count'] > 0;
});
```

## Result
- Tasks are now **dynamic** and reflect actual pending work
- System tasks only appear when there are items to complete
- Assigned tasks from the database are always shown
- The task count in the header updates correctly based on actual data

## Testing
Before fix:
- Always showed 4 system tasks (even with 0 pending items)
- Total count: 4 (static)

After fix:
- Shows only tasks with pending work
- Example: 0 system tasks + 3 assigned tasks = 3 total tasks
- Count updates dynamically based on database state

## Impact
- Improved user experience - nurses only see tasks that need attention
- More accurate task management
- Cleaner dashboard when there's no pending work
- Better reflects actual workload
