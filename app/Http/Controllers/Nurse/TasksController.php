<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Task;
use Carbon\Carbon;

class TasksController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();
        $search = $request->get('search', '');
        $perPage = 5;
        
        $query = Task::where('assigned_to', auth()->id())
            ->whereDate('due_date', '>=', $today);

        // Apply search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('priority', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%");
            });
        }

        $tasks = $query->orderBy('priority', 'desc')
            ->orderBy('due_date')
            ->paginate($perPage);

        return Inertia::render('Nurse/Tasks/Index', [
            'tasks' => $tasks->getCollection()->map(function($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'priority' => $task->priority,
                    'status' => $task->status,
                    'due_date' => $task->due_date,
                    'is_overdue' => Carbon::parse($task->due_date)->isPast() && $task->status !== 'completed'
                ];
            }),
            'pagination' => [
                'current_page' => $tasks->currentPage(),
                'total' => $tasks->total(),
                'per_page' => $tasks->perPage(),
                'last_page' => $tasks->lastPage(),
                'from' => $tasks->firstItem(),
                'to' => $tasks->lastItem(),
            ],
            'filters' => [
                'search' => $search
            ]
        ]);
    }

    public function show(Task $task)
    {
        // Ensure the task belongs to the authenticated user
        if ($task->assigned_to !== auth()->id()) {
            abort(403, 'Unauthorized access to this task.');
        }

        return Inertia::render('Nurse/Tasks/Show', [
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'priority' => $task->priority,
                'status' => $task->status,
                'due_date' => $task->due_date,
                'completed_at' => $task->completed_at,
                'completion_notes' => $task->completion_notes,
                'is_overdue' => Carbon::parse($task->due_date)->isPast() && $task->status !== 'completed',
                'patient_id' => $task->patient_id,
                'encounter_id' => $task->encounter_id,
            ]
        ]);
    }

    public function complete(Request $request, Task $task)
    {
        $validated = $request->validate([
            'completion_notes' => 'nullable|string|max:500'
        ]);

        $task->update([
            'status' => 'completed',
            'completed_at' => now(),
            'completion_notes' => $validated['completion_notes']
        ]);

        return redirect()->route('nurse.tasks')->with('success', 'Task completed successfully.');
    }
}