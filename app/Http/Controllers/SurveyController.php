<?php
namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionOption;
use App\Models\SurveyConditionalRule;
use App\Models\SurveyResponse;
use App\Models\SurveyRuleExecution;
use App\Models\SurveySection;
use App\Models\SurveyType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class SurveyController extends Controller
{
    private $conditionalCache = [];
    private $questionCache    = [];
    /**
     * แสดงรายการแบบสอบถาม
     */
    public function index()
    {
        $groups = SurveyType::active()
            ->published()
            ->orderBy('order_index')
            ->get()
            ->map(function ($survey) {
                return [
                    'id'           => $survey->id,
                    'name'         => $survey->name,
                    'description'  => $survey->description,
                    'target_group' => $survey->target_group,
                ];
            });

        $settings = [
            'survey_title'       => 'แบบสอบถามสำรวจการรับรู้ข้อมูลข่าวสาร',
            'survey_description' => 'โครงการจ้างที่ปรึกษาสำรวจการรับรู้ข้อมูลข่าวสารของผู้มีส่วนได้ส่วนเสีย ของการประปานครหลวง ปีงบประมาณ 2568',
            'privacy_notice'     => 'ข้อมูลของท่านจะถูกเก็บไว้เป็นความลับ และข้อมูลที่ได้รับจะนำไปใช้พัฒนาและปรับปรุงการดำเนินงานการประชาสัมพันธ์ของ กปน. เท่านั้น',
            'survey_active'      => 'true',
        ];

        return Inertia::render('Welcome', [
            'groups'   => $groups,
            'settings' => $settings,
        ]);
    }
    public function introduction($groupId)
    {
        try {
            $survey = SurveyType::active()->published()->findOrFail($groupId);

            // ✅ ตรวจสอบสถานะ survey
            if (isset($survey->status) && $survey->status !== 'active') {
                return redirect()->route('survey.select-group')
                    ->with('error', 'แบบสำรวจนี้ไม่สามารถทำได้ในขณะนี้');
            }

            // ✅ ดึง settings จากฐานข้อมูลหรือ config
            $surveySettings = $survey->settings ?? [];

            return Inertia::render('Survey/Introduction', [
                'group'    => [
                    'id'                         => $survey->id,
                    'name'                       => $survey->name,
                    'description'                => $survey->description,
                    'target_group'               => $survey->target_group,
                    'estimated_duration_minutes' => $surveySettings['estimated_duration_minutes'] ?? 15,
                ],
                'settings' => [
                    'survey_title'       => $surveySettings['survey_title'] ?? 'แบบสอบถามสำรวจการรับรู้ข้อมูลข่าวสาร',
                    'survey_description' => $surveySettings['survey_description'] ?? 'โครงการจ้างที่ปรึกษาสำรวจการรับรู้ข้อมูลข่าวสารของผู้มีส่วนได้ส่วนเสีย ของการประปานครหลวง ปีงบประมาณ 2568',
                    'privacy_notice'     => $surveySettings['privacy_notice'] ?? 'ข้อมูลของท่านจะถูกเก็บไว้เป็นความลับ และข้อมูลที่ได้รับจะนำไปใช้พัฒนาและปรับปรุงการดำเนินงานการประชาสัมพันธ์ของ กปน. เท่านั้น',
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Survey Introduction Error: ' . $e->getMessage(), [
                'group_id' => $groupId,
                'trace'    => $e->getTraceAsString(),
            ]);

            return redirect()->route('survey.select-group')
                ->with('error', 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        }
    }
    public function storeConsent($groupId, Request $request)
    {
        try {
            $request->validate([
                'pdpa_consent'      => 'required|boolean|accepted',
                'consent_timestamp' => 'required|date',
            ]);

            // บันทึก consent ลง session
            Session::put('pdpa_consent', [
                'pdpa_consent'      => $request->pdpa_consent,
                'consent_timestamp' => $request->consent_timestamp,
                'group_id'          => $groupId,
                'ip_address'        => $request->ip(),
                'user_agent'        => $request->userAgent(),
            ]);

           

            return response()->json([
                'success'  => true,
                'message'  => 'บันทึกการยินยอมเรียบร้อย',
                'redirect' => route('survey.section', [
                    'groupId'       => $groupId,
                    'sectionNumber' => 1,
                ]),
            ]);

        } catch (\Exception $e) {
            Log::error('Consent Storage Error: ' . $e->getMessage(), [
                'group_id'     => $groupId,
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'error'   => 'เกิดข้อผิดพลาดในการบันทึกการยินยอม',
            ], 500);
        }
    }
    private function checkPdpaConsent($groupId)
    {
        $consent = Session::get('pdpa_consent');

        if (! $consent ||
            ! $consent['pdpa_consent'] ||
            $consent['group_id'] != $groupId) {

            Log::warning('PDPA consent required', [
                'group_id'         => $groupId,
                'has_consent'      => ! empty($consent),
                'consent_group_id' => $consent['group_id'] ?? null,
            ]);

            return false;
        }

        return true;
    }

    /**
     * แสดงหน้าเลือกกลุ่มผู้ตอบ
     */
    public function selectGroup()
    {
        $groups = SurveyType::active()
            ->published()
            ->orderBy('order_index')
            ->get()
            ->map(function ($survey) {
                return [
                    'id'          => $survey->id,
                    'name'        => $survey->name,
                    'description' => $survey->description,
                ];
            });

        return Inertia::render('Survey/SelectGroup', [
            'groups' => $groups,
        ]);
    }

    /**
     * เริ่มทำแบบสอบถาม
     */
    public function start($groupId, Request $request)
    {
        try {
            // ✅ ตรวจสอบว่า survey group มีอยู่จริงและ active
            $survey = SurveyType::active()->published()->findOrFail($groupId);

            // ✅ ตรวจสอบสถานะ survey
            if (isset($survey->status) && $survey->status !== 'active') {
                return redirect()->route('survey.select-group')
                    ->with('error', 'แบบสำรวจนี้ไม่สามารถทำได้ในขณะนี้');
            }

            // ✅ ตรวจว่าต้องการ restart หลังยุติหรือไม่
            if ($request->query('restart') === 'true') {
                // ลบ session เก่าเพื่อเริ่มใหม่
                Session::forget('survey_response_id');
                Session::forget('pdpa_consent');
                Log::info('ผู้ใช้ขอเริ่มแบบสอบถามใหม่หลังยุติ', [
                    'group_id' => $groupId
                ]);
            }

            // ✅ เก็บข้อมูล initial client data (ถ้ามี)
            if ($request->isMethod('post')) {
                $clientData = $this->extractClientData($request);
                Session::put('survey_initial_client_data', $clientData);

               
            }

            // ✅ Redirect ไปยังหน้า introduction
            return redirect()->route('survey.introduction', ['groupId' => $groupId]);

        } catch (\Exception $e) {
            Log::error('Survey Start Error: ' . $e->getMessage(), [
                'group_id' => $groupId,
                'trace'    => $e->getTraceAsString(),
            ]);

            return redirect()->route('survey.select-group')
                ->with('error', 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        }
    }
    public function begin($groupId, Request $request)
    {
        try {
            // ✅ ตรวจสอบว่า groupId ถูกต้อง
         
            $survey = SurveyType::active()->published()->findOrFail($groupId);

            // ✅ ตรวจสอบสถานะ survey
            if (isset($survey->status) && $survey->status !== 'active') {
                return redirect()->route('survey.select-group')
                    ->with('error', 'แบบสำรวจนี้ไม่สามารถทำได้ในขณะนี้');
            }

            // ✅ ล้าง session เก่า (ถ้ามี)
            Session::forget(['survey_response_id', 'survey_group_id']);

            // ✅ เก็บ group_id ไว้ใน session - ใช้ groupId ที่ได้รับมา
            Session::put('survey_group_id', $groupId);

            // ✅ รวมข้อมูล client จาก start และ begin
            $initialClientData  = Session::get('survey_initial_client_data', []);
            $currentClientData  = $this->extractClientData($request);
            $combinedClientData = array_merge($initialClientData, $currentClientData);

            Session::put('survey_client_data', $combinedClientData);

         

            // ✅ CRITICAL FIX: ใช้ groupId ที่ถูกต้องในการ redirect
            return redirect()->route('survey.section', [
                'groupId'       => $groupId, // ใช้ตัวแปรที่ได้รับมาโดยตรง
                'sectionNumber' => 1,
            ]);

        } catch (\Exception $e) {
            Log::error('Survey Begin Error: ' . $e->getMessage(), [
                'group_id' => $groupId,
                'trace'    => $e->getTraceAsString(),
            ]);

            return redirect()->route('survey.introduction', ['groupId' => $groupId])
                ->with('error', 'เกิดข้อผิดพลาดในการเริ่มแบบสำรวจ กรุณาลองใหม่อีกครั้ง');
        }
    }
    public function section($groupId, $sectionNumber, Request $request)
    {
        try {
          

            $survey = SurveyType::findOrFail($groupId);

            // 🔧 Cache sections to prevent repeated queries
            $cacheKey = "sections_{$groupId}";
            $sections = Cache::remember($cacheKey, 300, function () use ($groupId) {
                return SurveySection::where('survey_type_id', $groupId)
                    ->active()
                    ->orderBy('order_index')
                    ->get();
            });

            $totalSections = $sections->count();

            if ($sectionNumber < 1 || $sectionNumber > $totalSections) {
                return redirect()->route('survey.section', [
                    'groupId'       => $groupId,
                    'sectionNumber' => 1,
                ]);
            }

            $currentSection = $sections->where('order_index', $sectionNumber)->first();

            if (! $currentSection || ! is_object($currentSection)) {
                Log::error('Current section is invalid');
                return redirect()->route('survey.index');
            }

            // ✅ ตรวจสอบ session และสร้าง SurveyResponse ใหม่หากจำเป็น
            $responseId = Session::get('survey_response_id');
            $response   = null;

            if ($responseId) {
                $response = SurveyResponse::find($responseId);
                if (! $response || $response->survey_type_id != $groupId) {
                    $response = null;
                    Session::forget('survey_response_id');
                }
            }

            // ✅ ตรวจสถานะ terminated ก่อนสร้างใหม่ - อนุญาตให้เริ่มใหม่ได้
            if ($response && $response->status === 'terminated') {
                Log::info('ผู้ใช้ต้องการเริ่มแบบสอบถามใหม่หลังยุติ', [
                    'group_id' => $groupId,
                    'old_response_id' => $response->id,
                    'old_status' => $response->status
                ]);
                
                // ✅ ลบ session และรีเซ็ต response เพื่อเริ่มใหม่
                Session::forget('survey_response_id');
                $response = null;
            }

            if (! $response) {
                $response = $this->createSurveyResponse($groupId, $request);
                Session::put('survey_response_id', $response->id);
                Log::info('สร้าง response ใหม่สำหรับการเริ่มใหม่', [
                    'group_id' => $groupId,
                    'new_response_id' => $response->id
                ]);
            }

            // ✅ CRITICAL FIX: ตรวจสอบว่า section นี้ถูก skip หรือไม่ก่อนแสดงผล
            $skippedSections = $this->getSkippedSectionsFromResponse($response);

            if (in_array($sectionNumber, $skippedSections)) {
                // ตรวจสอบว่าเป็นการนำทางแบบย้อนกลับหรือไม่
                $currentMaxSection = $this->getCurrentMaxAccessibleSection($response);
                
                if ($sectionNumber < $currentMaxSection) {
                    // เป็นการนำทางย้อนกลับ ให้หา section ก่อนหน้าที่ไม่ถูก skip
                    $previousSection = $this->getPreviousNonSkippedSection($sectionNumber, $skippedSections);
                    
                    if ($previousSection > 0) {
                        return redirect()->route('survey.section', [
                            'groupId'       => $groupId,
                            'sectionNumber' => $previousSection,
                        ]);
                    }
                }

                // เป็นการนำทางไปข้างหน้า ให้หา section ถัดไปที่ไม่ถูก skip
                $nextSection = $this->getNextNonSkippedSection($sectionNumber, $skippedSections, $totalSections);

                if ($nextSection <= $totalSections) {
                    return redirect()->route('survey.section', [
                        'groupId'       => $groupId,
                        'sectionNumber' => $nextSection,
                    ]);
                } else {
                    // ถ้าไม่มี section ถัดไป ให้ไปหน้า thank you
                    return redirect()->route('survey.thank-you', [
                        'group'    => $groupId,
                        'response' => $response->id,
                    ]);
                }
            }

            // ✅ ADDITIONAL CHECK: ตรวจสอบ skip logic จาคำตอบที่มีอยู่
            $shouldSkipSection = $this->checkIfSectionShouldBeSkipped($response, $sectionNumber);

            if ($shouldSkipSection) {
              

                // อัพเดต metadata ให้รวม section ที่ควรถูกข้าม
                $this->updateSkippedSectionsInResponse($response, [$sectionNumber]);

                $nextSection = $this->getNextNonSkippedSection($sectionNumber, array_merge($skippedSections, [$sectionNumber]), $totalSections);

                if ($nextSection <= $totalSections) {
                    return redirect()->route('survey.section', [
                        'groupId'       => $groupId,
                        'sectionNumber' => $nextSection,
                    ]);
                } else {
                    return redirect()->route('survey.thank-you', [
                        'group'    => $groupId,
                        'response' => $response->id,
                    ]);
                }
            }

            // บันทึกคำตอบก่อนหน้า (ถ้ามี)
            if ($request->has('answers')) {
                $this->saveAnswersQuietly($responseId, $request->get('answers', []), $request->get('current_section', $sectionNumber - 1));
            }

            // ดำเนินการปกติต่อไป (load questions, etc.)
            $rawQuestions       = $this->getRawQuestionsOptimized($currentSection, $response);
            $formattedQuestions = $this->getFormattedQuestionsOptimized($rawQuestions);

        
            // ดึงคำตอบที่มีอยู่แล้ว
            $existingAnswers = $this->getExistingAnswersOptimized($responseId, $rawQuestions->pluck('id'));

            // ดึง conditional rules ที่เกี่ยวข้อง
            $conditionalRules = $this->getConditionalRulesOptimized($survey->id, $rawQuestions->pluck('id'));

            // ดึงข้อมูลคำตอบทั้งหมดสำหรับ conditional evaluation
            $allAnswers = $this->getAllExistingAnswersOptimized($responseId);

            // 🔧 FIXED: Optimized question states evaluation
            $questionStates = $this->evaluateQuestionStatesOptimized($rawQuestions, $allAnswers, $conditionalRules);

            // ✅ NEW: ดึงข้อมูล skipped sections และ skip reasons
            $skipInfo = $this->getSkipInformationFromResponse($response);

            // ✅ Track max section accessed for back navigation
            $this->updateMaxSectionAccessed($response, $sectionNumber);

            return Inertia::render('Survey/Form', [
                'group'             => [
                    'id'                         => $survey->id,
                    'name'                       => $survey->name,
                    'has_conditional_logic'      => $survey->has_conditional_logic,
                    'estimated_duration_minutes' => $survey->settings['estimated_duration_minutes'] ?? null,
                ],
                'response'          => [
                    'id'                  => $responseId,
                    'status'              => $response->status,
                    'termination_reason'  => $response->termination_reason,
                    'progress_percentage' => $response->progress_percentage,
                ],
                'questions'         => $formattedQuestions,
                'sections'          => $this->formatSectionsForFrontendOptimized($sections),
                'currentSection'    => $sectionNumber,
                'totalSections'     => $totalSections,
                'answers'           => $existingAnswers,
                'allAnswers'        => $this->formatAllAnswersForFrontendOptimized($allAnswers),
                'conditionalRules'  => $conditionalRules,
                'hiddenQuestions'   => $questionStates['hidden'],
                'requiredQuestions' => $questionStates['required'],
                'optionalQuestions' => $questionStates['optional'],
                // ✅ NEW: ส่งข้อมูล skip sections ไปยัง frontend
                'skippedSections'   => $skipInfo['skipped_sections'],
                'skipReasons'       => $skipInfo['skip_reasons'],
            ]);

        } catch (\Exception $e) {
            Log::error('Survey Section Error: ' . $e->getMessage(), [
                'group_id'       => $groupId,
                'section_number' => $sectionNumber,
                'trace'          => $e->getTraceAsString(),
            ]);

            return redirect()->route('welcome')->with('error', 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        }
    }
    private function checkIfSectionShouldBeSkipped($response, $sectionNumber): bool
    {
        // เฉพาะ section 5 ที่ต้องตรวจสอบ group_user
        if ($sectionNumber !== 5) {
            return false;
        }

        $question40Answers = QuestionAnswer::where('survey_response_id', $response->id)
            ->where('question_id', 40)
            ->with(['question', 'questionOption'])
            ->get();

        foreach ($question40Answers as $answer) {
           

            // ✅ เช็คจาก question_option_id = 119
            if ($answer->question_option_id == 119) {
              
                return true;
            }

            // ✅ เช็คจาก option_value ในฐานข้อมูล
            if ($answer->question_option_id) {
                $option = QuestionOption::find($answer->question_option_id);

                if ($option) {
                

                    // ✅ เช็คจาก option_value = "2" (other_area)
                    if ($option->option_value === "2" || $option->option_value === 2) {
                       
                        return true;
                    }

                    // ✅ เช็คจาก option_text เป็น fallback
                    if (strpos(strtolower($option->option_text), 'อื่น') !== false ||
                        strpos(strtolower($option->option_text), 'other') !== false) {
                      
                        return true;
                    }
                }
            }

            // ✅ เช็คจาก answer_json เป็น fallback
            if (! empty($answer->answer_json)) {
                $jsonData = json_decode($answer->answer_json, true);

                if (isset($jsonData['option_id']) && $jsonData['option_id'] == 119) {
                  
                    return true;
                }

                if (isset($jsonData['option_value']) && ($jsonData['option_value'] === "2" || $jsonData['option_value'] === 2)) {
                 
                    return true;
                }
            }
        }

        // หา group_user question และคำตอบ
        $groupUserAnswers = QuestionAnswer::where('survey_response_id', $response->id)
            ->whereHas('question', function ($query) {
                $query->where('code', 'LIKE', '%group_user%');
            })
            ->with(['question', 'questionOption'])
            ->get();

        foreach ($groupUserAnswers as $answer) {
          

            // ✅ CRITICAL FIX: ตรวจสอบ option_value โดยตรงจากฐานข้อมูล
            if ($answer->question_option_id) {
                $option = QuestionOption::find($answer->question_option_id);

                if ($option) {

                    // ✅ เช็คจาก option_value ในฐานข้อมูล
                    if ($option->option_value === "2" || $option->option_value === 2) {
                     
                        return true;
                    }

                    // ✅ เช็คจาก option_text เป็น fallback
                    if (strpos(strtolower($option->option_text), 'อื่น') !== false ||
                        strpos(strtolower($option->option_text), 'other') !== false) {
                      
                        return true;
                    }

                    // ✅ เช็คจาก skip_config
                    if (! empty($option->skip_config)) {
                        $skipConfig = $option->skip_config;
                        if (isset($skipConfig['enabled']) && $skipConfig['enabled'] === true) {
                            if (isset($skipConfig['action']) && $skipConfig['action'] === 'skip_section') {
                                if (isset($skipConfig['target_section']) && $skipConfig['target_section'] == 5) {
                                  
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }

       
        return false;
    }

/**
 * ✅ NEW: อัพเดต skipped sections ใน response metadata
 */
    private function updateSkippedSectionsInResponse($response, array $sectionsToSkip)
    {
        $metadata        = $response->metadata ?? [];
        $existingSkipped = $metadata['skipped_sections'] ?? [];

        $allSkipped = array_unique(array_merge($existingSkipped, $sectionsToSkip));

        $metadata['skipped_sections'] = array_values($allSkipped);

        // เพิ่ม skip reasons
        $skipReasons = $metadata['skip_reasons'] ?? [];
        foreach ($sectionsToSkip as $section) {
            if (! isset($skipReasons[$section])) {
                $skipReasons[$section] = 'ไม่อยู่ในพื้นที่ กทม. นนทบุรี สมุทรปราการ';
            }
        }
        $metadata['skip_reasons'] = $skipReasons;

        $response->metadata = $metadata;
        $response->save();

       
    }
    private function getSkippedSectionsFromResponse(SurveyResponse $response): array
    {
        $metadata = $response->metadata ?? [];
        return $metadata['skipped_sections'] ?? [];
    }
    private function getSkipInformationFromResponse(SurveyResponse $response): array
    {
        $metadata = $response->metadata ?? [];

        return [
            'skipped_sections' => $metadata['skipped_sections'] ?? [],
            'skip_reasons'     => $metadata['skip_reasons'] ?? [],
        ];
    }
    private function createSurveyResponse($groupId, Request $request)
    {
        if (! $this->checkPdpaConsent($groupId)) {
            throw new \Exception('PDPA consent required');
        }
        $consent      = Session::get('pdpa_consent');
        $ipAddress    = $request->ip();
        $locationData = $this->extractLocationData($request);
        $clientData   = Session::get('survey_client_data', []);

        // ✅ Merge session client data with current request data
        $currentClientData = $this->extractClientData($request);
        $finalClientData   = array_merge($clientData, $currentClientData);

        $response = SurveyResponse::create([
            'survey_type_id'     => $groupId,
            'session_id'         => $request->session()->getId(),
            'ip_address'         => $ipAddress,
            'latitude'           => $locationData['latitude'],
            'longitude'          => $locationData['longitude'],
            'location_accuracy'  => $locationData['accuracy'],
            'location_timestamp' => $locationData['timestamp'],
            'location_data'      => $locationData['additional_data'],
            'user_agent'         => $request->userAgent(),
            'device_info'        => array_merge([
                'platform' => $request->header('sec-ch-ua-platform'),
                'mobile'   => $request->header('sec-ch-ua-mobile') === '?1',
            ], $finalClientData['device_info'] ?? []),
            'referrer_url'       => $request->header('referer'),
            'started_at'         => now(),
            'status'             => 'in_progress',
            'survey_version'     => '2.0', // ✅ เพิ่ม version
            'conditional_path'   => [],
            'metadata'           => array_merge([
                'created_from'              => 'introduction_flow',
                'section_number'            => 1,
                'entry_method'              => 'introduction_page',
                'introduction_completed_at' => now()->toISOString(),
                'pdpa_consent'              => [
                    'pdpa_consent'       => $consent['pdpa_consent'],
                   
                    'consent_timestamp'  => $consent['consent_timestamp'],
                    'consent_ip'         => $consent['ip_address'],
                    'consent_user_agent' => $consent['user_agent'],
                ],
            ], $finalClientData['metadata'] ?? []),
        ]);

       

        return $response;
    }

    /**
     * 🔧 NEW: ดึงข้อมูล client จาก request
     */
    private function extractClientData(Request $request): array
    {
        return [
            'device_info' => [
                'screen_resolution' => $request->input('client_info.screen_resolution',
                    $request->input('screen_resolution')),
                'timezone'          => $request->input('client_info.timezone',
                    $request->input('timezone', $request->header('timezone'))),
                'language'          => $request->input('client_info.language',
                    $request->input('language', $request->header('accept-language'))),
                'platform'          => $request->input('client_info.platform',
                    $request->input('platform', $request->header('sec-ch-ua-platform'))),
                'user_agent'        => $request->userAgent(),
                'ip_address'        => $request->ip(),
            ],
            'metadata'    => [
                'referrer'               => $request->input('session_metadata.referrer',
                    $request->input('referrer', $request->header('referer'))),
                'entry_timestamp'        => $request->input('session_metadata.entry_timestamp',
                    $request->input('entry_timestamp', now()->toISOString())),
                'page_load_time'         => $request->input('session_metadata.page_load_time',
                    $request->input('page_load_time')),
                'introduction_viewed_at' => now()->toISOString(),
            ],
            'location'    => [
                'latitude'          => $request->input('location.latitude', $request->input('latitude')),
                'longitude'         => $request->input('location.longitude', $request->input('longitude')),
                'accuracy'          => $request->input('location.accuracy', $request->input('accuracy')),
                'permission_status' => $request->input('location.permission_status',
                    $request->input('permission_status')),
            ],
        ];
    }

    // 🔧 FIXED: Optimized question retrieval
    private function getRawQuestionsOptimized($section, $response)
    {
        try {
            if (! is_object($section) || ! isset($section->id)) {
                Log::error('Invalid section passed to getRawQuestionsOptimized');
                return collect([]);
            }

            // 🔧 Cache questions with relationships
            $cacheKey     = "questions_{$section->id}";
            $allQuestions = Cache::remember($cacheKey, 300, function () use ($section) {
                return Question::where('survey_section_id', $section->id)
                    ->where('is_active', true)
                    ->orderBy('order_index')
                    ->with([
                        'questionOptions' => function ($query) {
                            $query->where('is_active', true)->orderBy('sort_order');
                        },
                        'matrixOptions',
                        'ratingScales',
                    ])
                    ->get();
            });

          

            return $allQuestions;

        } catch (\Exception $e) {
            Log::error('Error in getRawQuestionsOptimized: ' . $e->getMessage());
            return collect([]);
        }
    }
    // 🔧 FIXED: Optimized question formatting
    private function getFormattedQuestionsOptimized($rawQuestions)
    {
        try {
            return $rawQuestions->map(function ($question) {
                if (! is_object($question) || ! isset($question->id)) {
                    Log::warning('Skipping invalid question in formatting');
                    return null;
                }

                return $this->formatQuestionSafelyOptimized($question);
            })->filter();

        } catch (\Exception $e) {
            Log::error('Error in getFormattedQuestionsOptimized: ' . $e->getMessage());
            return collect([]);
        }
    }
    // 🔧 FIXED: Optimized question formatting
    private function formatQuestionSafelyOptimized($question)
    {
        try {
            if (! is_object($question) || ! isset($question->id)) {
                return null;
            }

            // 🔧 Use cached formatted data if available
            $cacheKey = "formatted_question_{$question->id}";
            return Cache::remember($cacheKey, 300, function () use ($question) {
                return [
                    'id'                     => $question->id,
                    'code'                   => $question->code ?? null,
                    'question_text'          => $question->question_text ?? '',
                    'description'            => $question->description ?? null,
                    'question_type'          => $this->mapQuestionType($question->question_type ?? 'text'),
                    'is_required'            => $question->is_required ?? false,
                    'is_screening'           => $question->is_screening ?? false,
                    'can_terminate_survey'   => $question->can_terminate_survey ?? false,
                    'options'                => $question->options ?? null,
                    'placeholder'            => $question->placeholder ?? null,
                    'help_text'              => $question->help_text ?? null,
                    'extra_config'           => $question->extra_config ?? null,
                    'conditional_logic'      => $question->conditional_logic ?? null,
                    'termination_conditions' => $question->termination_conditions ?? null,
                    'skip_logic'             => $question->skip_logic ?? null,
                    'formatted_options'      => $this->formatQuestionOptionsOptimized($question),
                    'matrix_options'         => [
                        'rows'    => $question->matrixOptions ?
                        $question->matrixOptions->where('type', 'row')->values() :
                        collect(),
                        'columns' => $question->matrixOptions ?
                        $question->matrixOptions->where('type', 'column')->values() :
                        collect(),
                    ],
                    'rating_scales'          => $question->ratingScales ?? collect(),
                ];
            });

        } catch (\Exception $e) {
            Log::error('Error in formatQuestionSafelyOptimized: ' . $e->getMessage());
            return null;
        }
    }
    // 🔧 FIXED: Optimized question options formatting
    private function formatQuestionOptionsOptimized($question)
    {
        try {
            if (! $question->questionOptions) {
                return [];
            }

            return $question->questionOptions->map(function ($option) {
                if (! is_object($option)) {
                    return null;
                }

                return [
                    'value'              => $option->id ?? null,
                    'label'              => $option->option_text ?? '',
                    'has_text_input'     => $option->has_text_input ?? false,
                    'skip_config'        => $option->skip_config ?? null,
                    'termination_config' => $option->termination_config ?? null,
                    'is_termination'     => ! empty($option->termination_config['terminate_survey']),
                    'is_skip'            => ! empty($option->skip_config),
                    'has_conditional'    => ! empty($option->conditional_questions),
                ];
            })->filter()->toArray();

        } catch (\Exception $e) {
            Log::error('Error formatting question options: ' . $e->getMessage());
            return [];
        }
    }
    // 🔧 FIXED: Optimized sections formatting
    private function formatSectionsForFrontendOptimized($sections)
    {
        try {
            return $sections->map(function ($section) {
                if (! is_object($section) || ! isset($section->id)) {
                    return null;
                }

                return [
                    'id'          => $section->id,
                    'name'        => $section->title ?? $section->name ?? 'Unnamed Section',
                    'description' => $section->description ?? '',
                    'order_index' => $section->order_index ?? 0,
                ];
            })->filter();
        } catch (\Exception $e) {
            Log::error('Error formatting sections: ' . $e->getMessage());
            return collect([]);
        }
    }
    private function evaluateQuestionStateWithDependencies($question, $allAnswers, $conditionalRules)
    {
        $state = [
            'visible'  => true,
            'required' => $question->is_required ?? false,
        ];

      

        // ✅ เช็ค conditional logic ของคำถามเอง
        if (! empty($question->conditional_logic)) {
            $logic = $question->conditional_logic;

          

            if (isset($logic['type'])) {
                switch ($logic['type']) {
                    case 'show_if':
                        $operator = $logic['operator'] ?? 'AND';
                        $state['visible'] = $this->evaluateShowIfConditionsOptimized($logic['conditions'] ?? [], $allAnswers, $operator);
                        break;
                    case 'hide_if':
                        $operator = $logic['operator'] ?? 'AND';
                        $state['visible'] = ! $this->evaluateShowIfConditionsOptimized($logic['conditions'] ?? [], $allAnswers, $operator);
                        break;
                }
            }

          
        }

        // ✅ เช็ค conditional rules จากฐานข้อมูล
        $applicableRules = $conditionalRules->filter(function ($rule) use ($question) {
            return $rule['target_question_id'] === $question->id;
        });

        foreach ($applicableRules as $rule) {
            $triggerAnswer = $allAnswers->get($rule['trigger_question_id']);

      

            if ($triggerAnswer && $this->isRuleTriggeredOptimized($rule, $this->extractAnswerValueOptimized($triggerAnswer))) {
              

                switch ($rule['rule_type']) {
                    case 'show_question':
                        $state['visible'] = true;
                        break;
                    case 'hide_question':
                        $state['visible'] = false;
                        break;
                    case 'require_question':
                        $state['required'] = true;
                        break;
                    case 'optional_question':
                        $state['required'] = false;
                        break;
                }
            }
        }

        // ✅ SPECIAL CASE: เช็คเงื่อนไข checkbox dependencies
        $state = $this->checkCheckboxDependencies($question, $allAnswers, $state);

      

        return $state;
    }
    private function checkCheckboxDependencies($question, $allAnswers, $state)
    {
        // ✅ เช็คว่าคำถามนี้ขึ้นอยู่กับคำตอบ checkbox หรือไม่

        // กรณี: คำถาม 1.4 ขึ้นอยู่กับคำตอบของคำถาม 1.3
        if (strpos($question->code ?? '', '1.4') !== false ||
            strpos($question->question_text ?? '', 'ความถี่') !== false) {


            // หาคำถาม 1.3 (checkbox question)
            foreach ($allAnswers as $questionId => $answer) {
                $triggerQuestion = Question::find($questionId);

                if ($triggerQuestion &&
                    $triggerQuestion->question_type === 'checkbox' &&
                    (strpos($triggerQuestion->code ?? '', '1.3') !== false ||
                        strpos($triggerQuestion->question_text ?? '', 'ช่องทาง') !== false)) {

               

                    // ✅ ถ้าไม่มีการเลือกใน checkbox หรือเลือกน้อยกว่า 1 ข้อ
                    if ($this->isAnswerEmpty($answer) ||
                        (is_array($answer) && count($answer) === 0)) {

                     

                        $state['required'] = false; // ✅ ทำให้เป็น optional
                    }

                    break;
                }
            }
        }

        return $state;
    }

// 🔧 FIXED: Optimized question states evaluation
    private function evaluateQuestionStatesOptimized($questions, $allAnswers, $conditionalRules)
    {
        $hiddenQuestions   = [];
        $requiredQuestions = [];
        $optionalQuestions = [];

       

        foreach ($questions as $question) {
            if (! is_object($question) || ! isset($question->id)) {
                Log::warning('evaluateQuestionStatesOptimized received invalid question');
                continue;
            }

            // ✅ CRITICAL FIX: ประเมิน conditional logic อย่างละเอียด
            $questionState = $this->evaluateQuestionStateWithDependencies($question, $allAnswers, $conditionalRules);

        
            if (! $questionState['visible']) {
                $hiddenQuestions[] = $question->id;
            }

            if ($questionState['required'] && $questionState['visible']) {
                $requiredQuestions[] = $question->id;
            } else {
                $optionalQuestions[] = $question->id;
            }
        }


        return [
            'hidden'   => $hiddenQuestions,
            'required' => $requiredQuestions,
            'optional' => $optionalQuestions,
        ];
    }

    private function quickEvaluateConditions(array $conditions, $allAnswers): bool
    {
        foreach ($conditions as $condition) {
            $questionCode = $condition['question_code'] ?? null;
            $operator     = $condition['operator'] ?? 'equals';
            $expected     = $condition['value'] ?? null;

            // หา answer จาก code
            $answer = collect($allAnswers)->first(function ($value, $key) use ($questionCode) {
                $question = Question::find($key);
                return $question && $question->code === $questionCode;
            });

            if ($answer === null) {
                return false;
            }

            switch ($operator) {
                case 'equals':
                    if ($answer != $expected) {
                        return false;
                    }

                    break;

                case 'not_equals':
                    if ($answer == $expected) {
                        return false;
                    }

                    break;

                case 'in':
                    if (! in_array($answer, (array) $expected)) {
                        return false;
                    }

                    break;

                case 'not_in':
                    if (in_array($answer, (array) $expected)) {
                        return false;
                    }

                    break;

                default:
                    return false; // ไม่รู้ operator
            }
        }

        return true;
    }

    // 🔧 FIXED: Optimized single question state evaluation
    private function evaluateQuestionStateOptimized($question, $allAnswers, $conditionalRules)
    {
        if (! is_object($question) || ! isset($question->id)) {
            return [
                'visible'  => true,
                'required' => false,
            ];
        }

        $state = [
            'visible'  => true,
            'required' => $question->is_required ?? false,
        ];

        // Check conditional logic of the question itself
        if (! empty($question->conditional_logic)) {
            $logic = $question->conditional_logic;

            // Quick evaluation without complex processing
            if (isset($logic['type'])) {
                switch ($logic['type']) {
                    case 'show_if':
                        $state['visible'] = $this->quickEvaluateConditions($logic['conditions'] ?? [], $allAnswers);
                        break;
                    case 'hide_if':
                        $state['visible'] = ! $this->quickEvaluateConditions($logic['conditions'] ?? [], $allAnswers);
                        break;
                }
            }
        }

        return $state;
    }

    // 🔧 FIXED: Optimized conditional logic application
    private function applyQuestionConditionalLogicOptimized($question, $allAnswers, $state)
    {
        $logic = $question->conditional_logic;

        // Show if conditions
        if (isset($logic['type']) && $logic['type'] === 'show_if') {
            $state['visible'] = $this->evaluateShowIfConditionsOptimized($logic['conditions'], $allAnswers);
        }

        // Hide if conditions
        if (isset($logic['type']) && $logic['type'] === 'hide_if') {
            $state['visible'] = ! $this->evaluateShowIfConditionsOptimized($logic['conditions'], $allAnswers);
        }

        return $state;
    }
    // 🔧 FIXED: Optimized show_if conditions evaluation with OR/AND support
    private function evaluateShowIfConditionsOptimized($conditions, $allAnswers, $logicOperator = 'AND')
    {
        if (empty($conditions)) {
            return true;
        }

        Log::debug('🔧 evaluateShowIfConditionsOptimized called', [
            'conditions_count' => count($conditions),
            'allAnswers_count' => $allAnswers->count(),
            'logic_operator'   => $logicOperator,
        ]);

        $results = [];

        foreach ($conditions as $condition) {
            $questionCode = $condition['question_code'] ?? null;
            $operator     = $condition['operator'] ?? 'equals';
            $value        = $condition['value'] ?? null;

            if (! $questionCode) {
                Log::warning('🔧 Missing question_code in condition');
                $results[] = false;
                continue;
            }

            // 🔧 Use cache for question lookup
            $triggerQuestion = $this->findQuestionByCodeOptimized($questionCode);
            if (! $triggerQuestion) {
                Log::warning('🔧 Trigger question not found', [
                    'question_code' => $questionCode,
                ]);
                $results[] = false;
                continue;
            }

            $triggerAnswer = $allAnswers->get($triggerQuestion->id);

            Log::debug('🔧 Checking condition - OPTIMIZED', [
                'question_code'       => $questionCode,
                'trigger_question_id' => $triggerQuestion->id,
                'has_trigger_answer'  => ! is_null($triggerAnswer),
                'expected_value'      => $value,
                'operator'            => $operator,
            ]);

            if (! $triggerAnswer) {
                Log::debug('🔧 No trigger answer found');
                $results[] = false;
                continue;
            }

            $answerValue = $this->extractAnswerValueOptimized($triggerAnswer);

            Log::debug('🔧 Extracted answer value - OPTIMIZED', [
                'extracted_value' => $answerValue,
                'extracted_type'  => gettype($answerValue),
            ]);

            $conditionMet = $this->evaluateConditionOptimized($answerValue, $value, $operator);

            Log::debug('🔧 Condition evaluation result - OPTIMIZED', [
                'condition_met' => $conditionMet,
                'comparison'    => sprintf('%s %s %s',
                    is_scalar($answerValue) ? $answerValue : json_encode($answerValue),
                    $operator,
                    $value
                ),
            ]);

            $results[] = $conditionMet;

            // ✅ Early return for OR logic if any condition is true
            if ($logicOperator === 'OR' && $conditionMet) {
                Log::debug('🔧 OR condition met early, returning true');
                return true;
            }

            // ✅ Early return for AND logic if any condition is false
            if ($logicOperator === 'AND' && !$conditionMet) {
                Log::debug('🔧 AND condition failed early, returning false');
                return false;
            }
        }

        // ✅ Final evaluation based on logic operator
        if ($logicOperator === 'OR') {
            $finalResult = in_array(true, $results);
        } else {
            $finalResult = !in_array(false, $results);
        }

        Log::debug('🔧 Final conditional logic result', [
            'logic_operator' => $logicOperator,
            'individual_results' => $results,
            'final_result' => $finalResult,
        ]);

        return $finalResult;
    }
    // 🔧 NEW: Cached question lookup by code
    private function findQuestionByCodeOptimized($questionCode)
    {
        if (isset($this->questionCache[$questionCode])) {
            return $this->questionCache[$questionCode];
        }

        $question                           = Question::where('code', $questionCode)->first();
        $this->questionCache[$questionCode] = $question;

        return $question;
    }
    // 🔧 FIXED: Optimized condition evaluation
    private function evaluateConditionOptimized($answerValue, $conditionValue, $operator)
    {
        Log::debug('🔧 evaluateConditionOptimized called - Matrix Fix', [
            'answerValue'    => $answerValue,
            'conditionValue' => $conditionValue,
            'operator'       => $operator,
            'answerType'     => gettype($answerValue),
            'conditionType'  => gettype($conditionValue),
        ]);

        switch ($operator) {
            case 'equals':
                if (is_array($conditionValue)) {
                    $normalizedAnswerValue = $this->extractAnswerValueOptimized($answerValue);
                    $result                = in_array($normalizedAnswerValue, $conditionValue);
                    Log::debug('🔧 Array equals result - OPTIMIZED', ['result' => $result]);
                    return $result;
                }

                $normalizedAnswerValue = $this->extractAnswerValueOptimized($answerValue);
                $result                = $this->compareValuesOptimized($normalizedAnswerValue, $conditionValue);

                Log::debug('🔧 Equals result - OPTIMIZED', [
                    'result' => $result,
                ]);
                return $result;

            case 'not_equals':
                if (is_array($conditionValue)) {
                    $normalizedAnswerValue = $this->extractAnswerValueOptimized($answerValue);
                    return ! in_array($normalizedAnswerValue, $conditionValue);
                }
                $normalizedAnswerValue = $this->extractAnswerValueOptimized($answerValue);
                return ! $this->compareValuesOptimized($normalizedAnswerValue, $conditionValue);

            case 'contains':
                $normalizedAnswerValue = $this->extractAnswerValueOptimized($answerValue);
                if (is_array($normalizedAnswerValue)) {
                    // ✅ แก้ไข: ใช้ in_array แทน array_intersect สำหรับ checkbox
                    return in_array($conditionValue, $normalizedAnswerValue) || 
                           in_array((string) $conditionValue, $normalizedAnswerValue) ||
                           in_array((int) $conditionValue, $normalizedAnswerValue);
                }
                return str_contains((string) $normalizedAnswerValue, (string) $conditionValue);

            case 'matrix_contains':
                $normalizedAnswerValue = $this->extractAnswerValueOptimized($answerValue);
                if (is_array($normalizedAnswerValue) && is_array($conditionValue) && count($conditionValue) >= 3) {
                    $matrixType  = $conditionValue[0];
                    $rowValue    = $conditionValue[1];
                    $columnValue = $conditionValue[2];

                    return isset($normalizedAnswerValue[$matrixType][$rowValue]) &&
                        $normalizedAnswerValue[$matrixType][$rowValue] === $columnValue;
                }
                return false;

            case 'matrix_rating_range':
            
                return $this->evaluateMatrixRatingRange($answerValue, $conditionValue);

            default:
                Log::warning('🔧 Unknown operator - OPTIMIZED', ['operator' => $operator]);
                return false;
        }
    }
    private function evaluateMatrixRatingRange($answerValue, $conditionValue): bool
    {
      

        if (! $answerValue || ! $conditionValue) {
            Log::debug('🔧 Invalid input for matrix rating range');
            return false;
        }

        $rowValue = $conditionValue['row_value'] ?? null;
        $minValue = $conditionValue['min_value'] ?? null;
        $maxValue = $conditionValue['max_value'] ?? null;

        if (! $rowValue || ($minValue === null && $maxValue === null)) {
            Log::debug('🔧 Missing required parameters for matrix rating range');
            return false;
        }

        // ✅ CRITICAL FIX: รองรับทั้ง flat และ nested structure
        $actualValue = null;

        // กรณีที่ 1: Direct access (flat structure) - {"water_quality_confidence": 1}
        if (is_array($answerValue) && isset($answerValue[$rowValue])) {
            $actualValue = $answerValue[$rowValue];
        
        }
        // กรณีที่ 2: Nested structure - {"confidence":{"water_quality_confidence": 1}}
        else if (is_array($answerValue)) {
            foreach (['awareness', 'needs', 'need', 'confidence', 'rating'] as $matrixType) {
                if (isset($answerValue[$matrixType][$rowValue])) {
                    $actualValue = $answerValue[$matrixType][$rowValue];
               
                    break;
                }
            }
        }
        // กรณีที่ 3: Database object structure
        else if (is_object($answerValue) && isset($answerValue->answer_json)) {
            $jsonData = is_array($answerValue->answer_json) ?
            $answerValue->answer_json :
            json_decode($answerValue->answer_json, true);

            if (isset($jsonData[$rowValue])) {
                $actualValue = $jsonData[$rowValue];
            }
        }

        if ($actualValue === null || $actualValue === undefined || $actualValue === '') {
      
            return false;
        }

        $numericValue = is_numeric($actualValue) ? (int) $actualValue : null;
        if ($numericValue === null) {
            Log::debug('🔧 Answer is not numeric', ['actualValue' => $actualValue]);
            return false;
        }

        // ✅ เช็ค range
        $result = false;
        if ($minValue !== null && $maxValue !== null) {
            $result = $numericValue >= $minValue && $numericValue <= $maxValue;
        } elseif ($minValue !== null) {
            $result = $numericValue >= $minValue;
        } elseif ($maxValue !== null) {
            $result = $numericValue <= $maxValue;
        }


        return $result;
    }
    private function validateMinMaxRules($question, $answer, $rules = null)
    {
        if (! $rules) {
            $rules = $question->validation_rules ?? [];
        }

        $min = $rules['min'] ?? null;
        $max = $rules['max'] ?? null;

        if ($min === null && $max === null) {
            return ['isValid' => true];
        }

        // Convert answer to number
        $numericValue = is_numeric($answer) ? (int) $answer : null;

        if ($numericValue === null) {
            if ($question->is_required) {
                return [
                    'isValid' => false,
                    'message' => 'กรุณากรอกตัวเลข',
                    'details' => ['type' => 'min_max_validation'],
                ];
            }
            return ['isValid' => true]; // Allow empty for non-required
        }

        // Check minimum value
        if ($min !== null && $numericValue < $min) {
            return [
                'isValid' => false,
                'message' => "ค่าต้องไม่น้อยกว่า {$min}",
                'details' => ['type' => 'min_max_validation', 'min' => $min],
            ];
        }

        // Check maximum value
        if ($max !== null && $numericValue > $max) {
            return [
                'isValid' => false,
                'message' => "ค่าต้องไม่มากกว่า {$max}",
                'details' => ['type' => 'min_max_validation', 'max' => $max],
            ];
        }

        return ['isValid' => true];
    }
// 🔧 NEW: Optimized value comparison
    private function compareValuesOptimized($value1, $value2)
    {
        // Strict equality first
        if ($value1 === $value2) {
            return true;
        }

        // Loose equality
        if ($value1 == $value2) {
            return true;
        }

        // Numeric comparison
        if (is_numeric($value1) && is_numeric($value2)) {
            return (int) $value1 === (int) $value2;
        }

        // String comparison
        return (string) $value1 === (string) $value2;
    }
// 🔧 FIXED: Optimized answer value extraction
    private function extractAnswerValueOptimized($answer)
    {
        Log::debug('🔧 extractAnswerValueOptimized called - Matrix Fix', [
            'answer'      => $answer,
            'answer_type' => gettype($answer),
        ]);

        if ($answer === null || $answer === '') {
            return null;
        }

        // Handle stdClass object (from database)
        if (is_object($answer) && isset($answer->answer_json)) {
            $answerData = is_array($answer->answer_json) ?
            $answer->answer_json :
            json_decode($answer->answer_json, true);

            Log::debug('🔧 Processing database answer_json', [
                'answerData' => $answerData,
            ]);

            // ✅ CRITICAL: สำหรับ matrix answers ให้คืน full structure
            if (is_array($answerData)) {
                // เช็คว่าเป็น matrix answer หรือไม่
                $matrixKeys         = ['awareness', 'needs', 'need', 'confidence', 'rating'];
                $hasMatrixStructure = false;

                foreach ($matrixKeys as $key) {
                    if (isset($answerData[$key])) {
                        $hasMatrixStructure = true;
                        break;
                    }
                }

                // ถ้าเป็น flat matrix answer (เช่น confidence ratings)
                if (! $hasMatrixStructure) {
                    $matrixPattern = ['_confidence', '_rating', '_level', '_score'];
                    foreach (array_keys($answerData) as $key) {
                        foreach ($matrixPattern as $pattern) {
                            if (strpos($key, $pattern) !== false) {
                                Log::debug('🔧 Detected flat matrix structure', [
                                    'key'     => $key,
                                    'pattern' => $pattern,
                                ]);
                                return $answerData; // คืน flat structure เลย
                            }
                        }
                    }
                }

                return $answerData;
            }

            // Handle single option answers
            if (isset($answerData['option_value'])) {
                $value = $answerData['option_value'];
                return is_string($value) && is_numeric($value) ? (int) $value : $value;
            } elseif (isset($answerData['option_id'])) {
                $option = QuestionOption::find($answerData['option_id']);
                if ($option && $option->option_value !== null) {
                    $value = $option->option_value;
                    return is_string($value) && is_numeric($value) ? (int) $value : $value;
                }
                return $answerData['option_id'];
            }

            return $answerData;
        }

        // Handle array answers
        if (is_array($answer)) {
            // ✅ CRITICAL: ตรวจสอบว่าเป็น matrix structure หรือไม่
            if (isset($answer['awareness']) || isset($answer['needs']) || isset($answer['need'])) {
                Log::debug('🔧 Matrix structure detected in array', array_keys($answer));
                return $answer; // คืน full matrix structure
            }

            // เช็ค flat matrix pattern
            $flatMatrixKeys = array_filter(array_keys($answer), function ($key) {
                return strpos($key, '_confidence') !== false ||
                strpos($key, '_rating') !== false ||
                strpos($key, '_level') !== false ||
                strpos($key, '_score') !== false;
            });

            if (! empty($flatMatrixKeys)) {
                Log::debug('🔧 Flat matrix pattern detected', [
                    'keys'   => $flatMatrixKeys,
                    'answer' => $answer,
                ]);
                return $answer; // คืน flat structure
            }

            // Handle option_id structure
            if (isset($answer['option_id'])) {
                $option = QuestionOption::find($answer['option_id']);
                if ($option) {
                    if ($option->option_value !== null) {
                        $value = $option->option_value;
                        return is_string($value) && is_numeric($value) ? (int) $value : $value;
                    }

                    // Map from option_text
                    $optionText = strtolower($option->option_text);
                    if (strpos($optionText, 'รู้จัก') !== false && strpos($optionText, 'ไม่รู้จัก') === false) {
                        return 1;
                    } elseif (strpos($optionText, 'ไม่รู้จัก') !== false) {
                        return 2;
                    }
                }
                return $answer['option_id'];
            }
        }

        // Handle scalar values
        if (is_scalar($answer)) {
            return is_string($answer) && is_numeric($answer) ? (int) $answer : $answer;
        }

        return $answer;
    }
// 🔧 FIXED: Optimized existing answers retrieval
    private function getExistingAnswersOptimized($responseId, $questionIds)
    {
        $existingAnswers = [];

        if ($responseId) {
            // 🔧 Use single query with indexing
            $answers = QuestionAnswer::where('survey_response_id', $responseId)
                ->whereIn('question_id', $questionIds)
                ->get()
                ->keyBy('question_id'); // Index by question_id for O(1) lookup

            foreach ($answers as $questionId => $answer) {
                $existingAnswers[$questionId] = $this->formatAnswerValueOptimized($answer);
            }
        }

        return $existingAnswers;
    }
    // 🔧 FIXED: Optimized all answers retrieval
    private function getAllExistingAnswersOptimized($responseId)
    {
        // 🔧 Cache answers to prevent repeated queries
        $cacheKey = "answers_{$responseId}";
        return Cache::remember($cacheKey, 60, function () use ($responseId) {
            $answers = QuestionAnswer::where('survey_response_id', $responseId)->get();

            return $answers->keyBy('question_id')->map(function ($answer) {
                return $this->formatAnswerValueOptimized($answer);
            });
        });
    }
    // 🔧 FIXED: Optimized answer value formatting
    private function formatAnswerValueOptimized($answer)
    {
        Log::debug('🔧 formatAnswerValueOptimized called - Radio Fix', [
            'answer_id'             => $answer->id ?? 'unknown',
            'question_id'           => $answer->question_id ?? 'unknown',
            'question_option_id'    => $answer->question_option_id ?? null,
            'has_text_inputs'       => ! empty($answer->text_inputs),
            'has_answer_json'       => ! empty($answer->answer_json),
            'has_option_text_input' => ! empty($answer->option_text_input), // ✅ เพิ่ม
        ]);

        $result = null;

        // ✅ CRITICAL: Handle radio with text input first
        if (! empty($answer->question_option_id)) {
            $result = [
                'option_id' => $answer->question_option_id,
            ];

            // ✅ Add option_value for conditional logic
            $option = QuestionOption::find($answer->question_option_id);
            if ($option && $option->option_value !== null) {
                $result['option_value'] = $option->option_value;
            }

            // ✅ CRITICAL: Add text input from option_text_input field
            if (! empty($answer->option_text_input)) {
                $result['text']           = $answer->option_text_input;
                $result['has_text_input'] = true;
            }

            // ✅ Also check answer_json for text input
            if (! empty($answer->answer_json)) {
                $jsonData = json_decode($answer->answer_json, true);
                if (isset($jsonData['text']) && ! isset($result['text'])) {
                    $result['text']           = $jsonData['text'];
                    $result['has_text_input'] = true;
                }
                if (isset($jsonData['has_text_input'])) {
                    $result['has_text_input'] = $jsonData['has_text_input'];
                }
            }


            return $result;
        }

        // Handle JSON answer format (existing logic for other question types)
        if (! empty($answer->answer_json)) {
            $jsonData = json_decode($answer->answer_json, true);

            // Handle Mixed Matrix format, etc. (existing logic)
            if (isset($jsonData['awareness']) || isset($jsonData['needs'])) {
                $result = $jsonData;
            } else {
                $result = $jsonData;
            }
        }
        // Handle other formats (existing logic)
        elseif (! empty($answer->answer_text)) {
            $result = $answer->answer_text;
        } elseif (! empty($answer->answer_numeric)) {
            $result = $answer->answer_numeric;
        }

        // ✅ Always merge text_inputs if available
        if (! empty($answer->text_inputs)) {
            $textInputs = json_decode($answer->text_inputs, true);
            if (is_array($textInputs) && ! empty($textInputs)) {
                if (is_array($result)) {
                    $result['text_inputs'] = array_merge(
                        $result['text_inputs'] ?? [],
                        $textInputs ?? []
                    );
                } elseif (is_null($result)) {
                    $result = ['text_inputs' => $textInputs];
                }
            }
        }

        Log::debug('🔧 formatAnswerValueOptimized final result', ['result' => $result]);
        return $result;
    }
// 🔧 FIXED: Optimized conditional rules retrieval
    private function getConditionalRulesOptimized($surveyTypeId, $questionIds)
    {
        // 🔧 Cache conditional rules
        $cacheKey = "conditional_rules_{$surveyTypeId}";
        return Cache::remember($cacheKey, 300, function () use ($surveyTypeId, $questionIds) {
            return SurveyConditionalRule::where('survey_type_id', $surveyTypeId)
                ->whereIn('trigger_question_id', $questionIds)
                ->active()
                ->with(['triggerQuestion', 'targetQuestion', 'targetSection'])
                ->get()
                ->map(function ($rule) {
                    return [
                        'id'                    => $rule->id,
                        'trigger_question_id'   => $rule->trigger_question_id,
                        'trigger_question_code' => $rule->triggerQuestion->code ?? null,
                        'target_question_id'    => $rule->target_question_id,
                        'target_section_id'     => $rule->target_section_id,
                        'rule_type'             => $rule->rule_type,
                        'condition_operator'    => $rule->condition_operator,
                        'condition_value'       => $rule->condition_value,
                        'condition_metadata'    => $rule->condition_metadata,
                        'action'                => $rule->action,
                        'action_parameters'     => $rule->action_parameters,
                        'description'           => $rule->description,
                    ];
                });
        });
    }
    // 🔧 FIXED: Optimized frontend formatting
    private function formatAllAnswersForFrontendOptimized($allAnswers)
    {
        $formatted = [];

        foreach ($allAnswers as $questionId => $answer) {
            if (is_object($answer)) {
                $formatted[$questionId] = $this->formatAnswerValueOptimized($answer);
            } else {
                $formatted[$questionId] = $answer;
            }
        }

        return $formatted;
    }
    private function validateAgeRequirements($question, $answer, $rules = null)
    {
        if (! $rules) {
            $rules = $question->validation_rules ?? [];
        }

        // Check if this is an age question
        if (! ($question->code && strpos($question->code, 'age_') !== false)) {
            return ['isValid' => true];
        }

        $min = $rules['min'] ?? null;
        $max = $rules['max'] ?? null;

        if ($min === null && $max === null) {
            return ['isValid' => true];
        }

        // Convert answer to number
        $age = is_numeric($answer) ? (int) $answer : null;

        if ($age === null) {
            if ($question->is_required) {
                return [
                    'isValid' => false,
                    'message' => 'กรุณากรอกอายุ',
                    'details' => ['type' => 'age_validation', 'field' => 'required'],
                ];
            }
            return ['isValid' => true]; // Allow empty for non-required
        }

        // ✅ Age-specific validations
        // Check if age is a positive integer
        if ($age <= 0) {
            return [
                'isValid' => false,
                'message' => 'อายุต้องเป็นจำนวนบวก',
                'details' => ['type' => 'age_validation', 'field' => 'positive'],
            ];
        }

        // Check if age is an integer (no decimals)
        if ($answer != $age || strpos((string) $answer, '.') !== false) {
            return [
                'isValid' => false,
                'message' => 'กรุณากรอกอายุเป็นจำนวนเต็ม',
                'details' => ['type' => 'age_validation', 'field' => 'integer'],
            ];
        }

        // Check minimum age
        if ($min !== null && $age < $min) {
            return [
                'isValid' => false,
                'message' => "ต้องมีอายุอย่างน้อย {$min} ปี",
                'details' => ['type' => 'age_validation', 'field' => 'min', 'min' => $min],
            ];
        }

        // Check maximum age
        if ($max !== null && $age > $max) {
            return [
                'isValid' => false,
                'message' => "อายุต้องไม่เกิน {$max} ปี",
                'details' => ['type' => 'age_validation', 'field' => 'max', 'max' => $max],
            ];
        }

        return ['isValid' => true];
    }

    // 🔧 FIXED: Optimized rule application
    private function applyRuleToQuestionStateOptimized($rule, $state)
    {
        switch ($rule['rule_type']) {
            case 'show_question':
                $state['visible'] = true;
                break;
            case 'hide_question':
                $state['visible'] = false;
                break;
            case 'require_question':
                $state['required'] = true;
                break;
            case 'optional_question':
                $state['required'] = false;
                break;
        }

        return $state;
    }
    // 🔧 FIXED: Optimized rule triggering check
    private function isRuleTriggeredOptimized($rule, $answerValue)
    {
        $operator        = $rule['condition_operator'];
        $conditionValues = $rule['condition_value'];

        return $this->evaluateConditionOptimized($answerValue, $conditionValues, $operator);
    }

    private function getFormattedQuestions($rawQuestions)
    {
        try {
            $formattedQuestions = collect();

            foreach ($rawQuestions as $question) {
                if (! is_object($question) || ! isset($question->id)) {
                    Log::warning('Skipping invalid question in formatting');
                    continue;
                }

                $formatted = $this->formatQuestionSafely($question);
                if ($formatted) {
                    $formattedQuestions->push($formatted);
                }
            }

            return $formattedQuestions;

        } catch (\Exception $e) {
            Log::error('Error in getFormattedQuestions: ' . $e->getMessage());
            return collect([]);
        }
    }
    private function getRawQuestions($section, $response)
    {
        try {
            if (! is_object($section) || ! isset($section->id)) {
                Log::error('Invalid section passed to getRawQuestions');
                return collect([]);
            }

            $allQuestions = Question::where('survey_section_id', $section->id)
                ->where('is_active', true)
                ->orderBy('order_index')
                ->with([
                    'questionOptions' => function ($query) {
                        $query->where('is_active', true)->orderBy('sort_order');
                    },
                    'matrixOptions',
                    'ratingScales',
                ])
                ->get();


            // Validate that we have proper objects
            $validQuestions = collect();
            foreach ($allQuestions as $question) {
                if (is_object($question) && isset($question->id)) {
                    $validQuestions->push($question);
                } else {
                    Log::warning('Invalid question object', [
                        'question_type' => gettype($question),
                        'has_id'        => isset($question->id),
                    ]);
                }
            }

            return $validQuestions;

        } catch (\Exception $e) {
            Log::error('Error in getRawQuestions: ' . $e->getMessage());
            return collect([]);
        }
    }
    private function formatSectionsForFrontend($sections)
    {
        try {
            return $sections->map(function ($section) {
                // Debug: Check each section before accessing properties
                if (! is_object($section)) {
                    Log::error('Section is not an object', [
                        'section' => $section,
                        'type'    => gettype($section),
                    ]);
                    return null;
                }

                if (! isset($section->id)) {
                    Log::error('Section missing id property', [
                        'section'    => $section,
                        'properties' => get_object_vars($section) ?? 'no properties',
                    ]);
                    return null;
                }

                return [
                    'id'          => $section->id,
                    'name'        => $section->title ?? $section->name ?? 'Unnamed Section',
                    'description' => $section->description ?? '',
                    'order_index' => $section->order_index ?? 0,
                ];
            })->filter(); // Remove null entries
        } catch (\Exception $e) {
            Log::error('Error formatting sections: ' . $e->getMessage(), [
                'sections_type'  => gettype($sections),
                'sections_count' => is_object($sections) && method_exists($sections, 'count') ? $sections->count() : 'unknown',
            ]);
            return collect([]); // Return empty collection on error
        }
    }

    /**
     * ประเมิน state ของคำถามแต่ละข้อ
     */
    private function evaluateQuestionState($question, $allAnswers, $conditionalRules)
    {
        // Ensure we have a proper Question object
        if (! is_object($question) || ! isset($question->id)) {
            Log::warning('evaluateQuestionState received invalid question');
            return [
                'visible'  => true,
                'required' => false,
            ];
        }

        $state = [
            'visible'  => true,
            'required' => $question->is_required ?? false,
        ];

        // ตรวจสอบ conditional logic ของคำถามเอง
        if (! empty($question->conditional_logic)) {
            $state = $this->applyQuestionConditionalLogic($question, $allAnswers, $state);
        }

        // ตรวจสอบ conditional rules จากฐานข้อมูล
        $applicableRules = $conditionalRules->filter(function ($rule) use ($question) {
            return $rule['target_question_id'] === $question->id;
        });

        foreach ($applicableRules as $rule) {
            $triggerAnswer = $allAnswers->get($rule['trigger_question_id']);
            if ($triggerAnswer && $this->isRuleTriggered($rule, $this->extractAnswerValue($triggerAnswer))) {
                $state = $this->applyRuleToQuestionState($rule, $state);
            }
        }

        return $state;
    }

    public function forceRefreshConditionalLogic($groupId, Request $request)
    {
        try {
            $responseId = Session::get('survey_response_id');

            if (! $responseId) {
                return response()->json([
                    'success' => false,
                    'error'   => 'No active survey response',
                ], 419);
            }

            $response   = SurveyResponse::findOrFail($responseId);
            $allAnswers = $this->getAllExistingAnswers($responseId);
            $questions  = Question::whereHas('surveySection', function ($query) use ($groupId) {
                $query->where('survey_type_id', $groupId);
            })->get();

            $conditionalResults = [];

            foreach ($questions as $question) {
                if ($question->conditional_logic) {
                    $shouldShow = $this->evaluateShowIfConditions(
                        $question->conditional_logic['conditions'] ?? [],
                        $allAnswers
                    );

                    $conditionalResults[] = [
                        'question_id'       => $question->id,
                        'question_code'     => $question->code,
                        'should_show'       => $shouldShow,
                        'conditional_logic' => $question->conditional_logic,
                    ];
                }
            }

            return response()->json([
                'success'             => true,
                'conditional_results' => $conditionalResults,
                'all_answers'         => $allAnswers->toArray(),
            ]);

        } catch (\Exception $e) {
            \Log::error('Force refresh error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error'   => 'Failed to refresh conditional logic',
            ], 500);
        }
    }
    /**
     * ใช้ rule กับ question state
     */
    private function applyRuleToQuestionState($rule, $state)
    {
        switch ($rule['rule_type']) {
            case 'show_question':
                $state['visible'] = true;
                break;
            case 'hide_question':
                $state['visible'] = false;
                break;
            case 'require_question':
                $state['required'] = true;
                break;
            case 'optional_question':
                $state['required'] = false;
                break;
        }

        return $state;
    }

    /**
     * ดึงคำถามที่แสดงได้ตามเงื่อนไข
     */
    private function getVisibleQuestions($section, $response)
    {
        try {
            // Validate section parameter
            if (! is_object($section) || ! isset($section->id)) {
                Log::error('Invalid section passed to getVisibleQuestions', [
                    'section' => $section,
                    'type'    => gettype($section),
                ]);
                return collect([]);
            }

            // Fix: Simplify the query and avoid potential scope issues
            $allQuestions = Question::where('survey_section_id', $section->id)
                ->where('is_active', true) // Use explicit where instead of scope
                ->orderBy('order_index')
                ->with([
                    'questionOptions' => function ($query) {
                        $query->where('is_active', true)->orderBy('sort_order');
                    },
                    'matrixOptions',
                    'ratingScales',
                ])
                ->get();


            // Fix: Check if we're getting proper objects
            if ($allQuestions->count() > 0) {
                $firstQuestion = $allQuestions->first();
                if (! is_object($firstQuestion)) {
                    Log::error('Questions are not objects!', [
                        'first_question_type' => gettype($firstQuestion),
                        'first_question_data' => $firstQuestion,
                    ]);

                    // Try alternative query method
                    return $this->getQuestionsAlternativeMethod($section->id);
                }
            }

            $existingAnswers  = $this->getAllExistingAnswers($response->id);
            $visibleQuestions = collect();

            foreach ($allQuestions as $question) {
                // Validate each question before processing
                if (! is_object($question)) {
                    Log::warning('Skipping non-object question', [
                        'question_type' => gettype($question),
                        'question_data' => $question,
                    ]);
                    continue;
                }

                if (! isset($question->id)) {
                    Log::warning('Question missing id property', [
                        'question_class'      => get_class($question),
                        'question_properties' => get_object_vars($question),
                    ]);
                    continue;
                }

                // Format question safely
                $formattedQuestion = $this->formatQuestionSafely($question);
                if ($formattedQuestion) {
                    $visibleQuestions->push($formattedQuestion);
                }
            }

            return $visibleQuestions;

        } catch (\Exception $e) {
            Log::error('Error in getVisibleQuestions: ' . $e->getMessage(), [
                'section_id'  => is_object($section) && isset($section->id) ? $section->id : 'unknown',
                'response_id' => $response->id ?? 'unknown',
                'trace'       => $e->getTraceAsString(),
                'file'        => $e->getFile(),
                'line'        => $e->getLine(),
            ]);
            return collect([]);
        }
    }
    private function formatQuestionSafely($question)
    {
        try {
            // Double-check we have a proper object
            if (! is_object($question)) {
                Log::error('formatQuestionSafely received non-object', [
                    'question' => $question,
                    'type'     => gettype($question),
                ]);
                return null;
            }

            // Check required properties exist
            if (! isset($question->id)) {
                Log::error('Question missing id', [
                    'question_class' => get_class($question),
                    'properties'     => array_keys(get_object_vars($question)),
                ]);
                return null;
            }

            // Load relationships if not loaded
            if (! $question->relationLoaded('questionOptions')) {
                $question->load(['questionOptions' => function ($query) {
                    $query->where('is_active', true)->orderBy('sort_order');
                }]);
            }

            if (! $question->relationLoaded('matrixOptions')) {
                $question->load('matrixOptions');
            }

            if (! $question->relationLoaded('ratingScales')) {
                $question->load('ratingScales');
            }

            return [
                'id'                     => $question->id,
                'code'                   => $question->code ?? null,
                'question_text'          => $question->question_text ?? '',
                'description'            => $question->description ?? null,
                'question_type'          => $this->mapQuestionType($question->question_type ?? 'text'),
                'is_required'            => $question->is_required ?? false,
                'is_screening'           => $question->is_screening ?? false,
                'can_terminate_survey'   => $question->can_terminate_survey ?? false,
                'options'                => $question->options ?? null,
                'placeholder'            => $question->placeholder ?? null,
                'help_text'              => $question->help_text ?? null,
                'extra_config'           => $question->extra_config ?? null,
                'conditional_logic'      => $question->conditional_logic ?? null,
                'termination_conditions' => $question->termination_conditions ?? null,
                'skip_logic'             => $question->skip_logic ?? null,
                'formatted_options'      => $this->formatQuestionOptionsSafely($question),
                'matrix_options'         => [
                    'rows'    => $question->matrixOptions ?
                    $question->matrixOptions->where('type', 'row')->values() :
                    collect(),
                    'columns' => $question->matrixOptions ?
                    $question->matrixOptions->where('type', 'column')->values() :
                    collect(),
                ],
                'rating_scales'          => $question->ratingScales ?? collect(),
            ];

        } catch (\Exception $e) {
            Log::error('Error in formatQuestionSafely: ' . $e->getMessage(), [
                'question_id'   => isset($question->id) ? $question->id : 'unknown',
                'question_type' => gettype($question),
                'trace'         => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

/**
 * Safe question options formatting
 */
    private function formatQuestionOptionsSafely($question)
    {
        try {
            if (! $question->questionOptions) {
                return [];
            }

            return $question->questionOptions->map(function ($option) {
                if (! is_object($option)) {
                    return null;
                }

                // ✅ CRITICAL FIX: ตรวจสอบ has_text_input อย่างถูกต้อง
                $hasTextInput = false;

                // เช็คใน has_text_input field
                if (isset($option->has_text_input) && $option->has_text_input) {
                    $hasTextInput = true;
                }

                // เช็คใน extra_config
                if (isset($option->extra_config['has_text_input']) && $option->extra_config['has_text_input']) {
                    $hasTextInput = true;
                }

                // เช็คจากชื่อ option (fallback)
                if (! $hasTextInput && $option->option_text) {
                    $optionText = strtolower($option->option_text);
                    if (strpos($optionText, 'อื่น') !== false ||
                        strpos($optionText, 'other') !== false ||
                        strpos($optionText, 'ระบุ') !== false) {
                        $hasTextInput = true;
                    }
                }


                return [
                    'value'              => $option->id ?? null,
                    'label'              => $option->option_text ?? '',
                    'has_text_input'     => $hasTextInput, // ✅ ใช้ค่าที่ตรวจสอบแล้ว
                    'skip_config'        => $option->skip_config ?? null,
                    'termination_config' => $option->termination_config ?? null,
                    'is_termination'     => ! empty($option->termination_config['terminate_survey']),
                    'is_skip'            => ! empty($option->skip_config),
                    'has_conditional'    => ! empty($option->conditional_questions),
                ];
            })->filter()->toArray();

        } catch (\Exception $e) {
            Log::error('Error formatting question options: ' . $e->getMessage());
            return [];
        }
    }

    private function getQuestionsAlternativeMethod($sectionId)
    {
        try {
      

            // Use DB facade directly to check what's in the database
            $rawQuestions = \DB::table('questions')
                ->where('survey_section_id', $sectionId)
                ->where('is_active', true)
                ->orderBy('order_index')
                ->get();

          
            // Convert to proper Question models
            $questions = collect();
            foreach ($rawQuestions as $rawQuestion) {
                $questionModel = Question::find($rawQuestion->id);
                if ($questionModel && is_object($questionModel)) {
                    $questions->push($questionModel);
                }
            }

          

            return $questions->map(function ($question) {
                return $this->formatQuestionSafely($question);
            })->filter();

        } catch (\Exception $e) {
            Log::error('Alternative questions method failed: ' . $e->getMessage());
            return collect([]);
        }
    }
    /**
     * ตรวจสอบว่าควรแสดงคำถามหรือไม่ (สำหรับ server-side)
     */
    private function shouldDisplayQuestion($question, $existingAnswers, $response)
    {
        // หากไม่มี conditional logic ให้แสดงเสมอ
        if (empty($question->conditional_logic)) {
            return true;
        }

        $conditionalLogic = $question->conditional_logic;

        // ตรวจสอบเงื่อนไข show_if
        if (isset($conditionalLogic['type']) && $conditionalLogic['type'] === 'show_if') {
            return $this->evaluateShowIfConditions($conditionalLogic['conditions'], $existingAnswers);
        }

        return true;
    }

    /**
     * ประเมินเงื่อนไข Matrix
     */
    private function evaluateMatrixCondition($answer, $condition)
    {
        if (! $answer || ! $answer->answer_json) {
            return false;
        }

        $answerData = $answer->answer_json;

        // ตรวจสอบ matrix_contains condition
        if (isset($condition['operator']) && $condition['operator'] === 'matrix_contains') {
            $rowValue    = $condition['row_value'];
            $columnValue = $condition['column_value'];
            $matrixType  = $condition['matrix_type'] ?? 'awareness';

            return isset($answerData[$matrixType][$rowValue]) &&
                $answerData[$matrixType][$rowValue] === $columnValue;
        }

        // ตรวจสอบ awareness matrix แบบเดิม
        if (isset($condition['column_group']) && $condition['column_group'] === 'awareness') {
            $awarenessData = $answerData['awareness'] ?? [];
            return isset($awarenessData[$condition['row_value']]) &&
                $awarenessData[$condition['row_value']] === $condition['column_value'];
        }

        return false;
    }

    /**
     * ประเมินเงื่อนไข Rating Range
     */
    private function evaluateRatingCondition($answer, $condition)
    {
        if (! $answer || ! $answer->answer_json) {
            return false;
        }

        $answerData  = $answer->answer_json;
        $optionValue = $condition['option_value'];
        $ratingRange = $condition['rating_value'];

        // หาคำตอบสำหรับ option นั้น
        if (isset($answerData[$optionValue])) {
            $rating = (int) $answerData[$optionValue];

            if (is_array($ratingRange) && count($ratingRange) >= 2) {
                return $rating >= min($ratingRange) && $rating <= max($ratingRange);
            } else {
                return $rating == $ratingRange;
            }
        }

        return false;
    }

    /**
     * Real-time conditional logic check
     */
    // 🔧 Enhanced real-time conditional logic check
    public function checkConditionalLogic($groupId, Request $request)
    {
        try {
            $questionId  = $request->input('question_id');
            $answerValue = $request->input('answer_value');
            $allAnswers  = $request->input('all_answers', []);


            $responseId = Session::get('survey_response_id');
            if (! $responseId) {
                return response()->json([
                    'success'  => false,
                    'error'    => 'Session หมดอายุ กรุณาเริ่มใหม่',
                    'redirect' => route('survey.start', $groupId),
                ], 419);
            }

            $response = SurveyResponse::findOrFail($responseId);
            $question = Question::find($questionId);
            // ✅ เช็ค skip_logic: always_skip_to_section (แต่ไม่ redirect ทันที)
            if ($question && isset($question->skip_logic['type'])) {
                if ($question->skip_logic['type'] === 'always_skip_to_section') {
                    $sectionToSkip = $question->skip_logic['skip_to_section'] ?? null;
                    $conditions = $question->skip_logic['conditions'] ?? [];

                    // ✅ ตรวจสอบเงื่อนไขการข้าม
                    $shouldSkip = false;

                    if (empty($conditions)) {
                        // ถ้าไม่มีเงื่อนไข ให้ข้ามเสมอ
                        $shouldSkip = true;
                    } else {
                        // ตรวจสอบเงื่อนไขที่กำหนด
                        foreach ($conditions as $condition) {
                            if (isset($condition['option_value'])) {
                                $optionValue = $condition['option_value'];
                                
                                // ตรวจสอบหลายรูปแบบของคำตอบ
                                if ($answerValue == $optionValue || 
                                    (is_array($answerValue) && isset($answerValue['option_value']) && $answerValue['option_value'] == $optionValue) ||
                                    (is_array($answerValue) && isset($answerValue['option_id']) && $answerValue['option_id'] == $optionValue)) {
                                    $shouldSkip = true;
                                    break;
                                }
                            }
                        }
                    }

                    if ($shouldSkip && $sectionToSkip) {
                        Log::info('🔧 Always skip to section condition detected (will skip on next)', [
                            'question_id' => $questionId,
                            'answer_value' => $answerValue,
                            'skip_to_section' => $sectionToSkip
                        ]);

                        // ✅ ส่งข้อมูลกลับไปยัง frontend แต่ไม่ redirect ทันที
                        return response()->json([
                            'success'  => true,
                            'action'   => 'skip_section_on_next',
                            'skip_to_section' => $sectionToSkip,
                            'reason' => 'Will skip section when "Next" is clicked',
                            'message' => "จะข้ามไปส่วนที่ {$sectionToSkip} เมื่อคลิก 'ถัดไป'",
                        ]);
                    }
                }
            }
            if (! $question) {
                Log::warning('🔧 Question not found', ['question_id' => $questionId]);
                return response()->json(['success' => false, 'error' => 'Question not found']);
            }

            $actualValue = $this->extractAnswerValueOptimized($answerValue);

            // 🔧 PREVIEW TERMINATION: Check termination conditions but only show warning (don't terminate yet)
            $terminationResult = $this->checkTerminationConditionsOptimized($question, $answerValue);
            if ($terminationResult) {
                // Don't terminate immediately - just show warning that survey will terminate on Next
                return response()->json([
                    'success'  => true,
                    'action'   => 'will_terminate',
                    'reason'   => $terminationResult['reason'],
                    'message'  => 'แบบสำรวจจะถูกยุติเมื่อคลิก "ถัดไป"',
                ]);
            }

            // 🔧 IMMEDIATE RESPONSE: Get all affected questions for immediate frontend update
            $affectedQuestions  = [];
            $conditionalActions = [];

            // Check question's own conditional logic for immediate feedback
            if ($question && $question->conditional_logic) {
                $logic = $question->conditional_logic;

                if (isset($logic['type']) && $logic['type'] === 'terminate_survey') {
                    $shouldTerminate = $this->shouldTerminateFromQuestionLogicOptimized($logic, $actualValue);
                    if ($shouldTerminate) {
                        $terminationReason = $logic['conditions'][0]['message'] ?? 'แบบสำรวจถูกยุติตามเงื่อนไข';

                        // Don't terminate immediately - just show warning that survey will terminate on Next
                        return response()->json([
                            'success'  => true,
                            'action'   => 'will_terminate',
                            'reason'   => $terminationReason,
                            'message'  => 'แบบสำรวจจะถูกยุติเมื่อคลิก "ถัดไป"',
                        ]);
                    }
                }
            }

            // 🔧 IMMEDIATE RESPONSE: Check all conditional rules that might be triggered
            $rules = SurveyConditionalRule::where('survey_type_id', $groupId)
                ->where('trigger_question_id', $questionId)
                ->active()
                ->orderBy('priority', 'desc')
                ->get();

            foreach ($rules as $rule) {
                if ($this->evaluateRuleOptimized($rule, $answerValue)) {
                    $action = $this->createConditionalActionOptimized($rule, $answerValue);

                    if ($action['action'] === 'terminate') {
                        // Don't terminate immediately - just show warning that survey will terminate on Next
                        return response()->json([
                            'success'  => true,
                            'action'   => 'will_terminate',
                            'reason'   => $action['reason'],
                            'message'  => 'แบบสำรวจจะถูกยุติเมื่อคลิก "ถัดไป"',
                        ]);
                    }

                    $conditionalActions[] = $action;

                    // Track affected questions for frontend updates
                    if (isset($action['target_question_id'])) {
                        $affectedQuestions[] = $action['target_question_id'];
                    }
                }
            }

            // 🔧 NEW: Also check rules where this question's answer affects OTHER questions
            $allRules = SurveyConditionalRule::where('survey_type_id', $groupId)
                ->active()
                ->get();

            $allAnswersWithCurrent = array_merge($allAnswers, [$questionId => $answerValue]);

            foreach ($allRules as $rule) {
                if ($rule->trigger_question_id === $questionId) {
                    // We already handled this above
                    continue;
                }

                // Check if this rule's trigger question has an answer that might be affected
                $triggerAnswer = $allAnswersWithCurrent[$rule->trigger_question_id] ?? null;
                if ($triggerAnswer && $this->evaluateRuleOptimized($rule, $triggerAnswer)) {
                    if (isset($rule->target_question_id)) {
                        $affectedQuestions[] = $rule->target_question_id;
                    }
                }
            }

            // 🔧 IMMEDIATE RESPONSE: Return comprehensive response for frontend
            return response()->json([
                'success'             => true,
                'action'              => 'continue',
                'conditional_actions' => $conditionalActions,
                'affected_questions'  => array_unique($affectedQuestions),
                'should_refresh'      => ! empty($conditionalActions) || ! empty($affectedQuestions),
                'immediate_feedback'  => true, // 🔧 Flag for frontend to know this is immediate response
                'question_states'     => $this->getQuestionStatesForAnswer($groupId, $questionId, $answerValue, $allAnswersWithCurrent),
            ]);

        } catch (\Exception $e) {
            Log::error('🔧 checkConditionalLogic error: ' . $e->getMessage(), [
                'group_id'    => $groupId,
                'question_id' => $request->input('question_id'),
                'trace'       => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error'   => 'เกิดข้อผิดพลาดในการตรวจสอบเงื่อนไข',
            ], 500);
        }
    }
    private function getQuestionStatesForAnswer($groupId, $questionId, $answerValue, $allAnswers)
    {
        try {
            $survey = SurveyType::findOrFail($groupId);

            // Get all questions in this survey
            $allQuestions = Question::whereHas('surveySection', function ($query) use ($groupId) {
                $query->where('survey_type_id', $groupId);
            })->with(['questionOptions', 'matrixOptions'])->get();

            $questionStates = [];

            foreach ($allQuestions as $question) {
                $state = $this->evaluateQuestionStateOptimized($question, collect($allAnswers), collect([]));

                $questionStates[$question->id] = [
                    'visible'       => $state['visible'],
                    'required'      => $state['required'],
                    'question_code' => $question->code,
                ];
            }

            return $questionStates;

        } catch (\Exception $e) {
            Log::error('Error getting question states: ' . $e->getMessage());
            return [];
        }
    }
    /**
     * ตรวจสอบ termination conditions จาก question options
     */
    // 🔧 FIXED: Optimized termination check
    private function checkTerminationConditionsOptimized($question, $answerValue)
    {
        if (! $question) {
            return null;
        }

        $actualValue = $this->extractAnswerValueOptimized($answerValue);

        // Check termination from question logic first
        if ($question->conditional_logic) {
            $logic = $question->conditional_logic;

            if (isset($logic['type']) && $logic['type'] === 'terminate_survey') {
                if ($this->shouldTerminateFromQuestionLogicOptimized($logic, $answerValue)) {
                    $message = $logic['conditions'][0]['message'] ?? 'แบบสำรวจถูกยุติตามเงื่อนไข';
                    return [
                        'reason' => $message,
                        'source' => 'question_conditional_logic',
                    ];
                }
            }
        }

        // Check termination from question options
        $questionOption = null;

        if (is_numeric($actualValue)) {
            $questionOption = QuestionOption::where('question_id', $question->id)
                ->where('option_value', $actualValue)
                ->first();

            if (! $questionOption) {
                $questionOption = QuestionOption::where('question_id', $question->id)
                    ->where('id', $actualValue)
                    ->first();
            }
        } elseif (is_string($actualValue)) {
            $questionOption = QuestionOption::where('question_id', $question->id)
                ->where('option_value', $actualValue)
                ->first();
        }

        if ($questionOption && ! empty($questionOption->termination_config)) {
            $config = $questionOption->termination_config;

            if (isset($config['terminate_survey']) && $config['terminate_survey'] === true) {
                return [
                    'reason' => $config['termination_reason'] ?? 'แบบสำรวจถูกยุติตามเงื่อนไข',
                    'source' => 'option_termination_config',
                ];
            }
        }

        return null;
    }

    /**
     * ตรวจสอบ termination จาก question logic
     */
    // 🔧 FIXED: Optimized termination check from question logic
    private function shouldTerminateFromQuestionLogicOptimized(array $logic, $answerValue): bool
    {
        if (! isset($logic['conditions']) || ! is_array($logic['conditions'])) {
            return false;
        }

        $actualValue = $this->extractAnswerValueOptimized($answerValue);

        foreach ($logic['conditions'] as $condition) {
            if (! isset($condition['value'])) {
                continue;
            }

            $expectedValue = $condition['value'];

            if ($this->compareValuesOptimized($expectedValue, $actualValue)) {
                return true;
            }
        }

        return false;
    }
// 🔧 FIXED: Optimized rule evaluation
    private function evaluateRuleOptimized($rule, $answerValue)
    {
        $operator        = $rule->condition_operator;
        $conditionValues = $rule->condition_value;

        return $this->evaluateConditionOptimized($answerValue, $conditionValues, $operator);
    }
    // 🔧 FIXED: Optimized conditional action creation
    private function createConditionalActionOptimized($rule, $answerValue)
    {
        $action = [
            'rule_id'   => $rule->id,
            'rule_type' => $rule->rule_type,
            'action'    => $rule->action,
            'reason'    => $rule->description ?? $rule->action_parameters['reason'] ?? 'ดำเนินการตามเงื่อนไข',
            'priority'  => $rule->priority,
        ];

        if ($rule->target_question_id) {
            $action['target_question_id'] = $rule->target_question_id;
        }

        if ($rule->target_section_id) {
            $action['target_section_id'] = $rule->target_section_id;
        }

        if ($rule->action_parameters) {
            $action['action_parameters'] = $rule->action_parameters;
        }

        // Create redirect URL for skip actions
        if (in_array($rule->rule_type, ['skip_to_section', 'skip_to_question'])) {
            if ($rule->target_section_id) {
                $targetSection = SurveySection::find($rule->target_section_id);
                if ($targetSection) {
                    $action['redirect'] = route('survey.section', [
                        'groupId'       => $rule->survey_type_id,
                        'sectionNumber' => $targetSection->order_index,
                    ]);
                }
            }
        }

        // Convert rule type to action
        switch ($rule->rule_type) {
            case 'terminate_survey':
                $action['action'] = 'terminate';
                $action['reason'] = $rule->action_parameters['termination_reason'] ?? 'แบบสำรวจถูกยุติตามเงื่อนไข';
                break;
            case 'skip_to_section':
                $action['action'] = 'skip_section';
                break;
            case 'skip_to_question':
                $action['action'] = 'skip';
                break;
            case 'show_question':
                $action['action'] = 'show_question';
                break;
            case 'hide_question':
                $action['action'] = 'hide_question';
                break;
        }

        return $action;
    }
    // Helper methods remain the same
    private function mapQuestionType($type)
    {
        $mapping = [
            'text_short'        => 'text',
            'text_long'         => 'textarea',
            'multiple_choice'   => 'radio',
            'checkbox'          => 'checkbox',
            'rating_scale'      => 'rating',
            'dual_rating_scale' => 'dual_rating',
            'matrix'            => 'matrix',
            'comparison_table'  => 'comparison',
            'number'            => 'number',
            'email'             => 'email',
            'phone'             => 'phone',
        ];

        return $mapping[$type] ?? 'text';
    }
    private function extractLocationData(Request $request): array
    {
        return [
            'latitude'        => $request->input('latitude'),
            'longitude'       => $request->input('longitude'),
            'accuracy'        => $request->input('accuracy'),
            'timestamp'       => $request->has('location_timestamp')
            ? now()->parse($request->input('location_timestamp'))
            : now(),
            'additional_data' => [
                'altitude'          => $request->input('altitude'),
                'altitude_accuracy' => $request->input('altitude_accuracy'),
                'heading'           => $request->input('heading'),
                'speed'             => $request->input('speed'),
                'source'            => $request->input('location_source', 'browser'),
                'permission_status' => $request->input('permission_status'),
                'provider'          => $request->input('provider', 'geolocation_api'),
            ],
        ];
    }
    // 🔧 FIXED: Clear relevant caches when data changes
    public function saveAnswers($groupId, Request $request)
    {
        try {
            $responseId = Session::get('survey_response_id');

            if (! $responseId) {
                return response()->json([
                    'success'  => false,
                    'error'    => 'Session หมดอายุ กรุณาเริ่มใหม่',
                    'redirect' => route('survey.start', $groupId),
                ], 419);
            }

            $response       = SurveyResponse::findOrFail($responseId);
            $answers        = $request->get('answers', []);
            $currentSection = $request->get('current_section', 1);

            // ✅ รับข้อมูล skipped sections จาก frontend
            $frontendSkippedSections = $request->get('skipped_sections', []);
            $frontendSkipReasons     = $request->get('skip_reasons', []);

            $this->updateLocationIfProvided($response, $request);

            // ✅ Validate answers
            $validationResult = $this->validateAnswersWithConditionalLogic($answers, $currentSection, $response);

            if (! $validationResult['isValid']) {
                return response()->json([
                    'success'           => false,
                    'error'             => 'กรุณาตอบคำถามที่จำเป็นให้ครบถ้วน',
                    'validation_errors' => $validationResult['errors'],
                    'details'           => $validationResult['details'],
                ], 422);
            }

            $conditionalResult = null;

            DB::transaction(function () use ($answers, $response, $currentSection, $frontendSkippedSections, $frontendSkipReasons, &$conditionalResult) {
                $existingMetadata   = $response->metadata ?? [];
                $allSkippedSections = array_unique(array_merge(
                    $existingMetadata['skipped_sections'] ?? [],
                    $frontendSkippedSections
                ));
                $allSkipReasons = array_merge(
                    $existingMetadata['skip_reasons'] ?? [],
                    $frontendSkipReasons
                );

                foreach ($answers as $questionId => $answerValue) {
                    if ($this->isAnswerEmpty($answerValue)) {
                        continue;
                    }

                    $answerData = $this->prepareAnswerDataWithQuestion($answerValue, $questionId);

                    $answer = QuestionAnswer::updateOrCreate(
                        [
                            'survey_response_id' => $response->id,
                            'question_id'        => $questionId,
                        ],
                        $answerData
                    );

                    $question = Question::find($questionId);

                    // ✅ NEW: เพิ่มการตรวจสอบ question_id = 40 เฉพาะ
                    if ($question && $questionId == 40) {
                    

                        $shouldSkipSection5 = false;

                        // ✅ ตรวจสอบหลายรูปแบบของคำตอบ
                        if ($answerValue === 119 || $answerValue === "119") {
                            $shouldSkipSection5 = true;
                        } elseif (is_array($answerValue) && isset($answerValue['option_id']) && $answerValue['option_id'] == 119) {
                            $shouldSkipSection5 = true;
                        } elseif ($answerValue === "2" || $answerValue === 2) {
                            $shouldSkipSection5 = true;
                        } elseif (is_array($answerValue) && isset($answerValue['option_value']) && $answerValue['option_value'] == "2") {
                            $shouldSkipSection5 = true;
                        }

                        // ✅ ตรวจสอบจาก question_option_id ในฐานข้อมูล
                        if (! $shouldSkipSection5 && $answer->question_option_id == 119) {
                            $shouldSkipSection5 = true;
                        }

                        // ✅ ตรวจสอบจาก option_value ในฐานข้อมูล
                        if (! $shouldSkipSection5 && $answer->question_option_id) {
                            $option = QuestionOption::find($answer->question_option_id);
                            if ($option && ($option->option_value == "2" || $option->option_value == 2)) {
                                $shouldSkipSection5 = true;
                            }
                        }

                        if ($shouldSkipSection5) {
                            // ✅ เพิ่ม section 5 เข้าไปใน skipped sections
                            if (! in_array(5, $allSkippedSections)) {
                                $allSkippedSections[] = 5;
                                $allSkipReasons[5]    = 'ไม่อยู่ในพื้นที่ กทม. นนทบุรี สมุทรปราการ';
                            }

                   
                        } else {
                            // ✅ ลบ section 5 ออกจาก skipped sections
                            $allSkippedSections = array_filter($allSkippedSections, function ($section) {
                                return $section != 5;
                            });
                            unset($allSkipReasons[5]);

                         
                        }

                        // ✅ อัพเดต metadata ทันที
                        $response->metadata = array_merge($existingMetadata, [
                            'skipped_sections' => array_values(array_unique($allSkippedSections)),
                            'skip_reasons'     => $allSkipReasons,
                        ]);
                        $response->save();
                    }

                    // ✅ Check skip_logic: always_skip_to_section
                    if ($question && isset($question->skip_logic['type'])) {
                        Log::info('🔧 Question has skip_logic', [
                            'question_id' => $questionId,
                            'skip_logic' => $question->skip_logic,
                            'answer_value' => $answerValue
                        ]);

                        if ($question->skip_logic['type'] === 'always_skip_to_section') {
                            $sectionToSkip = $question->skip_logic['skip_to_section'] ?? null;
                            $conditions = $question->skip_logic['conditions'] ?? [];

                            Log::info('🔧 Processing always_skip_to_section', [
                                'question_id' => $questionId,
                                'section_to_skip' => $sectionToSkip,
                                'conditions' => $conditions,
                                'answer_value' => $answerValue,
                                'option_id' => $answer->question_option_id ?? null
                            ]);

                            // ✅ ตรวจสอบเงื่อนไขการข้าม
                            $shouldSkip = false;

                            if (empty($conditions)) {
                                // ถ้าไม่มีเงื่อนไข ให้ข้ามเสมอ
                                $shouldSkip = true;
                                Log::info('🔧 No conditions - will skip');
                            } else {
                                // ตรวจสอบเงื่อนไขที่กำหนด
                                foreach ($conditions as $condition) {
                                    if (isset($condition['option_value'])) {
                                        $optionValue = $condition['option_value'];
                                        
                                        Log::info('🔧 Checking condition', [
                                            'condition_option_value' => $optionValue,
                                            'answer_value' => $answerValue,
                                            'answer_option_id' => $answer->question_option_id ?? null
                                        ]);
                                        
                                        // ตรวจสอบหลายรูปแบบของคำตอบ
                                        if ($answerValue == $optionValue || 
                                            (is_array($answerValue) && isset($answerValue['option_value']) && $answerValue['option_value'] == $optionValue) ||
                                            (is_array($answerValue) && isset($answerValue['option_id']) && $answerValue['option_id'] == $optionValue) ||
                                            ($answer->question_option_id == $optionValue)) {
                                            $shouldSkip = true;
                                            Log::info('🔧 Condition matched - will skip');
                                            break;
                                        }

                                        // ตรวจสอบจาก question_option ในฐานข้อมูล
                                        if ($answer->question_option_id) {
                                            $option = QuestionOption::find($answer->question_option_id);
                                            if ($option) {
                                                Log::info('🔧 Found option in database', [
                                                    'option_id' => $option->id,
                                                    'option_value' => $option->option_value,
                                                    'option_text' => $option->option_text
                                                ]);

                                                if ($option->option_value == $optionValue || $option->id == $optionValue) {
                                                    $shouldSkip = true;
                                                    Log::info('🔧 Database option matched - will skip');
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            if ($shouldSkip && $sectionToSkip) {
                                Log::info('🔧 ✅ Always skip to section triggered!', [
                                    'question_id' => $questionId,
                                    'answer_value' => $answerValue,
                                    'skip_to_section' => $sectionToSkip,
                                    'current_section' => $currentSection
                                ]);

                                $conditionalResult = [
                                    'success'  => true,
                                    'action'   => 'skip_section',
                                    'skip_to_section' => $sectionToSkip,
                                    'reason' => 'Skipped due to always_skip_to_section condition',
                                    'redirect' => route('survey.section', [
                                        'groupId'       => $response->survey_type_id,
                                        'sectionNumber' => $sectionToSkip,
                                    ]),
                                ];
                                return; // ❗ หยุด loop และ transaction
                            } else {
                                Log::info('🔧 Skip condition not met', [
                                    'should_skip' => $shouldSkip,
                                    'section_to_skip' => $sectionToSkip
                                ]);
                            }
                        }
                    }

                    // ✅ Check termination condition
                    $terminationResult = $this->checkTerminationConditionsOptimized($question, $answerValue);

                    if ($terminationResult) {
                        $response->status             = 'terminated';
                        $response->termination_reason = $terminationResult['reason'];
                        $response->terminated_at      = now();
                        $response->is_completed       = true; // ✅ นับเป็นการตอบสำเร็จ
                        $response->completed_at       = now(); // ✅ บันทึกเวลาที่เสร็จ
                        $response->save();

                        $conditionalResult = [
                            'success'  => true,
                            'action'   => 'terminate',
                            'reason'   => $terminationResult['reason'],
                            'redirect' => route('survey.terminated', [
                                'groupId' => $response->survey_type_id,
                                'reason'  => $terminationResult['reason'],
                            ]),
                        ];
                        return;
                    }

                    // ✅ Check conditional rules
                    $triggeredRules = $this->evaluateConditionalRulesOptimized($response, $questionId, $answerValue);

                    if (! empty($triggeredRules)) {
                        foreach ($triggeredRules as $rule) {
                            if ($rule->rule_type === 'terminate_survey') {
                                $response->status             = 'terminated';
                                $response->termination_reason = $rule->action_parameters['termination_reason'] ?? 'Terminated by rule';
                                $response->terminated_at      = now();
                                $response->is_completed       = true; // ✅ นับเป็นการตอบสำเร็จ
                                $response->completed_at       = now(); // ✅ บันทึกเวลาที่เสร็จ
                                $response->save();

                                $conditionalResult = [
                                    'success'  => true,
                                    'action'   => 'terminate',
                                    'reason'   => $response->termination_reason,
                                    'redirect' => route('survey.terminated', [
                                        'groupId' => $response->survey_type_id,
                                        'reason'  => $response->termination_reason,
                                    ]),
                                ];
                                return;
                            }
                        }
                    }
                }

                // ✅ If not terminated or skipped, update progress
                if (! $conditionalResult) {
                    $this->updateResponseProgress($response, $currentSection);
                }

                Cache::forget("answers_{$response->id}");
            });

            // ✅ Check if we have a conditional result (skip or terminate)
            if ($conditionalResult) {
                return response()->json($conditionalResult);
            }

            // ✅ Otherwise, proceed with normal navigation
            $allSkippedSections = $this->getSkippedSectionsFromResponse($response);
            return $this->navigateToNextSectionWithSkipLogic($response, $groupId, $currentSection, $allSkippedSections);

        } catch (\Exception $e) {
            Log::error('Save Answers Error: ' . $e->getMessage(), [
                'group_id'      => $groupId,
                'answers_count' => count($request->get('answers', [])),
                'trace'         => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error'   => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง',
            ], 500);
        }
    }
    private function navigateToNextSectionWithEnhancedSkipLogic(SurveyResponse $response, int $groupId, int $currentSection)
    {
        $sections = SurveySection::where('survey_type_id', $groupId)
            ->active()
            ->orderBy('order_index')
            ->get();

        $totalSections = $sections->count();

        // ดึง skipped sections จาก response metadata
        $metadata        = $response->metadata ?? [];
        $skippedSections = $metadata['skipped_sections'] ?? [];
        $skipReasons     = $metadata['skip_reasons'] ?? [];

     

        $nextSection = $currentSection + 1;

        // ✅ ข้าม sections ที่ถูก skip
        while ($nextSection <= $totalSections && in_array($nextSection, $skippedSections)) {
            $skipReason = $skipReasons[$nextSection] ?? 'ถูกข้ามตามเงื่อนไข';

           

            $nextSection++;
        }

     

        // ถ้ายังมี section ถัดไป
        if ($nextSection <= $totalSections) {
            $skippedCount = 0;
            for ($i = $currentSection + 1; $i < $nextSection; $i++) {
                if (in_array($i, $skippedSections)) {
                    $skippedCount++;
                }
            }

            $message = $skippedCount > 0
            ? "ข้ามส่วนที่ {$skippedCount} ส่วน ไปยังส่วนที่ {$nextSection}"
            : "ไปยังส่วนที่ {$nextSection}";

            return response()->json([
                'success'         => true,
                'redirect'        => route('survey.section', [
                    'groupId'       => $groupId,
                    'sectionNumber' => $nextSection,
                ]),
                'message'         => $message,
                'navigation_info' => [
                    'current_section'        => $currentSection,
                    'next_section'           => $nextSection,
                    'skipped_sections'       => $skippedSections,
                    'sections_skipped_count' => $skippedCount,
                ],
            ]);
        }

    

        $response->update([
            'status'       => 'completed',
            'is_completed' => true,
            'completed_at' => now(),
        ]);

        Session::forget('survey_response_id');
        Session::forget('survey_group_id');

        return response()->json([
            'success'  => true,
            'redirect' => route('survey.thank-you', [
                'group'    => $groupId,
                'response' => $response->id,
            ]),
            'message'  => 'แบบสำรวจเสร็จสมบูรณ์',
        ]);
    }
    private function validateAnswersWithConditionalLogic($answers, $currentSection, $response)
    {
        $errors  = [];
        $details = [];

        // ดึงคำถามในส่วนปัจจุบัน
        $questions = $this->getCurrentSectionQuestions($currentSection, $response->survey_type_id);

        // รวมคำตอบทั้งหมด
        $allExistingAnswers = $this->getAllExistingAnswersOptimized($response->id);
        $combinedAnswers    = array_merge($allExistingAnswers->toArray(), $answers);

        foreach ($questions as $question) {
            $answer = $answers[$question->id] ?? null;

            // ✅ ตรวจสอบว่าคำถามควรจะ visible หรือไม่
            $isVisible = $this->isQuestionVisibleForValidation($question, $combinedAnswers);

            if (! $isVisible) {

                continue;
            }

            // ✅ ตรวจสอบว่าคำถามเป็น required หรือไม่
            $isConditionallyRequired = $this->isQuestionConditionallyRequired($question, $combinedAnswers);
            $isRequired              = $question->is_required || $isConditionallyRequired;

            // ✅ เช็ค required questions (เฉพาะคำถามที่ visible)
            if ($isRequired && $this->isAnswerEmpty($answer)) {
                $errors[$question->id]  = 'คำถามนี้จำเป็นต้องตอบ';
                $details[$question->id] = [
                    'type'                      => 'required',
                    'is_visible'                => $isVisible,
                    'is_conditionally_required' => $isConditionallyRequired,
                ];
                continue;
            }

            // ข้าม validation ถ้ายังไม่ได้ตอบ
            if ($this->isAnswerEmpty($answer)) {
                continue;
            }
            if ($question->question_type === 'number' &&
                $question->code && strpos($question->code, 'age_') !== false) {

                $ageValidation = $this->validateAgeRequirements($question, $answer);
                if (! $ageValidation['isValid']) {
                    $errors[$question->id]  = $ageValidation['message'];
                    $details[$question->id] = $ageValidation['details'];
                    continue;
                }
            } else if ($question->question_type === 'number' || $question->question_type === 'text') {
                $minMaxValidation = $this->validateMinMaxRules($question, $answer);
                if (! $minMaxValidation['isValid']) {
                    $errors[$question->id]  = $minMaxValidation['message'];
                    $details[$question->id] = $minMaxValidation['details'];
                    continue;
                }
            }
            // ✅ Continue with other validations...
            // (Matrix validation, rules validation, etc.)
        }

        return [
            'isValid' => empty($errors),
            'errors'  => $errors,
            'details' => $details,
        ];
    }
    private function getNextNonSkippedSection(int $currentSection, array $skippedSections, int $totalSections): int
    {
        $nextSection = $currentSection + 1;

        // ✅ FIX: ข้าม sections ที่ถูก skip และหาตัวถัดไปที่ไม่ถูก skip
        while ($nextSection <= $totalSections && in_array($nextSection, $skippedSections)) {
          
            $nextSection++;
        }


        return $nextSection;
    }
    private function navigateToNextSectionWithSkipLogic(SurveyResponse $response, int $groupId, int $currentSection, array $skippedSections = [])
    {
        $sections = SurveySection::where('survey_type_id', $groupId)
            ->active()
            ->orderBy('order_index')
            ->get();

        $totalSections = $sections->count();

        // ✅ รวม skipped sections จาก response metadata
        $responseSkippedSections = $this->getSkippedSectionsFromResponse($response);
        $allSkippedSections      = array_unique(array_merge($skippedSections, $responseSkippedSections));
        sort($allSkippedSections);


        // ✅ หา section ถัดไปแบบพื้นฐานก่อน
        $nextSection = $currentSection + 1;

        // ✅ LOOP: ข้าม section ที่ถูก skip ไปเรื่อย ๆ
        while ($nextSection <= $totalSections && in_array($nextSection, $allSkippedSections)) {
          
            $nextSection++;
        }


        // ✅ ถ้ายังมี section ถัดไป ให้ไปต่อ
        if ($nextSection <= $totalSections) {
            return response()->json([
                'success'         => true,
                'redirect'        => route('survey.section', [
                    'groupId'       => $groupId,
                    'sectionNumber' => $nextSection,
                ]),
                'navigation_info' => [
                    'current_section'        => $currentSection,
                    'next_section'           => $nextSection,
                    'sections_skipped_count' => count($allSkippedSections),
                ],
                'skipped_info'    => [
                    'skipped_sections' => $allSkippedSections,
                ],
            ]);
        }


        $response->update([
            'status'       => 'completed',
            'is_completed' => true,
            'completed_at' => now(),
        ]);

        Session::forget('survey_response_id');
        Session::forget('survey_group_id');

        return response()->json([
            'success'  => true,
            'redirect' => route('survey.thank-you', [
                'group'    => $groupId,
                'response' => $response->id,
            ]),
            'message'  => 'Survey completed successfully',
        ]);
    }

    private function getSkipReasonFromResponse(SurveyResponse $response, int $sectionNumber): ?string
    {
        $metadata    = $response->metadata ?? [];
        $skipReasons = $metadata['skip_reasons'] ?? [];
        return $skipReasons[$sectionNumber] ?? null;
    }
    // 🔧 FIXED: Optimized conditional rules evaluation
    private function evaluateConditionalRulesOptimized($response, $questionId, $answerValue)
    {
        $rules = SurveyConditionalRule::where('survey_type_id', $response->survey_type_id)
            ->where('trigger_question_id', $questionId)
            ->active()
            ->orderBy('priority', 'desc')
            ->get();

        $triggeredRules = [];

        foreach ($rules as $rule) {
            if ($this->evaluateRuleOptimized($rule, $answerValue)) {
                $triggeredRules[] = $rule;
                $this->executeRule($response, $rule, $answerValue);
            }
        }

        return $triggeredRules;
    }
    private function saveAnswersQuietly($responseId, $answers, $currentSection)
    {
        try {
            $response = SurveyResponse::findOrFail($responseId);

            DB::transaction(function () use ($answers, $response, $currentSection) {
                foreach ($answers as $questionId => $answerValue) {
                    if ($this->isAnswerEmpty($answerValue)) {
                        continue;
                    }

                    QuestionAnswer::updateOrCreate(
                        [
                            'survey_response_id' => $response->id,
                            'question_id'        => $questionId,
                        ],
                        $this->prepareAnswerData($answerValue)
                    );
                }

                $totalSections      = SurveySection::where('survey_type_id', $response->survey_type_id)->count();
                $progressPercentage = ($currentSection / $totalSections) * 100;

                $response->update([
                    'progress_percentage' => $progressPercentage,
                    'metadata'            => array_merge($response->metadata ?? [], [
                        'current_section' => $currentSection,
                        'last_saved_at'   => now()->toISOString(),
                    ])
                ]);

                // 🔧 Clear cache after auto-save
                Cache::forget("answers_{$response->id}");
            });

        } catch (\Exception $e) {
            Log::warning('Auto Save Warning: ' . $e->getMessage(), [
                'response_id'   => $responseId,
                'answers_count' => count($answers),
            ]);
        }
    }
    private function isAnswerEmpty($value)
    {
        if ($value === null || $value === '') {
            return true;
        }

        if (is_array($value)) {
            if (empty($value)) {
                return true;
            }

            if (isset($value['awareness']) && isset($value['needs'])) {
                return empty($value['awareness']) && empty($value['needs']);
            }

            return count(array_filter($value, function ($item) {
                return ! $this->isAnswerEmpty($item);
            })) === 0;
        }

        if (is_numeric($value) && $value == 0) {
            return true;
        }

        return false;
    }
    private function validateQuestionRules($question, $answer)
    {
        $rules = $question->validation_rules;
        if (! $rules) {
            return ['isValid' => true];
        }
        if ($question->question_type === 'number' &&
            $question->code && strpos($question->code, 'age_') !== false) {

            $result = $this->validateAgeRequirements($question, $answer, $rules);
            if (! $result['isValid']) {
                return $result;
            }
        }
        // ✅ Min/Max validation สำหรับ number และ text fields
        if (isset($rules['min']) || isset($rules['max'])) {
            $result = $this->validateMinMaxRules($question, $answer, $rules);
            if (! $result['isValid']) {
                return $result;
            }
        }

        // Matrix text required validation
        if (isset($rules['matrix_text_required'])) {
            $result = $this->validateMatrixTextRequired($question, $answer, $rules['matrix_text_required']);
            if (! $result['isValid']) {
                return $result;
            }
        }

        // Conditional text required validation
        if (isset($rules['conditional_text_required'])) {
            $result = $this->validateConditionalTextRequired($question, $answer, $rules['conditional_text_required']);
            if (! $result['isValid']) {
                return $result;
            }
        }

        // Required if selected validation
        if (isset($rules['required_if_selected'])) {
            $result = $this->validateRequiredIfSelected($question, $answer, $rules['required_if_selected']);
            if (! $result['isValid']) {
                return $result;
            }
        }

        return ['isValid' => true];
    }

/**
 * ✅ ใหม่: ตรวจสอบ matrix text required
 */
    private function validateMatrixTextRequired($question, $answer, $rules)
    {
        $rowsWithText = $rules['rows_with_text'] ?? [];
        $message      = $rules['message'] ?? 'กรุณาระบุข้อมูลเพิ่มเติม';

        if (! is_array($answer) || empty($rowsWithText)) {
            return ['isValid' => true];
        }

        // เช็คใน awareness matrix
        if (isset($answer['awareness'])) {
            foreach ($rowsWithText as $rowKey) {
                $rowValue = $answer['awareness'][$rowKey] ?? null;
                if ($rowValue && $rowValue !== '' && $rowValue !== null) {
                    // มีการเลือก ต้องเช็ค text input
                    $textValue = $answer['text_inputs'][$rowKey] ??
                    $answer['awareness']["{$rowKey}_text"] ?? null;

                    if (! $textValue || trim($textValue) === '') {
                        return [
                            'isValid' => false,
                            'message' => $message,
                            'details' => ['type' => 'matrix_text_required', 'row' => $rowKey],
                        ];
                    }
                }
            }
        }

        // เช็คใน needs matrix
        if (isset($answer['needs']) || isset($answer['need'])) {
            $needsData = $answer['needs'] ?? $answer['need'];
            foreach ($rowsWithText as $rowKey) {
                $rowValue = $needsData[$rowKey] ?? null;
                if ($rowValue && $rowValue !== '' && $rowValue !== null) {
                    $textValue = $answer['text_inputs'][$rowKey] ??
                    $needsData["{$rowKey}_text"] ?? null;

                    if (! $textValue || trim($textValue) === '') {
                        return [
                            'isValid' => false,
                            'message' => $message,
                            'details' => ['type' => 'matrix_text_required', 'row' => $rowKey],
                        ];
                    }
                }
            }
        }

        return ['isValid' => true];
    }

/**
 * ✅ ใหม่: ตรวจสอบ conditional text required
 */
    private function validateConditionalTextRequired($question, $answer, $rules)
    {
        $condition = $rules['condition'] ?? '';
        $message   = $rules['message'] ?? 'กรุณาระบุข้อมูลเพิ่มเติม';

        if ($condition === 'has_option_with_text') {
            // สำหรับ checkbox
            if (is_array($answer)) {
                foreach ($answer as $item) {
                    if (is_array($item) && isset($item['has_text_input']) && $item['has_text_input']) {
                        if (! isset($item['text']) || trim($item['text']) === '') {
                            return [
                                'isValid' => false,
                                'message' => $message,
                                'details' => ['type' => 'conditional_text_required'],
                            ];
                        }
                    }

                    // เช็คแบบเก่า (ตัวเลือก "อื่นๆ")
                    if (is_string($item) && (
                        strpos($item, 'อื่น') !== false ||
                        strpos($item, 'other') !== false
                    )) {
                        // หา text input ที่เกี่ยวข้อง
                        $hasTextInput = false;
                        foreach ($answer as $checkItem) {
                            if (is_array($checkItem) &&
                                isset($checkItem['text']) &&
                                trim($checkItem['text']) !== '') {
                                $hasTextInput = true;
                                break;
                            }
                        }

                        if (! $hasTextInput) {
                            return [
                                'isValid' => false,
                                'message' => $message,
                                'details' => ['type' => 'conditional_text_required'],
                            ];
                        }
                    }
                }
            }

            // สำหรับ radio
            if (is_array($answer) && isset($answer['has_text_input']) && $answer['has_text_input']) {
                if (! isset($answer['text']) || trim($answer['text']) === '') {
                    return [
                        'isValid' => false,
                        'message' => $message,
                        'details' => ['type' => 'conditional_text_required'],
                    ];
                }
            }
        }

        return ['isValid' => true];
    }

/**
 * ✅ ใหม่: ตรวจสอบ required if selected
 */
    private function validateRequiredIfSelected($question, $answer, $rules)
    {
        $optionText = $rules['option_text'] ?? '';
        $message    = $rules['message'] ?? 'กรุณาระบุข้อมูลเพิ่มเติม';

        // สำหรับ radio
        if (is_string($answer) && $answer === $optionText) {
            return [
                'isValid' => false,
                'message' => $message,
                'details' => ['type' => 'required_if_selected'],
            ];
        }

        // สำหรับ object with text input
        if (is_array($answer) &&
            isset($answer['selected_option']) &&
            $answer['selected_option'] === $optionText) {
            if (! isset($answer['text']) || trim($answer['text']) === '') {
                return [
                    'isValid' => false,
                    'message' => $message,
                    'details' => ['type' => 'required_if_selected'],
                ];
            }
        }

        return ['isValid' => true];
    }

    private function validateAnswersImproved($answers, $currentSection, $surveyTypeId)
    {
        $errors  = [];
        $details = [];

        // ดึงคำถามในส่วนปัจจุบัน
        $questions = $this->getCurrentSectionQuestions($currentSection, $surveyTypeId);

        // ✅ CRITICAL FIX: ประเมิน conditional logic ก่อนการ validate
        $combinedAnswers = array_merge($this->getAllExistingAnswersOptimized($responseId ?? 0)->toArray(), $answers);

        foreach ($questions as $question) {
            $answer = $answers[$question->id] ?? null;

            // ✅ NEW: เช็คว่าคำถามนี้ถูกซ่อนหรือไม่ตาม conditional logic
            $isVisible               = $this->isQuestionVisibleForValidation($question, $combinedAnswers);
            $isConditionallyRequired = $this->isQuestionConditionallyRequired($question, $combinedAnswers);

            // ✅ SKIP validation ถ้าคำถามถูกซ่อน
            if (! $isVisible) {
         
                continue;
            }

            // ✅ อัพเดต required status ตาม conditional logic
            $isRequired = $question->is_required || $isConditionallyRequired;

            // ✅ เช็ค required questions - STRICT (เฉพาะคำถามที่ visible)
            if ($isRequired && $this->isAnswerEmpty($answer)) {
                $errors[$question->id]  = 'คำถามนี้จำเป็นต้องตอบ';
                $details[$question->id] = ['type' => 'required'];
                continue;
            }

            // ข้าม validation ถ้ายังไม่ได้ตอบ
            if ($this->isAnswerEmpty($answer)) {
                continue;
            }

            // ✅ Matrix validation - STRICT (เฉพาะคำถามที่ visible)
            if ($question->question_type === 'matrix') {
                if ($question->extra_config &&
                    ($question->extra_config['matrix_type'] ?? '') === 'dual_column_group') {
                    $validationResult = $this->validateMixedMatrixImproved($answer, $question);
                } else {
                    $validationResult = $this->validateMatrixAnswer($answer, $question);
                }

                if (! $validationResult['isValid']) {
                    $errors[$question->id]  = $validationResult['message'];
                    $details[$question->id] = $validationResult['details'];
                    continue;
                }
            }

            // ✅ Other validation rules (validation_rules)
            if ($question->validation_rules) {
                $validationResult = $this->validateQuestionRules($question, $answer);
                if (! $validationResult['isValid']) {
                    $errors[$question->id]  = $validationResult['message'];
                    $details[$question->id] = $validationResult['details'];
                    continue;
                }
            }
        }

        return [
            'isValid' => empty($errors),
            'errors'  => $errors,
            'details' => $details,
        ];
    }
    private function isQuestionConditionallyRequired($question, $combinedAnswers): bool
    {
        // เช็ค conditional rules สำหรับ requirement
        $applicableRules = SurveyConditionalRule::where('survey_type_id', $question->surveySection->survey_type_id)
            ->where('target_question_id', $question->id)
            ->whereIn('rule_type', ['require_question', 'optional_question'])
            ->active()
            ->get();

        foreach ($applicableRules as $rule) {
            $triggerAnswer = $combinedAnswers[$rule->trigger_question_id] ?? null;

            if ($triggerAnswer && $this->evaluateRuleOptimized($rule, $triggerAnswer)) {
                switch ($rule->rule_type) {
                    case 'require_question':
                        return true;
                    case 'optional_question':
                        return false;
                }
            }
        }

        return false; // default: not conditionally required
    }

    private function isQuestionVisibleForValidation($question, $combinedAnswers): bool
    {
        // เช็ค conditional logic ของคำถาม
        if (! empty($question->conditional_logic)) {
            $logic = $question->conditional_logic;

            if (isset($logic['type'])) {
                switch ($logic['type']) {
                    case 'show_if':
                        return $this->evaluateShowIfConditionsOptimized($logic['conditions'] ?? [], collect($combinedAnswers));
                    case 'hide_if':
                        return ! $this->evaluateShowIfConditionsOptimized($logic['conditions'] ?? [], collect($combinedAnswers));
                }
            }
        }

        // ✅ เช็ค conditional rules จากฐานข้อมูล
        $applicableRules = SurveyConditionalRule::where('survey_type_id', $question->surveySection->survey_type_id)
            ->where('target_question_id', $question->id)
            ->whereIn('rule_type', ['show_question', 'hide_question'])
            ->active()
            ->get();

        foreach ($applicableRules as $rule) {
            $triggerAnswer = $combinedAnswers[$rule->trigger_question_id] ?? null;

            if ($triggerAnswer && $this->evaluateRuleOptimized($rule, $triggerAnswer)) {
                switch ($rule->rule_type) {
                    case 'show_question':
                        return true;
                    case 'hide_question':
                        return false;
                }
            }
        }

        return true; // default: visible
    }
    private function evaluateMatrixScore($answerValue, $conditionValue): bool
    {
        if (! $answerValue || typeof($answerValue) !== "object") {
            return false;
        }

        $scoreRange   = $conditionValue['score_range'] ?? [];
        $anyRow       = $conditionValue['any_row'] ?? false;
        $specificRows = $conditionValue['rows'] ?? null;

        if (empty($scoreRange)) {
            return false;
        }

        // ตรวจสอบทุกแถวใน matrix
        foreach ($answerValue as $rowKey => $rowValue) {
            // ข้าม key ที่ไม่ใช่คำตอบ (เช่น text_inputs)
            if ($rowKey === 'text_inputs' || ! is_scalar($rowValue)) {
                continue;
            }

            // ถ้าระบุแถวเฉพาะ ให้ตรวจสอบเฉพาะแถวนั้น
            if ($specificRows && ! in_array($rowKey, $specificRows)) {
                continue;
            }

            $numericValue = is_numeric($rowValue) ? (int) $rowValue : null;

            if ($numericValue && in_array($numericValue, $scoreRange)) {
                if ($anyRow) {
                    return true; // พบแถวที่มีคะแนนตามเงื่อนไข
                }
            }
        }

        // ถ้าไม่ใช่ anyRow ต้องตรวจสอบทุกแถวที่ระบุ
        if (! $anyRow && $specificRows) {
            foreach ($specificRows as $rowKey) {
                $rowValue     = $answerValue[$rowKey] ?? null;
                $numericValue = is_numeric($rowValue) ? (int) $rowValue : null;

                if (! $numericValue || ! in_array($numericValue, $scoreRange)) {
                    return false;
                }
            }
            return true;
        }

        return false;
    }
    private function prepareAnswerData($answerValue)
    {
        $data = [
            'answer_text'        => null,
            'answer_numeric'     => null,
            'answer_json'        => null,
            'question_option_id' => null,
            'option_text_input'  => null,
            'sub_answers'        => null,
            'text_inputs'        => null,
        ];

        // Handle different answer types
        if (is_array($answerValue)) {
            // Handle Mixed Matrix with text_inputs
            if (isset($answerValue['text_inputs']) && is_array($answerValue['text_inputs'])) {
                $data['text_inputs'] = json_encode($answerValue['text_inputs'], JSON_UNESCAPED_UNICODE);

                // Remove text_inputs from main answer to avoid duplication
                $cleanAnswer = $answerValue;
                unset($cleanAnswer['text_inputs']);
                $data['answer_json'] = json_encode($cleanAnswer, JSON_UNESCAPED_UNICODE);

          
            }
            // Handle Matrix with text inputs (format: row_column_text)
            else {
                $textInputs  = [];
                $cleanAnswer = [];

                foreach ($answerValue as $key => $value) {
                    if (str_ends_with($key, '_text') && ! empty($value)) {
                        $textInputs[$key] = $value;
                        Log::debug('🔧 Found text input', ['key' => $key, 'value' => $value]);
                    } else {
                        $cleanAnswer[$key] = $value;
                    }
                }

                if (! empty($textInputs)) {
                    $data['text_inputs'] = json_encode($textInputs, JSON_UNESCAPED_UNICODE);
                 
                }

                $data['answer_json'] = json_encode($cleanAnswer, JSON_UNESCAPED_UNICODE);
            }
        }
        // Handle single option with text input
        elseif (is_object($answerValue) && isset($answerValue->text)) {
            $data['question_option_id'] = $answerValue->option_id ?? null;
            $data['option_text_input']  = $answerValue->text;
            $data['answer_json']        = json_encode($answerValue, JSON_UNESCAPED_UNICODE);
        }
        // Handle simple scalar values
        elseif (is_scalar($answerValue)) {
            if (is_numeric($answerValue)) {
                $data['answer_numeric'] = $answerValue;
            } else {
                $data['answer_text'] = $answerValue;
            }
            $data['answer_json'] = json_encode($answerValue, JSON_UNESCAPED_UNICODE);
        }
        // Handle other complex objects
        else {
            $data['answer_json'] = json_encode($answerValue, JSON_UNESCAPED_UNICODE);
        }


        return $data;
    }

    private function updateResponseProgress(SurveyResponse $response, int $currentSection)
    {
        $totalQuestions = Question::whereHas('surveySection', function ($query) use ($response) {
            $query->where('survey_type_id', $response->survey_type_id);
        })->count();

        $answeredQuestions = QuestionAnswer::where('survey_response_id', $response->id)->count();

        $progress = $totalQuestions > 0
        ? round(($answeredQuestions / $totalQuestions) * 100)
        : 0;

        $response->progress_percentage = $progress;
        $response->save();
    }
    private function navigateToNextSection(SurveyResponse $response, int $groupId, int $currentSection)
    {
        $sections = SurveySection::where('survey_type_id', $groupId)
            ->active()
            ->orderBy('order_index')
            ->get();

        $totalSections = $sections->count();

        if ($currentSection < $totalSections) {
            return response()->json([
                'success'  => true,
                'redirect' => route('survey.section', [
                    'groupId'       => $groupId,
                    'sectionNumber' => $currentSection + 1,
                ]),
            ]);
        }

        $response->update([
            'status'       => 'completed',
            'is_completed' => true,
            'completed_at' => now(),
        ]);

        Session::forget('survey_response_id');
        Session::forget('survey_group_id');

    }
    private function updateLocationIfProvided(SurveyResponse $response, Request $request): void
    {
        if ($request->has(['latitude', 'longitude'])) {
            try {
                $locationData = $this->extractLocationData($request);
                $response->updateLocation($locationData);

          
            } catch (\Exception $e) {
                Log::warning('Failed to update location: ' . $e->getMessage());
            }
        }
    }
    private function executeRule($response, $rule, $answerValue)
    {
        SurveyRuleExecution::create([
            'survey_response_id'  => $response->id,
            'conditional_rule_id' => $rule->id,
            'trigger_question_id' => $rule->trigger_question_id,
            'trigger_answer'      => $answerValue,
            'action_taken'        => $rule->action,
            'execution_result'    => $rule->action_parameters,
            'executed_at'         => now(),
        ]);

        $response->addToConditionalPath($rule->trigger_question_id, $rule->action, $rule->target_question_id ?? $rule->target_section_id);

        switch ($rule->rule_type) {
            case 'terminate_survey':
                $response->terminate(
                    $rule->trigger_question_id,
                    $rule->action_parameters['termination_reason'] ?? 'เงื่อนไขการยุติ'
                );
                break;
        }
    }

    /**
     * หน้าแสดงเมื่อแบบสอบถามถูกยุติ
     */
    public function terminated(Request $request)
    {
        $groupId = $request->get('groupId');
        $reason  = $request->get('reason', 'แบบสอบถามถูกยุติ');

        $group = null;
        if ($groupId) {
            $group = SurveyType::find($groupId);
        }

        return Inertia::render('Survey/Terminated', [
            'group'   => $group ? [
                'id'          => $group->id,
                'name'        => $group->name,
                'description' => $group->description,
            ] : null,
            'reason'  => $reason,
            'message' => $this->getTerminationMessage($reason),
        ]);
    }

    /**
     * รับข้อความการยุติแบบสอบถาม
     */
    private function getTerminationMessage($reason)
    {
        $messages = [
            'ไม่รู้จัก กปน.'                                     => 'ขอขอบคุณสำหรับเวลาของท่าน แบบสอบถามนี้เหมาะสำหรับผู้ที่รู้จักการประปานครหลวง',
            'ไม่เคยได้รับ/ไม่เคยเห็น/ไม่เคยได้ยิน (ไปข้อ 3.1.1)' => 'ขอขอบคุณสำหรับเวลาของท่าน',
            'default'                                            => 'ขอขอบคุณสำหรับเวลาของท่าน แบบสอบถามได้สิ้นสุดลงแล้ว',
        ];

        return $messages[$reason] ?? $messages['default'];
    }

    /**
     * ดึงกฎเงื่อนไขสำหรับส่งไปยัง frontend
     */
    private function getConditionalRules($surveyTypeId, $questionIds)
    {
        return SurveyConditionalRule::where('survey_type_id', $surveyTypeId)
            ->whereIn('trigger_question_id', $questionIds)
            ->active()
            ->with(['triggerQuestion', 'targetQuestion', 'targetSection'])
            ->get()
            ->map(function ($rule) {
                return [
                    'id'                    => $rule->id,
                    'trigger_question_id'   => $rule->trigger_question_id,
                    'trigger_question_code' => $rule->triggerQuestion->code ?? null,
                    'target_question_id'    => $rule->target_question_id,
                    'target_section_id'     => $rule->target_section_id,
                    'rule_type'             => $rule->rule_type,
                    'condition_operator'    => $rule->condition_operator,
                    'condition_value'       => $rule->condition_value,
                    'condition_metadata'    => $rule->condition_metadata,
                    'action'                => $rule->action,
                    'action_parameters'     => $rule->action_parameters,
                    'description'           => $rule->description,
                ];
            });
    }

    // ... Helper methods

    private function formatAllAnswersForFrontend($allAnswers)
    {
        $formatted = [];

    

        foreach ($allAnswers as $questionId => $answer) {
            if (is_object($answer)) {
                $formatted[$questionId] = $this->formatAnswerValue($answer);
            } else {
                $formatted[$questionId] = $answer;
            }
        }

    }

    private function getCurrentSectionQuestions($sectionNumber, $surveyTypeId)
    {
        $section = SurveySection::where('survey_type_id', $surveyTypeId)
            ->where('order_index', $sectionNumber)
            ->active()
            ->first();

        if (! $section) {
            return collect();
        }

        return Question::where('survey_section_id', $section->id)
            ->active()
            ->with('matrixOptions')
            ->orderBy('order_index')
            ->get();
    }

    private function validateSingleAnswer($answer, $question)
    {
        if ($this->isAnswerEmpty($answer)) {
            return [
                'isValid' => false,
                'message' => 'คำถามนี้จำเป็นต้องตอบ',
                'details' => ['type' => 'required', 'question_type' => $question->question_type],
            ];
        }
        if ($question->question_type === 'number' &&
            $question->code && strpos($question->code, 'age_') !== false) {

            $ageValidation = $this->validateAgeRequirements($question, $answer);
            if (! $ageValidation['isValid']) {
                return $ageValidation;
            }
        }
        // Handle option-based answer with text input
        if (is_array($answer) && isset($answer['option_id']) && is_numeric($answer['option_id'])) {
            $option = QuestionOption::find($answer['option_id']);

            if ($option && $option->has_text_input && empty($answer['text'])) {
                return [
                    'isValid' => false,
                    'message' => 'กรุณาระบุรายละเอียดเพิ่มเติม',
                    'details' => ['type' => 'text_input_required'],
                ];
            }

            return ['isValid' => true, 'message' => '', 'details' => []];
        }

        // ✅ Handle matrix questions ด้วย validation ใหม่
        if ($question->question_type === 'matrix') {
            if ($question->extra_config &&
                ($question->extra_config['matrix_type'] ?? '') === 'dual_column_group') {
                return $this->validateMixedMatrixImproved($answer, $question);
            } else {
                return $this->validateMatrixAnswer($answer, $question);
            }
        }

        return ['isValid' => true, 'message' => '', 'details' => []];
    }

    private function validateMixedMatrixImproved($answer, $question)
    {
        if (! is_array($answer)) {
            return [
                'isValid' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'details' => ['type' => 'invalid_format'],
            ];
        }

        $missingItems    = [];
        $rows            = $question->matrixOptions()->where('type', 'row')->get();
        $textInputErrors = [];

        $requiredCount = 0;
        $answeredCount = 0;

        foreach ($rows as $row) {
            $rowValue = $row->value;

            // ✅ ข้าม "อื่นๆ" - ไม่บังคับตอบ (ตรวจสอบทั้ง label และ value)
            $isOtherOption = str_contains(strtolower($row->label), 'อื่น') ||
            str_contains(strtolower($rowValue), 'other') ||
            str_contains(strtolower($rowValue), 'อื่น') ||
                ($row->extra_config['is_other_option'] ?? false);

            if ($isOtherOption) {
                // ถ้าตอบ "อื่นๆ" แล้ว ต้องตรวจสอบ text input
                $hasAwareness = ! empty($answer['awareness'][$rowValue]);
                $hasNeeds     = ! empty($answer['need'][$rowValue]) || ! empty($answer['needs'][$rowValue]);

                if ($hasAwareness && $hasNeeds) {
                    $answeredCount++; // นับเป็นการตอบแล้ว แต่ไม่บังคับ

                    // ตรวจสอบ text input สำหรับ "อื่นๆ"
                    if ($row->extra_config['has_text_input'] ?? false) {
                        $textKey      = "{$rowValue}_text";
                        $hasTextInput = ! empty($answer['text_inputs'][$textKey]);

                        if (! $hasTextInput) {
                            $textInputErrors[] = "ประเด็น \"{$row->label}\" ต้องระบุรายละเอียดเพิ่มเติม";
                        }
                    }
                }
                continue; // ข้ามไปข้อถัดไป - ไม่นับเป็น required
            }

            // ✅ ข้ออื่นๆ (ไม่ใช่ "อื่น") - บังคับตอบ
            $requiredCount++;

            // Check main answers for both awareness and needs
            $hasAwareness = ! empty($answer['awareness'][$rowValue]);
            $hasNeeds     = ! empty($answer['need'][$rowValue]) || ! empty($answer['needs'][$rowValue]);

            // ✅ STRICT: ต้องตอบทั้ง awareness และ needs
            if ($hasAwareness && $hasNeeds) {
                $answeredCount++;

                // ✅ ตรวจสอบ text input requirement
                if ($row->extra_config['has_text_input'] ?? false) {
                    $textKey      = "{$rowValue}_text";
                    $hasTextInput = ! empty($answer['text_inputs'][$textKey]);

                    if (! $hasTextInput) {
                        $textInputErrors[] = "ประเด็น \"{$row->label}\" ต้องระบุรายละเอียดเพิ่มเติม";
                    }
                }
            } else {
                // ✅ บันทึกข้อที่ขาดหายไป
                if (! $hasAwareness) {
                    $missingItems[] = "ประเด็น \"{$row->label}\" - การรับรู้ข้อมูลข่าวสาร";
                }
                if (! $hasNeeds) {
                    $missingItems[] = "ประเด็น \"{$row->label}\" - ความต้องการข้อมูลข่าวสาร";
                }
            }
        }

        // ✅ STRICT VALIDATION: ต้องตอบครบทุกข้อที่ required (100%)
        if ($answeredCount < $requiredCount) {
            return [
                'isValid' => false,
                'message' => sprintf(
                    'กรุณาตอบคำถามให้ครบทุกประเด็น (ตอบแล้ว %d จาก %d ประเด็น)',
                    $answeredCount,
                    $requiredCount
                ),
                'details' => [
                    'type'              => 'mixed_matrix_incomplete',
                    'completion_rate'   => $requiredCount > 0 ? ($answeredCount / $requiredCount) : 0,
                    'answered_count'    => $answeredCount,
                    'required_count'    => $requiredCount,
                    'missing_items'     => $missingItems, // แสดงทุกข้อที่ขาด
                    'text_input_errors' => $textInputErrors,
                ],
            ];
        }

        // ✅ ตรวจสอบ text input requirements
        if (! empty($textInputErrors)) {
            return [
                'isValid' => false,
                'message' => 'กรุณาระบุรายละเอียดเพิ่มเติมให้ครบถ้วน',
                'details' => [
                    'type'              => 'text_input_required',
                    'text_input_errors' => $textInputErrors,
                ],
            ];
        }

        return ['isValid' => true, 'message' => '', 'details' => []];
    }
    private function validateMatrixAnswer($answer, $question)
    {
        if (! is_array($answer)) {
            return [
                'isValid' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'details' => ['type' => 'invalid_format'],
            ];
        }

        $rows            = $question->matrixOptions()->where('type', 'row')->get();
        $missingItems    = [];
        $textInputErrors = [];
        $requiredCount   = 0;
        $answeredCount   = 0;

        foreach ($rows as $row) {
            $rowValue = $row->value;

            // ✅ ข้าม "อื่นๆ" - ไม่บังคับตอบ
            $isOtherOption = str_contains(strtolower($row->label), 'อื่น') ||
            str_contains(strtolower($rowValue), 'other') ||
            str_contains(strtolower($rowValue), 'อื่น') ||
                ($row->extra_config['is_other_option'] ?? false);

            if ($isOtherOption) {
                // ถ้าตอบ "อื่นๆ" แล้ว ต้องมี text input
                if (! empty($answer[$rowValue])) {
                    $answeredCount++; // นับเป็นการตอบแล้ว แต่ไม่บังคับ

                    if ($row->has_text_input) {
                        $textKey      = "{$rowValue}_text";
                        $hasTextInput = ! empty($answer['text_inputs'][$textKey]) ||
                        ! empty($answer[$textKey]);

                        if (! $hasTextInput) {
                            $textInputErrors[] = "ประเด็น \"{$row->label}\" ต้องระบุรายละเอียดเพิ่มเติม";
                        }
                    }
                }
                continue; // ข้ามไปข้อถัดไป - ไม่นับเป็น required
            }

            // ✅ ข้ออื่นๆ (ไม่ใช่ "อื่น") - บังคับตอบ
            $requiredCount++;
            $hasAnswer = ! empty($answer[$rowValue]);

            if ($hasAnswer) {
                $answeredCount++;

                // ตรวจสอบ text input requirement
                if ($row->has_text_input) {
                    $textKey      = "{$rowValue}_text";
                    $hasTextInput = ! empty($answer['text_inputs'][$textKey]) ||
                    ! empty($answer[$textKey]);

                    if (! $hasTextInput) {
                        $textInputErrors[] = "ประเด็น \"{$row->label}\" ต้องระบุรายละเอียดเพิ่มเติม";
                    }
                }
            } else {
                $missingItems[] = $row->label;
            }
        }

        // ✅ STRICT: ต้องตอบครบทุกข้อที่ required (100%)
        if ($answeredCount < $requiredCount) {
            return [
                'isValid' => false,
                'message' => sprintf(
                    'กรุณาตอบคำถามให้ครบทุกประเด็น (ยังขาด %d ประเด็น)',
                    $requiredCount - $answeredCount
                ),
                'details' => [
                    'type'              => 'matrix_incomplete',
                    'completion_rate'   => $requiredCount > 0 ? ($answeredCount / $requiredCount) : 0,
                    'answered_count'    => $answeredCount,
                    'required_count'    => $requiredCount,
                    'missing_items'     => $missingItems,
                    'text_input_errors' => $textInputErrors,
                ],
            ];
        }

        // ✅ ตรวจสอบ text input requirements
        if (! empty($textInputErrors)) {
            return [
                'isValid' => false,
                'message' => 'กรุณาระบุรายละเอียดเพิ่มเติมให้ครบถ้วน',
                'details' => [
                    'type'              => 'text_input_required',
                    'text_input_errors' => $textInputErrors,
                ],
            ];
        }

        return ['isValid' => true, 'message' => '', 'details' => []];
    }
    /**
     * Auto-save คำตอบ (ใช้ JSON response)
     */
    public function autoSave($groupId, Request $request)
    {
        try {
            $responseId = Session::get('survey_response_id');

            if (! $responseId) {
                return response()->json(['error' => 'Session expired'], 419);
            }

            $response = SurveyResponse::findOrFail($responseId);
            $answers  = $request->get('answers', []);

            $this->updateLocationIfProvided($response, $request);

            DB::transaction(function () use ($answers, $response, $request) {
                foreach ($answers as $questionId => $answerValue) {
                    if ($this->isAnswerEmpty($answerValue)) {
                        continue;
                    }

                    QuestionAnswer::updateOrCreate(
                        [
                            'survey_response_id' => $response->id,
                            'question_id'        => $questionId,
                        ],
                        $this->prepareAnswerData($answerValue)
                    );
                }

                $currentSection     = $request->get('current_section', 1);
                $totalSections      = SurveySection::where('survey_type_id', $response->survey_type_id)->count();
                $progressPercentage = ($currentSection / $totalSections) * 100;

                $response->update([
                    'progress_percentage' => $progressPercentage,
                    'metadata'            => array_merge($response->metadata ?? [], [
                        'current_section' => $currentSection,
                        'last_saved_at'   => now()->toISOString(),
                    ])
                ]);
            }, 5);

            return response()->json([
                'success'   => true,
                'message'   => 'บันทึกสำเร็จ',
                'timestamp' => now()->toISOString(),
                'location'  => $response->fresh()->location,
            ]);

        } catch (\Exception $e) {
            Log::warning('Auto Save Warning: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error'   => 'ไม่สามารถบันทึกอัตโนมัติได้',
            ], 500);
        }
    }

    /**
     * ส่งแบบสอบถาม
     */
    public function submit($groupId, Request $request)
    {
        try {
            $responseId = Session::get('survey_response_id');

            if (! $responseId) {
                return response()->json([
                    'success'  => false,
                    'error'    => 'Session หมดอายุ กรุณาเริ่มใหม่',
                    'redirect' => route('survey.start', $groupId),
                ], 419);
            }

            $response = SurveyResponse::findOrFail($responseId);

            // บันทึกคำตอบสุดท้าย
            $answers = $request->get('answers', []);
            $this->updateLocationIfProvided($response, $request);

            // Validate final answers
            $validationResult = $this->validateAnswersImproved($answers, $request->get('current_section', 6), $response->survey_type_id);

            if (! $validationResult['isValid']) {
                return response()->json([
                    'success'           => false,
                    'error'             => 'กรุณาตอบคำถามที่จำเป็นให้ครบถ้วน',
                    'validation_errors' => $validationResult['errors'],
                    'details'           => $validationResult['details'],
                ], 422);
            }

            DB::transaction(function () use ($answers, $response) {
                foreach ($answers as $questionId => $answerValue) {
                    if ($this->isAnswerEmpty($answerValue)) {
                        continue;
                    }

                    QuestionAnswer::updateOrCreate(
                        [
                            'survey_response_id' => $response->id,
                            'question_id'        => $questionId,
                        ],
                        $this->prepareAnswerData($answerValue)
                    );
                }

                // คำนวณเวลาที่ใช้ทั้งหมด
                $totalTime = $response->started_at
                ? now()->diffInSeconds($response->started_at)
                : 0;

                $response->update([
                    'status'              => 'submitted',
                    'is_completed'        => true,
                    'completed_at'        => now(),
                    'submitted_at'        => now(),
                    'progress_percentage' => 100,
                    'total_time_spent'    => $totalTime,
                ]);
            });

            // ลบ session
            Session::forget(['survey_response_id', 'survey_group_id']);

            return response()->json([
                'success'  => true,
                'message'  => 'ส่งแบบสำรวจเรียบร้อย',
                'location' => $response->fresh()->location,
                'redirect' => route('survey.thank-you', [
                    'group'    => $groupId,
                    'response' => $response->id,
                ]),
            ]);

        } catch (\Exception $e) {
            Log::error('Submit Survey Error: ' . $e->getMessage(), [
                'group_id' => $groupId,
                'trace'    => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error'   => 'เกิดข้อผิดพลาดในการส่งแบบสำรวจ กรุณาลองใหม่อีกครั้ง',
            ], 500);
        }
    }

    /**
     * อัปเดตตำแหน่ง
     */
    public function updateLocation($groupId, Request $request)
    {
        try {
            $responseId = Session::get('survey_response_id');

            if (! $responseId) {
                return response()->json(['error' => 'Session expired'], 419);
            }

            $request->validate([
                'latitude'  => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'accuracy'  => 'nullable|numeric|min:0',
            ]);

            $response = SurveyResponse::findOrFail($responseId);

            $locationData = $this->extractLocationData($request);
            $success      = $response->updateLocation($locationData);

            return response()->json([
                'success'  => $success,
                'message'  => $success ? 'อัปเดตตำแหน่งสำเร็จ' : 'ไม่สามารถอัปเดตตำแหน่งได้',
                'location' => $response->fresh()->location,
            ]);

        } catch (\Exception $e) {
            Log::error('Update Location Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error'   => 'เกิดข้อผิดพลาดในการอัปเดตตำแหน่ง',
            ], 500);
        }
    }

    /**
     * หน้าขอบคุณ
     */
    public function thankYou(Request $request)
    {
        $groupId    = $request->get('group');
        $responseId = $request->get('response');

        $group    = null;
        $response = null;

        if ($groupId) {
            $group = SurveyType::find($groupId);
        }

        if ($responseId) {
            $response = SurveyResponse::with('surveyType')->find($responseId);
            if ($response && ! $group) {
                $group = $response->surveyType;
            }
        }

        return Inertia::render('Survey/ThankYou', [
            'group'    => $group ? [
                'id'          => $group->id,
                'name'        => $group->name,
                'description' => $group->description,
            ] : null,
            'response' => $response ? [
                'id'                     => $response->id,
                'completed_at'           => $response->completed_at,
                'formatted_completed_at' => $response->completed_at?->format('d/m/Y H:i'),
                'total_time_spent'       => $response->total_time_spent,
            ] : null,
        ]);
    }

    private function formatQuestion($question)
    {
        try {
            // Validate question object
            if (! is_object($question)) {
                Log::error('formatQuestion received non-object', [
                    'question' => $question,
                    'type'     => gettype($question),
                ]);
                return null;
            }

            // Check required properties
            $requiredProperties = ['id', 'question_text', 'question_type'];
            foreach ($requiredProperties as $prop) {
                if (! isset($question->$prop)) {
                    Log::error("Question missing required property: $prop", [
                        'question_id'          => $question->id ?? 'unknown',
                        'available_properties' => get_object_vars($question),
                    ]);
                    return null;
                }
            }

            return [
                'id'                     => $question->id,
                'code'                   => $question->code ?? null,
                'question_text'          => $question->question_text,
                'description'            => $question->description ?? null,
                'question_type'          => $this->mapQuestionType($question->question_type),
                'is_required'            => $question->is_required ?? false,
                'is_screening'           => $question->is_screening ?? false,
                'can_terminate_survey'   => $question->can_terminate_survey ?? false,
                'options'                => $question->options ?? null,
                'placeholder'            => $question->placeholder ?? null,
                'help_text'              => $question->help_text ?? null,
                'extra_config'           => $question->extra_config ?? null,
                'conditional_logic'      => $question->conditional_logic ?? null,
                'termination_conditions' => $question->termination_conditions ?? null,
                'skip_logic'             => $question->skip_logic ?? null,
                'formatted_options'      => $this->formatQuestionOptions($question),
                'matrix_options'         => [
                    'rows'    => $question->matrixOptions ? $question->matrixOptions->where('type', 'row')->values() : collect(),
                    'columns' => $question->matrixOptions ? $question->matrixOptions->where('type', 'column')->values() : collect(),
                ],
                'rating_scales'          => $question->ratingScales ?? collect(),
            ];

        } catch (\Exception $e) {
            Log::error('Error formatting question: ' . $e->getMessage(), [
                'question_id' => isset($question->id) ? $question->id : 'unknown',
                'trace'       => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

    private function getAllExistingAnswers($responseId)
    {
        $answers = QuestionAnswer::where('survey_response_id', $responseId)->get();


        $result = $answers->keyBy('question_id')->map(function ($answer) {
            return $this->formatAnswerValue($answer);
        });

      

        return $result;
    }

    private function getExistingAnswers($responseId, $questionIds)
    {
        $existingAnswers = [];
        if ($responseId) {
            $answers = QuestionAnswer::where('survey_response_id', $responseId)
                ->whereIn('question_id', $questionIds)
                ->get();

        

            foreach ($answers as $answer) {
                $formattedValue                        = $this->formatAnswerValue($answer);
                $existingAnswers[$answer->question_id] = $formattedValue;

              
            }
        }

       
        return $existingAnswers;
    }

    private function formatMatrixOptions($question)
    {
        return [
            'rows'    => $question->matrixOptions->where('type', 'row')->map(function ($option) {
                return [
                    'id'             => $option->id,
                    'value'          => $option->value,
                    'label'          => $option->label,
                    'order_index'    => $option->order_index,
                    'has_text_input' => $option->extra_config['has_text_input'] ?? false,
                ];
            })->values(),
            'columns' => $question->matrixOptions->where('type', 'column')->map(function ($option) {
                return [
                    'id'          => $option->id,
                    'value'       => $option->value,
                    'label'       => $option->label,
                    'order_index' => $option->order_index,
                ];
            })->values(),
        ];
    }

    private function formatQuestionOptions($question)
    {
        if (! $question->questionOptions) {
            return [];
        }

        return $question->questionOptions->map(function ($option) {
            return [
                'value'              => $option->id,
                'label'              => $option->option_text,
                'has_text_input'     => $option->has_text_input,
                'skip_config'        => $option->skip_config,
                'termination_config' => $option->termination_config,
                'is_termination'     => ! empty($option->termination_config['terminate_survey']),
                'is_skip'            => ! empty($option->skip_config),
                'has_conditional'    => ! empty($option->conditional_questions),
            ];
        })->toArray();
    }

    private function formatAnswerValue($answer)
    {
      
        $result = null;

        // Handle JSON answer format
        if (! empty($answer->answer_json)) {
            $jsonData = json_decode($answer->answer_json, true);

        

            // Handle format with option_value and option_id
            if (isset($jsonData['option_value']) && isset($jsonData['option_id'])) {
                $result = [
                    'option_id'    => $jsonData['option_id'],
                    'option_value' => $jsonData['option_value'],
                ];

                if (! empty($answer->option_text_input)) {
                    $result['text'] = $answer->option_text_input;
                }
            }
            // Handle Mixed Matrix format (awareness/needs)
            elseif (isset($jsonData['awareness']) || isset($jsonData['needs'])) {
                $result = $jsonData;

                // Add text_inputs if available
                if (! empty($answer->text_inputs)) {
                    $textInputs            = json_decode($answer->text_inputs, true);
                    $result['text_inputs'] = array_merge(
                        $result['text_inputs'] ?? [],
                        $textInputs ?? []
                    );
                }
            }
            // Handle Dual Rating format
            elseif (isset($jsonData['expectation']) || isset($jsonData['satisfaction'])) {
                $result = $jsonData;
            }
            // Handle standard matrix format
            else {
                $result = $jsonData;
            }
        }
        // Handle sub_answers format (legacy)
        elseif (! empty($answer->sub_answers)) {
            $subAnswers = json_decode($answer->sub_answers, true);

            if (isset($subAnswers['group_1']) || isset($subAnswers['group_2'])) {
                $result = [
                    'awareness' => $subAnswers['group_1'] ?? [],
                    'needs'     => $subAnswers['group_2'] ?? [],
                ];
            } else {
                $result = $subAnswers;
            }
        }
        // Handle simple text answer
        elseif (! empty($answer->answer_text)) {
            $result = $answer->answer_text;
        }
        // Handle numeric answer
        elseif (! empty($answer->answer_numeric)) {
            $result = $answer->answer_numeric;
        }
        // Handle option-based answer
        elseif (! empty($answer->question_option_id)) {
            $result = [
                'option_id' => $answer->question_option_id,
            ];

            // Add option_value for conditional logic
            $option = QuestionOption::find($answer->question_option_id);
            if ($option && $option->option_value !== null) {
                $result['option_value'] = $option->option_value;
            }

            if (! empty($answer->option_text_input)) {
                $result['text'] = $answer->option_text_input;
            }
        }

        // 🔧 ENHANCED: Always merge text_inputs if available
        if (! empty($answer->text_inputs)) {
            $textInputs = json_decode($answer->text_inputs, true);

            if (is_array($result)) {
                $result['text_inputs'] = array_merge(
                    $result['text_inputs'] ?? [],
                    $textInputs ?? []
                );
            } elseif (is_null($result)) {
                // If no other data, just return text_inputs
                $result = ['text_inputs' => $textInputs];
            }

          
        }

      
        return $result;
    }

    private function prepareAnswerDataWithQuestion($answerValue, $questionId)
    {
        $data = [
            'answer_text'        => null,
            'answer_numeric'     => null,
            'answer_json'        => null,
            'question_option_id' => null,
            'option_text_input'  => null,
            'sub_answers'        => null,
            'text_inputs'        => null,
        ];

        $question = Question::with(['matrixOptions', 'questionOptions'])->find($questionId);
        if ($question && $question->question_type === 'number' &&
            $question->code && strpos($question->code, 'age_') !== false) {

            // Additional server-side validation
            $ageValidation = $this->validateAgeRequirements($question, $answerValue);
            if (! $ageValidation['isValid']) {
                throw new \InvalidArgumentException($ageValidation['message']);
            }
        }
        if (is_scalar($answerValue)) {
            if (is_numeric($answerValue)) {
                // ✅ For age questions, ensure integer conversion
                if ($question && $question->code && strpos($question->code, 'age_') !== false) {
                    $data['answer_numeric'] = (int) $answerValue;
                } else {
                    $data['answer_numeric'] = $answerValue;
                }
            } else {
                $data['answer_text'] = $answerValue;
            }
            $data['answer_json'] = json_encode($answerValue, JSON_UNESCAPED_UNICODE);
        }
        // ✅ FIXED: Handle Radio with text input properly
        if (is_array($answerValue) || is_object($answerValue)) {
            $answerArray = (array) $answerValue;

                                                                               // Check if this is a radio question with text input
            if ($question && $question->question_type === 'multiple_choice') { // radio type

                // ✅ Format 1: {option_id: X, text: "...", has_text_input: true}
                if (isset($answerArray['option_id'])) {
                    $data['question_option_id'] = $answerArray['option_id'];

                    // Store the main answer structure
                    $data['answer_json'] = json_encode($answerArray, JSON_UNESCAPED_UNICODE);

                    // ✅ CRITICAL: Store text input separately for validation
                    if (! empty($answerArray['text'])) {
                        $data['option_text_input'] = $answerArray['text'];

                        // ✅ ALSO store in text_inputs for consistent access
                        $textInputs          = ['main_text' => $answerArray['text']];
                        $data['text_inputs'] = json_encode($textInputs, JSON_UNESCAPED_UNICODE);
                    }

                 

                    return $data;
                }

                // ✅ Format 2: Simple option_id (no text)
                if (is_numeric($answerValue)) {
                    $data['question_option_id'] = $answerValue;
                    $data['answer_json']        = json_encode(['option_id' => $answerValue], JSON_UNESCAPED_UNICODE);
                    return $data;
                }
            }

            // Handle other question types (matrix, etc.) - existing logic
            if (isset($answerArray['text_inputs']) && is_array($answerArray['text_inputs'])) {
                $data['text_inputs'] = json_encode($answerArray['text_inputs'], JSON_UNESCAPED_UNICODE);
                $cleanAnswer         = $answerArray;
                unset($cleanAnswer['text_inputs']);
                $data['answer_json'] = json_encode($cleanAnswer, JSON_UNESCAPED_UNICODE);
            } else {
                $data['answer_json'] = json_encode($answerArray, JSON_UNESCAPED_UNICODE);
            }
        }
        // Handle scalar values
        elseif (is_scalar($answerValue)) {
            if (is_numeric($answerValue)) {
                $data['answer_numeric'] = $answerValue;

                // ✅ For radio questions, also store option_id
                if ($question && $question->question_type === 'multiple_choice') {
                    $data['question_option_id'] = $answerValue;
                }
            } else {
                $data['answer_text'] = $answerValue;
            }
            $data['answer_json'] = json_encode($answerValue, JSON_UNESCAPED_UNICODE);
        }

        return $data;
    }
    private function extractAndStoreConditionalTextInputs(&$data, $answerValue, $question)
    {
        if (! is_array($answerValue)) {
            return;
        }

        $textInputs = [];

        // สำหรับ checkbox arrays
        if (is_array($answerValue)) {
            foreach ($answerValue as $item) {
                if (is_array($item) && isset($item['text']) && ! empty($item['text'])) {
                    $textInputs[] = $item['text'];
                }
            }
        }

        // สำหรับ radio objects
        if (isset($answerValue['text']) && ! empty($answerValue['text'])) {
            $textInputs['main_text'] = $answerValue['text'];
        }

        if (! empty($textInputs)) {
            $existingInputs = [];
            if (! empty($data['text_inputs'])) {
                $existingInputs = json_decode($data['text_inputs'], true) ?: [];
            }

            $data['text_inputs'] = json_encode(
                array_merge($existingInputs, $textInputs),
                JSON_UNESCAPED_UNICODE
            );
        }
    }
    private function extractAndStoreMatrixTextInputs(&$data, $answerValue, $question)
    {
        if (! is_array($answerValue)) {
            return;
        }

        $textInputs = [];

        // Extract from text_inputs field
        if (isset($answerValue['text_inputs']) && is_array($answerValue['text_inputs'])) {
            $textInputs = array_merge($textInputs, $answerValue['text_inputs']);
        }

        // Extract from awareness/needs text fields
        if (isset($answerValue['awareness'])) {
            foreach ($answerValue['awareness'] as $key => $value) {
                if (str_ends_with($key, '_text') && ! empty($value)) {
                    $textInputs[$key] = $value;
                }
            }
        }

        if (isset($answerValue['needs']) || isset($answerValue['need'])) {
            $needsData = $answerValue['needs'] ?? $answerValue['need'];
            foreach ($needsData as $key => $value) {
                if (str_ends_with($key, '_text') && ! empty($value)) {
                    $textInputs[$key] = $value;
                }
            }
        }

        if (! empty($textInputs)) {
            $data['text_inputs'] = json_encode($textInputs, JSON_UNESCAPED_UNICODE);
         
        }
    }

    private function extractAndStoreTextInputs(&$data, $answerValue, $question)
    {
        $textInputs = [];

        // Extract text inputs from different formats
        if (isset($answerValue['text_inputs'])) {
            $textInputs = $answerValue['text_inputs'];
        } else {
            // Look for text inputs in the answer data
            foreach ($answerValue as $key => $value) {
                if (str_ends_with($key, '_text') && ! empty($value)) {
                    $textInputs[$key] = $value;
                }
            }
        }

        if (! empty($textInputs)) {
            $data['text_inputs'] = json_encode($textInputs, JSON_UNESCAPED_UNICODE);

        
        }
    }
    private function findOptionByValue($optionValue, $questionId = null)
    {
        $query = QuestionOption::where('option_value', $optionValue);

        if ($questionId) {
            $query->where('question_id', $questionId);
        }

        return $query->first();
    }

    /**
     * Export Mixed Matrix Data สำหรับการวิเคราะห์
     */
    public function exportMixedMatrixData($surveyTypeId)
    {
        $answers = QuestionAnswer::whereHas('surveyResponse', function ($query) use ($surveyTypeId) {
            $query->where('survey_type_id', $surveyTypeId)
                ->where('is_completed', true);
        })
            ->whereHas('question', function ($query) {
                $query->whereJsonContains('extra_config->matrix_type', 'dual_column_group');
            })
            ->with(['question.matrixOptions', 'surveyResponse'])
            ->get();

        $exportData = [];

        foreach ($answers as $answer) {
            $responseId = $answer->survey_response_id;
            $questionId = $answer->question_id;
            $answerData = $this->formatAnswerValue($answer);

            if (isset($answerData['awareness']) || isset($answerData['needs'])) {
                $rows = $answer->question->matrixOptions->where('type', 'row');

                foreach ($rows as $row) {
                    $rowValue = $row->value;

                    $exportData[] = [
                        'response_id'     => $responseId,
                        'question_id'     => $questionId,
                        'question_text'   => $answer->question->question_text,
                        'row_label'       => $row->label,
                        'row_value'       => $rowValue,
                        'awareness_value' => $answerData['awareness'][$rowValue] ?? null,
                        'needs_value'     => $answerData['needs'][$rowValue] ?? null,
                        'text_input'      => $answerData['text_inputs']["{$rowValue}_text"] ?? null,
                        'created_at'      => $answer->created_at,
                    ];
                }
            }
        }

        return collect($exportData);
    }

    /**
     * Validate if a section should be accessible (for back navigation)
     */
    public function validateSection($groupId, Request $request)
    {
        try {
            $request->validate([
                'section_number' => 'required|integer|min:1',
                'check_skip_only' => 'boolean'
            ]);

            $sectionNumber = $request->section_number;
            $checkSkipOnly = $request->check_skip_only ?? false;

            // Get current response
            $responseId = Session::get('survey_response_id');
            if (!$responseId) {
                return response()->json(['should_skip' => false, 'accessible' => false]);
            }

            $response = SurveyResponse::find($responseId);
            if (!$response || $response->survey_type_id != $groupId) {
                return response()->json(['should_skip' => false, 'accessible' => false]);
            }

            // Get total sections
            $sections = SurveySection::where('survey_type_id', $groupId)
                ->active()
                ->orderBy('order_index')
                ->get();

            $totalSections = $sections->count();

            if ($sectionNumber < 1 || $sectionNumber > $totalSections) {
                return response()->json(['should_skip' => false, 'accessible' => false]);
            }

            // Check if section is in skipped sections
            $skippedSections = $this->getSkippedSectionsFromResponse($response);
            $isSkipped = in_array($sectionNumber, $skippedSections);

            if ($checkSkipOnly) {
                return response()->json(['should_skip' => $isSkipped]);
            }

            // Additional check: verify section should be skipped based on current answers
            $shouldSkipSection = $this->checkIfSectionShouldBeSkipped($response, $sectionNumber);

            return response()->json([
                'should_skip' => $isSkipped || $shouldSkipSection,
                'accessible' => !$isSkipped && !$shouldSkipSection,
                'section_number' => $sectionNumber
            ]);

        } catch (\Exception $e) {
            Log::error('Section validation error: ' . $e->getMessage(), [
                'group_id' => $groupId,
                'section_number' => $request->section_number ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'should_skip' => false,
                'accessible' => true,
                'error' => 'Unable to validate section'
            ], 500);
        }
    }

    /**
     * Get the highest section number that user has accessed
     */
    private function getCurrentMaxAccessibleSection($response)
    {
        $metadata = $response->metadata;
        if (is_string($metadata)) {
            $metadata = json_decode($metadata, true) ?: [];
        } elseif (!is_array($metadata)) {
            $metadata = [];
        }
        return $metadata['max_section_accessed'] ?? 1;
    }

    /**
     * Find the previous non-skipped section
     */
    private function getPreviousNonSkippedSection($currentSection, $skippedSections)
    {
        for ($section = $currentSection - 1; $section >= 1; $section--) {
            if (!in_array($section, $skippedSections)) {
                return $section;
            }
        }
        return 0; // No accessible previous section found
    }

    /**
     * Update the maximum section accessed by the user
     */
    private function updateMaxSectionAccessed($response, $sectionNumber)
    {
        $metadata = $response->metadata;
        if (is_string($metadata)) {
            $metadata = json_decode($metadata, true) ?: [];
        } elseif (!is_array($metadata)) {
            $metadata = [];
        }
        
        $currentMax = $metadata['max_section_accessed'] ?? 1;
        
        if ($sectionNumber > $currentMax) {
            $metadata['max_section_accessed'] = $sectionNumber;
            $response->metadata = json_encode($metadata);
            $response->save();
        }
    }
}
