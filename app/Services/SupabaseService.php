<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SupabaseService
{
    protected $supabaseUrl;
    protected $supabaseKey;
    protected $headers;

    public function __construct()
    {
        $this->supabaseUrl = config('services.supabase.url');
        $this->supabaseKey = config('services.supabase.key');
        $this->headers = [
            'apikey' => $this->supabaseKey,
            'Authorization' => 'Bearer ' . $this->supabaseKey,
            'Content-Type' => 'application/json',
            'Prefer' => 'return=minimal'
        ];
    }

    public function from($table)
    {
        return $this->query($table);
    }

    public function query($table)
    {
        return Http::withHeaders($this->headers)
            ->baseUrl($this->supabaseUrl)
            ->get("/rest/v1/{$table}");
    }

    public function insert($table, $data)
    {
        return Http::withHeaders($this->headers)
            ->baseUrl($this->supabaseUrl)
            ->post("/rest/v1/{$table}", $data);
    }

    public function update($table, $id, $data)
    {
        return Http::withHeaders($this->headers)
            ->baseUrl($this->supabaseUrl)
            ->patch("/rest/v1/{$table}?id=eq.{$id}", $data);
    }

    public function delete($table, $id)
    {
        return Http::withHeaders($this->headers)
            ->baseUrl($this->supabaseUrl)
            ->delete("/rest/v1/{$table}?id=eq.{$id}");
    }

    public function select($table, $columns = '*')
    {
        $columns = is_array($columns) ? implode(',', $columns) : $columns;
        return Http::withHeaders($this->headers)
            ->baseUrl($this->supabaseUrl)
            ->get("/rest/v1/{$table}?select={$columns}");
    }
}
