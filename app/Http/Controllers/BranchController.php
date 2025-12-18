<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    /**
     * Switch the current branch for the user session
     */
    public function switch(Request $request)
    {
        $branchId = $request->input('branch_id');
        
        if ($branchId === 'all') {
            session()->forget('selected_branch_id');
        } else {
            $branch = Branch::active()->findOrFail($branchId);
            session(['selected_branch_id' => $branch->id]);
        }

        return back()->with('success', 'Branch switched successfully');
    }

    /**
     * Get all active branches
     */
    public function index()
    {
        $branches = Branch::active()
            ->orderBy('is_main_branch', 'desc')
            ->orderBy('branch_name')
            ->get(['id', 'branch_code', 'branch_name', 'location', 'status']);

        return response()->json($branches);
    }
}
