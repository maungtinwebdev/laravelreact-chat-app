<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $inventory = Inventory::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

        if ($request->wantsJson()) {
            return response()->json($inventory);
        }

        return Inertia::render('Inventory/Index', [
            'inventory' => $inventory
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'minimum_stock' => 'required|integer|min:0'
        ]);

        $validated['user_id'] = auth()->id();

        $inventory = Inventory::create($validated);

        if ($request->wantsJson()) {
            return response()->json($inventory, 201);
        }

        return redirect()->back();
    }

    public function update(Request $request, Inventory $inventory)
    {
        $this->authorize('update', $inventory);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'minimum_stock' => 'required|integer|min:0'
        ]);

        $inventory->update($validated);

        if ($request->wantsJson()) {
            return response()->json($inventory);
        }

        return redirect()->back();
    }

    public function destroy(Request $request, Inventory $inventory)
    {
        $this->authorize('delete', $inventory);

        $inventory->delete();

        if ($request->wantsJson()) {
            return response()->json(null, 204);
        }

        return redirect()->back();
    }
}
