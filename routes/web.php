<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MessageController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\User;
Route::get('/users', function() {
    return response()->json([
        'users' => User::where('id', '!=', auth()->id())->get(['id', 'name', 'email'])
    ]);
});

Route::get('/chat', function () {
    return Inertia::render('Chat');
})->middleware(['auth', 'verified']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Chat API routes
    // Route::prefix('chat')->group(function () {
    //     Route::get('/', [MessageController::class, 'index']);
    //     // Route::post('/messages', [MessageController::class, 'store']);
    //     // Route::post('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    //     Route::get('/messages/unread-count', [MessageController::class, 'getUnreadCount']);
    // });
});

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/chat', function () {
        return Inertia::render('Chat/Chat', [
            'users' => \App\Models\User::where('id', '!=', auth()->id())->get(),
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    })->name('chat');

    Route::get('/profile', function () {
        return Inertia::render('Profile/Profile', [
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    })->name('profile');

    Route::get('/profile/edit', function () {
        return Inertia::render('Profile/Edit', [
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    })->name('profile.edit');

    // Profile routes
    Route::post('/api/profile/update', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Chat page route
    Route::get('/chat', [MessageController::class, 'index'])->name('chat.index');
});

require __DIR__.'/auth.php';
