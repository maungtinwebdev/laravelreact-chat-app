<?php

namespace App\Policies;

use App\Models\InventoryCategory;
use App\Models\User;

class InventoryCategoryPolicy
{
    public function update(User $user, InventoryCategory $category): bool
    {
        return $user->id === $category->user_id;
    }

    public function delete(User $user, InventoryCategory $category): bool
    {
        return $user->id === $category->user_id;
    }
}
