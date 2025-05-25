<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get all conversations for the user with latest message
        $conversations = Chat::select('chats.*')
            ->where(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->whereIn('id', function ($query) use ($user) {
                $query->select(DB::raw('MAX(id)'))
                    ->from('messages')
                    ->where(function ($q) use ($user) {
                        $q->where('sender_id', $user->id)
                            ->orWhere('receiver_id', $user->id);
                    })
                    ->groupBy(DB::raw('CASE
                        WHEN sender_id = ' . $user->id . ' THEN receiver_id
                        ELSE sender_id
                    END'));
            })
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($message) use ($user) {
                $otherUser = $message->sender_id === $user->id ? $message->receiver : $message->sender;
                return [
                    'id' => $message->id,
                    'content' => $message->content,
                    'created_at' => $message->created_at->toISOString(),
                    'is_read' => $message->is_read,
                    'other_user' => [
                        'id' => $otherUser->id,
                        'name' => $otherUser->name,
                        'email' => $otherUser->email
                    ],
                    'unread_count' => Chat::where('sender_id', $otherUser->id)
                        ->where('receiver_id', $user->id)
                        ->where('is_read', false)
                        ->count()
                ];
            });

        return response()->json($conversations);
    }

    public function show($id)
    {
        $user = Auth::user();
        $otherUser = User::findOrFail($id);

        $messages = Chat::where(function ($query) use ($user, $otherUser) {
                $query->where('sender_id', $user->id)
                    ->where('receiver_id', $otherUser->id);
            })
            ->orWhere(function ($query) use ($user, $otherUser) {
                $query->where('sender_id', $otherUser->id)
                    ->where('receiver_id', $user->id);
            })
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'content' => $message->content,
                    'sender_id' => $message->sender_id,
                    'receiver_id' => $message->receiver_id,
                    'is_read' => $message->is_read,
                    'created_at' => $message->created_at->toISOString(),
                    'sender' => [
                        'id' => $message->sender->id,
                        'name' => $message->sender->name,
                        'email' => $message->sender->email
                    ],
                    'receiver' => [
                        'id' => $message->receiver->id,
                        'name' => $message->receiver->name,
                        'email' => $message->receiver->email
                    ]
                ];
            });

        // Mark messages as read
        Chat::where('sender_id', $otherUser->id)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'required|string|max:1000'
        ]);

        $chat = Chat::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'content' => $request->content
        ]);

        // Mark previous messages as read
        Chat::where('sender_id', $request->receiver_id)
            ->where('receiver_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'id' => $chat->id,
            'content' => $chat->content,
            'sender_id' => $chat->sender_id,
            'receiver_id' => $chat->receiver_id,
            'is_read' => $chat->is_read,
            'created_at' => $chat->created_at->toISOString(),
            'sender' => [
                'id' => $chat->sender->id,
                'name' => $chat->sender->name,
                'email' => $chat->sender->email
            ],
            'receiver' => [
                'id' => $chat->receiver->id,
                'name' => $chat->receiver->name,
                'email' => $chat->receiver->email
            ]
        ], 201);
    }

    public function getUnreadCount()
    {
        $count = Chat::where('receiver_id', Auth::id())
            ->where('is_read', false)
            ->count();

        return response()->json(['unread_count' => $count]);
    }

    public function markAsRead($id)
    {
        $chat = Chat::findOrFail($id);

        if ($chat->receiver_id === Auth::id()) {
            $chat->update(['is_read' => true]);
            return response()->json(['message' => 'Chat marked as read']);
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    public function getConversationUsers()
    {
        $user = Auth::user();

        $users = User::where('id', '!=', $user->id)
            ->with(['sentMessages' => function ($query) use ($user) {
                $query->where('receiver_id', $user->id)
                    ->where('is_read', false);
            }])
            ->with(['receivedMessages' => function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->latest()
                    ->limit(1);
            }])
            ->get()
            ->map(function ($user) {
                $lastMessage = $user->receivedMessages->first();
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'unread_count' => $user->sentMessages->count(),
                    'last_message' => $lastMessage ? [
                        'content' => $lastMessage->content,
                        'created_at' => $lastMessage->created_at->toISOString()
                    ] : null
                ];
            });

        return response()->json($users);
    }
}
