<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // First drop any problematic columns if they exist
            if (Schema::hasColumn('messages', 'read_at')) {
                $table->dropColumn('read_at');
            }
            if (Schema::hasColumn('messages', 'file_path')) {
                $table->dropColumn('file_path');
            }
            if (Schema::hasColumn('messages', 'file_type')) {
                $table->dropColumn('file_type');
            }
            if (Schema::hasColumn('messages', 'file_name')) {
                $table->dropColumn('file_name');
            }

            // Add new columns if they don't exist
            if (!Schema::hasColumn('messages', 'is_read')) {
                $table->boolean('is_read')->default(false);
            }
            if (!Schema::hasColumn('messages', 'image_url')) {
                $table->string('image_url')->nullable();
            }
            if (!Schema::hasColumn('messages', 'image_path')) {
                $table->string('image_path')->nullable();
            }
            if (!Schema::hasColumn('messages', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Remove new columns
            $table->dropColumn(['is_read', 'image_url', 'image_path']);
            $table->dropSoftDeletes();
        });
    }
};
