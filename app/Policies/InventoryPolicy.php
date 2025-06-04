<?php

namespace App\Policies;

use App\Models\Inventory;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class InventoryPolicy
{
    use HandlesAuthorization;

    public function update(User $user, Inventory $inventory): bool
    {
        return $user->id === $inventory->user_id;
    }

    public function delete(User $user, Inventory $inventory): bool
    {
        return $user->id === $inventory->user_id;
    }
}
