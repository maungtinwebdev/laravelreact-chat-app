<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DayController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\InventoryCategoryController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Http\Request;

// Public routes
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Protected routes
Route::middleware(['web', 'auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/chat', [MessageController::class, 'index'])->name('chat.index');

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // API routes
    Route::get('/users', function() {
        return response()->json([
            'users' => User::where('id', '!=', auth()->id())->get(['id', 'name', 'email'])
        ]);
    });

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Chat API routes
    Route::prefix('chat')->group(function () {
        Route::get('/messages', [MessageController::class, 'index']);
        Route::post('/messages', [MessageController::class, 'store']);
        Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
        Route::post('/messages/{id}/read', [MessageController::class, 'markAsRead']);
        Route::get('/messages/unread-count', [MessageController::class, 'getUnreadCount']);
    });

    // My Day routes
    Route::get('/my-day', [DayController::class, 'index'])->name('my-day');
    Route::get('/days', [DayController::class, 'index'])->name('days.index');
    Route::post('/days', [DayController::class, 'store'])->name('days.store');
    Route::delete('/days/{day}', [DayController::class, 'destroy'])->name('days.destroy');

    // Expense Tracker routes
    Route::get('/expense-tracker', function () {
        return Inertia::render('ExpenseTracker');
    })->name('expense-tracker');

    // Todo List routes
    Route::get('/todos', function () {
        return Inertia::render('TodoList', [
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    })->name('todos');

    // Inventory Management
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/api/inventory', [InventoryController::class, 'store'])->name('inventory.store');
    Route::put('/api/inventory/{inventory}', [InventoryController::class, 'update'])->name('inventory.update');
    Route::delete('/api/inventory/{inventory}', [InventoryController::class, 'destroy'])->name('inventory.destroy');

    // Inventory Categories
    Route::get('/api/inventory-categories', [InventoryCategoryController::class, 'index'])->name('inventory-categories.index');
    Route::post('/api/inventory-categories', [InventoryCategoryController::class, 'store'])->name('inventory-categories.store');
    Route::put('/api/inventory-categories/{id}', [InventoryCategoryController::class, 'update'])->name('inventory-categories.update');
    Route::delete('/api/inventory-categories/{id}', [InventoryCategoryController::class, 'destroy'])->name('inventory-categories.destroy');
});

// Admin routes
Route::middleware(['web', 'auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
});

require __DIR__.'/auth.php';
