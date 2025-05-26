<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MessageController;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Chat API routes
    Route::prefix('chat')->group(function () {
        Route::get('/', [MessageController::class, 'index']);
        // Route::post('/messages', [MessageController::class, 'store']);
        // Route::post('/messages/{id}/read', [MessageController::class, 'markAsRead']);
        Route::get('/messages/unread-count', [MessageController::class, 'getUnreadCount']);
    });
});

// Users API route - moved outside auth middleware for testing
Route::get('/users', function() {
    return response()->json([
        'users' => User::where('id', '!=', auth()->id())->get(['id', 'name', 'email'])
    ]);
});

Route::get('/get-users', function() {
    $users = User::all();

    return response()->json($data = $users);
});

require __DIR__.'/auth.php';
