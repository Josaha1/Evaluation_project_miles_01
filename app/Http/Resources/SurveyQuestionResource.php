<?php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SurveyQuestionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                     => $this->id,
            'code'                   => $this->code,
            'question_text'          => $this->question_text,
            'description'            => $this->description,
            'question_type'          => $this->question_type,
            'sub_question_type'      => $this->sub_question_type,
            'is_required'            => $this->is_required,
            'order_index'            => $this->order_index,
            'placeholder'            => $this->placeholder,
            'help_text'              => $this->help_text,
            'matrix_row_label'       => $this->matrix_row_label,
            'matrix_column_label'    => $this->matrix_column_label,
            'allow_multiple_answers' => $this->allow_multiple_answers,
            'min_answers'            => $this->min_answers,
            'max_answers'            => $this->max_answers,
            'validation_rules'       => $this->validation_rules,
            'conditional_logic'      => $this->conditional_logic,
            'is_active'              => $this->is_active,

            // Relations
            'question_options'       => QuestionOptionResource::collection($this->whenLoaded('questionOptions')),
            'matrix_options'         => QuestionMatrixOptionResource::collection($this->whenLoaded('matrixOptions')),
            'rating_scales'          => RatingScaleResource::collection($this->whenLoaded('ratingScales')),
            'conditional_rules'      => SurveyConditionalRuleResource::collection($this->whenLoaded('conditionalRules')),

            // Meta
            'created_at'             => $this->created_at,
            'updated_at'             => $this->updated_at,
        ];
    }
}
