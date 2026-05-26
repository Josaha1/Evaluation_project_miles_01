<?php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionOptionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                    => $this->id,
            'option_text'           => $this->option_text,
            'option_value'          => $this->option_value,
            'sort_order'            => $this->sort_order,
            'has_text_input'        => $this->has_text_input,
            'conditional_questions' => $this->conditional_questions,
            'is_active'             => $this->is_active,
            'icon'                  => $this->icon,
            'color'                 => $this->color,
        ];
    }
}
