<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Drop the is_read column if it exists
            if (Schema::hasColumn('messages', 'is_read')) {
                $table->dropColumn('is_read');
            }

            // Add new columns if they don't exist
            if (!Schema::hasColumn('messages', 'read_at')) {
                $table->timestamp('read_at')->nullable();
            }

            if (!Schema::hasColumn('messages', 'status')) {
                $table->enum('status', ['sent', 'delivered', 'seen'])->default('sent');
            }
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Drop new columns if they exist
            if (Schema::hasColumn('messages', 'read_at')) {
                $table->dropColumn('read_at');
            }

            if (Schema::hasColumn('messages', 'status')) {
                $table->dropColumn('status');
            }

            // Add back the is_read column if it doesn't exist
            if (!Schema::hasColumn('messages', 'is_read')) {
                $table->boolean('is_read')->default(false);
            }
        });
    }
};
