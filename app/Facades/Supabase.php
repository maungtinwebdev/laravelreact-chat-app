<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

class Supabase extends Facade
{
    protected static function getFacadeAccessor()
    {
        return 'supabase';
    }
}
