<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionMatrixOptionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'value' => $this->value,
            'label' => $this->label,
            'description' => $this->description,
            'order_index' => $this->order_index,
            'is_active' => $this->is_active,
            'extra_config' => $this->extra_config,
        ];
    }
}