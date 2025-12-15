<?php

namespace App\Http\Controllers\Nurse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrdersController extends Controller
{
    public function index(Request $request)
    {
        // Placeholder for orders functionality
        return Inertia::render('Nurse/Orders/Index', [
            'orders' => [],
            'message' => 'Orders module coming soon'
        ]);
    }

    public function medications()
    {
        return Inertia::render('Nurse/Orders/Medications');
    }

    public function labs()
    {
        return Inertia::render('Nurse/Orders/Labs');
    }

    public function imaging()
    {
        return Inertia::render('Nurse/Orders/Imaging');
    }

    public function acknowledge(Request $request, $orderId)
    {
        // Placeholder for order acknowledgment
        return back()->with('success', 'Order acknowledged');
    }
}
