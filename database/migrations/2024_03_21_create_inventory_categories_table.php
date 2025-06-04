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
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Add category_id as nullable first
        Schema::table('inventories', function (Blueprint $table) {
            $table->foreignId('category_id')->after('user_id')->nullable()->constrained('inventory_categories')->onDelete('cascade');
        });

        // Create a default category for each user and update existing items
        $users = \App\Models\User::all();
        foreach ($users as $user) {
            $defaultCategory = InventoryCategory::create([
                'user_id' => $user->id,
                'name' => 'Default Category',
                'description' => 'Default category for existing items'
            ]);

            // Update all items for this user to use the default category
            Inventory::where('user_id', $user->id)
                ->whereNull('category_id')
                ->update(['category_id' => $defaultCategory->id]);
        }

        // Now make the column non-nullable
        Schema::table('inventories', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });

        Schema::dropIfExists('inventory_categories');
    }
};
