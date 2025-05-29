<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'profile_photo' => ['nullable', 'image', 'max:2048'], // max 2MB
        ]);

        $user = $request->user();

        if ($request->hasFile('profile_photo')) {
            // Delete old photo if exists
            if ($user->profile_photo) {
                Storage::disk('profile_photos')->delete(basename($user->profile_photo));
            }

            // Store new photo
            $path = $request->file('profile_photo')->store('', 'profile_photos');
            $user->profile_photo = Storage::disk('profile_photos')->url($path);
        }

        $user->name = $request->name;
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'profile_photo' => $user->profile_photo
        ]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        // Delete profile photo if exists
        if ($user->profile_photo) {
            Storage::disk('profile_photos')->delete(basename($user->profile_photo));
        }

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
