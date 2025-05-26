<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('file_path')->nullable();
            $table->string('file_type')->nullable();
            $table->string('file_name')->nullable();
            $table->timestamp('read_at')->nullable();
        });
    }

    public function down()
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['file_path', 'file_type', 'file_name', 'read_at']);
        });
    }
};
