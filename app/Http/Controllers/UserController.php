<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
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
