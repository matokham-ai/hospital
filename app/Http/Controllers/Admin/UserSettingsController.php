<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserSettingsController extends Controller
{
    public function index()
    {
        $users = User::with('roles', 'permissions')
            ->select('id', 'name', 'email', 'status', 'created_at')
            ->paginate(10);

        $roles = Role::select('id', 'name')->get();
        $permissions = Permission::select('id', 'name')->get();

        return Inertia::render('Admin/UserSettings', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8|confirmed',
            'status' => 'sometimes|in:active,inactive,suspended',
            'roles' => 'sometimes|array',
            'roles.*' => 'string|exists:roles,name',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'string|exists:permissions,name'
        ]);

        // Update basic user info
        $userUpdate = [];
        if (isset($validated['name'])) $userUpdate['name'] = $validated['name'];
        if (isset($validated['email'])) $userUpdate['email'] = $validated['email'];
        if (isset($validated['status'])) $userUpdate['status'] = $validated['status'];
        if (isset($validated['password'])) $userUpdate['password'] = bcrypt($validated['password']);
        
        if (!empty($userUpdate)) {
            $user->update($userUpdate);
        }

        // Update roles and permissions
        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }
        
        if (isset($validated['permissions'])) {
            $user->syncPermissions($validated['permissions']);
        }

        return back()->with('success', 'User updated successfully!');
    }

    public function destroy(User $user)
    {
        $user->delete();
        return back()->with('success', 'User deleted.');
    }
}
