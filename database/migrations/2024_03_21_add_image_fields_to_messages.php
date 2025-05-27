<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('messages', function (Blueprint $table) {
            if (!Schema::hasColumn('messages', 'image_url')) {
                $table->string('image_url')->nullable();
            }
            if (!Schema::hasColumn('messages', 'image_path')) {
                $table->string('image_path')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['image_url', 'image_path']);
        });
    }
};
