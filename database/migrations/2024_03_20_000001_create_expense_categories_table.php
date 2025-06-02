<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default categories
        DB::table('expense_categories')->insert([
            ['id' => Str::uuid(), 'name' => 'Food & Dining', 'description' => 'Expenses related to food, restaurants, and dining out'],
            ['id' => Str::uuid(), 'name' => 'Transportation', 'description' => 'Expenses for travel, fuel, and public transport'],
            ['id' => Str::uuid(), 'name' => 'Housing', 'description' => 'Rent, mortgage, and housing-related expenses'],
            ['id' => Str::uuid(), 'name' => 'Utilities', 'description' => 'Electricity, water, gas, and other utilities'],
            ['id' => Str::uuid(), 'name' => 'Entertainment', 'description' => 'Movies, games, and entertainment expenses'],
            ['id' => Str::uuid(), 'name' => 'Shopping', 'description' => 'Clothing, electronics, and general shopping'],
            ['id' => Str::uuid(), 'name' => 'Healthcare', 'description' => 'Medical expenses and healthcare costs'],
            ['id' => Str::uuid(), 'name' => 'Education', 'description' => 'Tuition, books, and educational expenses'],
            ['id' => Str::uuid(), 'name' => 'Personal Care', 'description' => 'Beauty, grooming, and personal care items'],
            ['id' => Str::uuid(), 'name' => 'Gifts & Donations', 'description' => 'Gifts, charity, and donations'],
            ['id' => Str::uuid(), 'name' => 'Travel', 'description' => 'Vacation and travel expenses'],
            ['id' => Str::uuid(), 'name' => 'Business', 'description' => 'Business-related expenses'],
            ['id' => Str::uuid(), 'name' => 'Other', 'description' => 'Miscellaneous expenses'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expense_categories');
    }
};
