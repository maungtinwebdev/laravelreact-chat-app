<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::withCount('messages')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Admin/UserManagement', [
            'users' => $users
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', Password::defaults()],
            'is_admin' => 'boolean'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_admin' => $request->is_admin ?? false
        ]);

        return back()->with('success', 'User created successfully');
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'is_admin' => 'boolean'
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'is_admin' => $request->is_admin ?? false
        ]);

        if ($request->filled('password')) {
            $request->validate([
                'password' => ['required', Password::defaults()]
            ]);
            $user->update(['password' => Hash::make($request->password)]);
        }

        return back()->with('success', 'User updated successfully');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account');
        }

        $user->delete();
        return back()->with('success', 'User deleted successfully');
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar_url' => 'required|url'
        ]);

        $user = Auth::user();
        $user->avatar_url = $request->avatar_url;
        $user->save();

        return response()->json(['success' => true]);
    }
}
