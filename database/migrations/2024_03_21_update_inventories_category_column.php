<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\InventoryCategory;
use App\Models\Inventory;

return new class extends Migration
{
    public function up(): void
    {
        // First, create a default category for each user
        $users = \App\Models\User::all();
        foreach ($users as $user) {
            $defaultCategory = InventoryCategory::create([
                'user_id' => $user->id,
                'name' => 'Default Category',
                'description' => 'Default category for existing items'
            ]);

            // Update all items for this user to use the default category
            Inventory::where('user_id', $user->id)
                ->update(['category' => $defaultCategory->id]);
        }

        // Now rename the column
        Schema::table('inventories', function (Blueprint $table) {
            $table->renameColumn('category', 'category_id');
            $table->foreign('category_id')->references('id')->on('inventory_categories')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->renameColumn('category_id', 'category');
        });
    }
};
