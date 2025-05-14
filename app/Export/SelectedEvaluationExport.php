<?php
namespace App\Exports;

use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class SelectedEvaluationExport implements WithMultipleSheets
{
    protected $userIds;

    public function __construct(array $userIds)
    {
        $this->userIds = $userIds;
    }

    public function sheets(): array
    {
        $users = User::with('division', 'position')
            ->whereIn('id', $this->userIds)
            ->get()
            ->groupBy(fn($u) => $u->division->name ?? 'ไม่ทราบสายงาน');

        $sheets = [];

        foreach ($users as $divisionName => $usersInDivision) {
            $sheets[] = new \App\Exports\Sheets\DivisionSheet($divisionName, $usersInDivision);
        }

        return $sheets;
    }
}
 