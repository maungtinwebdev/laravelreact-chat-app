<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Models\Message;
use Carbon\Carbon;

class ChatController extends Controller
{
    public function index()
    {
        return Inertia::render('Chat');
    }

    // public function chatRoom()
    // {
    //     return Inertia::render('ChatRoom');
    // }

    public function getUsers()
    {
        $users = User::where('id', '!=', Auth::id())
            ->select('id', 'name', 'email', 'last_seen_at', 'profile_photo')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'last_seen_at' => $user->last_seen_at,
                    'profile_photo' => $user->profile_photo,
                    'is_online' => $user->last_seen_at && now()->diffInSeconds($user->last_seen_at) < 30
                ];
            });

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'required|string|max:1000',
        ]);

        $message = Message::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'content' => $request->content,
            'status' => 'sent'
        ]);

        return response()->json($message->load('sender'));
    }

    public function show($userId)
    {
        $user = Auth::user();

        // Get all messages between the current user and the selected user
        $messages = Message::where(function ($query) use ($user, $userId) {
                $query->where('sender_id', $user->id)
                    ->where('receiver_id', $userId);
            })
            ->orWhere(function ($query) use ($user, $userId) {
                $query->where('sender_id', $userId)
                    ->where('receiver_id', $user->id);
            })
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark messages as delivered if they are sent
        Message::where('sender_id', $userId)
            ->where('receiver_id', $user->id)
            ->where('status', 'sent')
            ->update(['status' => 'delivered']);

        return response()->json($messages);
    }

    public function markAsDelivered($messageId)
    {
        $message = Message::where('id', $messageId)
            ->where('receiver_id', Auth::id())
            ->where('status', 'sent')
            ->first();

        if ($message) {
            $message->update([
                'status' => 'delivered',
                'updated_at' => Carbon::now()
            ]);
        }

        return response()->json(['success' => true]);
    }

    public function markAsSeen($messageId)
    {
        $message = Message::where('id', $messageId)
            ->where('receiver_id', Auth::id())
            ->whereIn('status', ['sent', 'delivered'])
            ->first();

        if ($message) {
            $message->update([
                'status' => 'seen',
                'read_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]);
        }

        return response()->json(['success' => true]);
    }

    public function getUnreadCount()
    {
        $unreadCount = Message::where('receiver_id', Auth::id())
            ->where('status', '!=', 'seen')
            ->count();

        return response()->json(['count' => $unreadCount]);
    }
}
