<?php

namespace App\Http\Controllers;

use App\Models\Day;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Inertia\Inertia;

class DayController extends Controller
{
    public function index()
    {
        try {
            $days = Day::with('user')
                ->active()
                ->orderBy('created_at', 'desc')
                ->get();

            if (request()->wantsJson()) {
                return response()->json($days);
            }

            return Inertia::render('MyDay', [
                'auth' => [
                    'user' => Auth::user(),
                ],
                'days' => $days
            ]);
        } catch (\Exception $e) {
            if (request()->wantsJson()) {
                return response()->json(['error' => 'Failed to load days'], 500);
            }
            return back()->with('error', 'Failed to load days');
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'media' => 'required|file|mimes:jpeg,png,jpg,gif,mp4|max:10240',
                'caption' => 'nullable|string|max:500',
            ]);

            $file = $request->file('media');
            $mediaType = str_starts_with($file->getMimeType(), 'video/') ? 'video' : 'image';
            $path = $file->store('days', 'public');

            $day = Day::create([
                'user_id' => Auth::id(),
                'media_url' => Storage::url($path),
                'caption' => $request->caption,
                'media_type' => $mediaType,
                'expires_at' => Carbon::now()->addDay(),
            ]);

            return response()->json($day->load('user'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create day'], 500);
        }
    }

    public function destroy(Day $day)
    {
        try {
            if ($day->user_id !== Auth::id()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Delete the media file
            $path = str_replace('/storage/', '', $day->media_url);
            Storage::disk('public')->delete($path);

            $day->delete();

            return response()->json(['message' => 'Day deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete day'], 500);
        }
    }
} 