<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatController;
use App\Models\User;
use App\Http\Controllers\InventoryController;

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

Route::middleware(['auth:sanctum', 'web'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Chat API routes
    Route::prefix('chats')->group(function () {
        Route::get('/', [ChatController::class, 'index']);
        Route::post('/', [ChatController::class, 'store']);
        Route::get('/{userId}', [ChatController::class, 'show']);
        Route::get('/messages/unread-count', [ChatController::class, 'getUnreadCount']);
        Route::get('/users', [ChatController::class, 'getUsers']);
        Route::post('/messages/{messageId}/delivered', [ChatController::class, 'markAsDelivered']);
        Route::post('/messages/{messageId}/seen', [ChatController::class, 'markAsSeen']);
    });

    // Inventory API Routes
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory', [InventoryController::class, 'store']);
    Route::put('/inventory/{inventory}', [InventoryController::class, 'update']);
    Route::delete('/inventory/{inventory}', [InventoryController::class, 'destroy']);
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
