<?php
namespace App\Policies;

use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class EvaluationAssignmentPolicy
{
    use HandlesAuthorization;

    public function view(User $user, EvaluationAssignment $assignment)
    {
        return $user->id === $assignment->evaluator_id;
    }
}
