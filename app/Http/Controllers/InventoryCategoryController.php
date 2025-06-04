<?php

namespace App\Http\Controllers;

use App\Models\InventoryCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryCategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = InventoryCategory::where('user_id', auth()->id())
            ->orderBy('name')
            ->get();

        if ($request->wantsJson()) {
            return response()->json($categories);
        }

        return Inertia::render('Inventory/Categories/Index', [
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        $category = InventoryCategory::create([
            'user_id' => auth()->id(),
            'name' => $validated['name'],
            'description' => $validated['description']
        ]);

        if ($request->wantsJson()) {
            return response()->json($category, 201);
        }

        return redirect()->back();
    }

    public function update(Request $request, $id)
    {
        $category = InventoryCategory::findOrFail($id);
        $this->authorize('update', $category);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        $category->update($validated);

        if ($request->wantsJson()) {
            return response()->json($category);
        }

        return redirect()->back();
    }

    public function destroy(Request $request, $id)
    {
        $category = InventoryCategory::findOrFail($id);
        $this->authorize('delete', $category);

        $category->delete();

        if ($request->wantsJson()) {
            return response()->json(null, 204);
        }

        return redirect()->back();
    }
}
