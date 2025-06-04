<?php

namespace App\Policies;

use App\Models\Inventory;
use App\Models\User;

class InventoryPolicy
{
    public function update(User $user, Inventory $inventory): bool
    {
        return $user->id === $inventory->user_id;
    }

    public function delete(User $user, Inventory $inventory): bool
    {
        return $user->id === $inventory->user_id;
    }
}
