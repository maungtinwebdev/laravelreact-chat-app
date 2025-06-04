<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\InventoryCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Inventory::where('user_id', auth()->id());

        if ($request->has('category_id') && $request->category_id !== '') {
            $query->where('category_id', $request->category_id);
        }

        $inventory = $query->get();
        $categories = InventoryCategory::where('user_id', auth()->id())->get();

        if ($request->wantsJson()) {
            return response()->json([
                'inventory' => $inventory,
                'categories' => $categories
            ]);
        }

        return Inertia::render('Inventory/Index', [
            'inventory' => $inventory,
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:inventory_categories,id',
            'quantity' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'minimum_stock' => 'required|numeric|min:0',
        ]);

        $inventory = Inventory::create([
            'user_id' => auth()->id(),
            'name' => $validated['name'],
            'category_id' => $validated['category_id'],
            'quantity' => $validated['quantity'],
            'price' => $validated['price'],
            'description' => $validated['description'],
            'minimum_stock' => $validated['minimum_stock'],
        ]);

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
            'category_id' => 'required|exists:inventory_categories,id',
            'quantity' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'minimum_stock' => 'required|numeric|min:0',
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
