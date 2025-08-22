<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: 'THSarabunNew', 'Arial Unicode MS', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.2;
            color: #333;
            margin: 0;
            padding: 10px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #333;
            padding-bottom: 8px;
        }
        
        .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 5px 0;
        }
        
        .header .subtitle {
            font-size: 11px;
            color: #666;
            margin: 2px 0;
        }
        
        .summary-section {
            background-color: #f8f9fa;
            padding: 8px;
            margin: 10px 0;
            border-left: 2px solid #007bff;
        }
        
        .summary-section h2 {
            font-size: 14px;
            margin: 0 0 8px 0;
            color: #007bff;
        }
        
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 8px;
        }
        
        .stat-item {
            text-align: center;
            padding: 4px;
            background: white;
            border-radius: 2px;
            font-size: 10px;
        }
        
        .stat-number {
            font-size: 16px;
            font-weight: bold;
            color: #007bff;
        }
        
        .stat-label {
            font-size: 9px;
            color: #666;
            margin-top: 2px;
        }
        
        .score-summary {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 4px;
            margin-top: 8px;
        }
        
        .score-summary .score-item {
            padding: 3px;
            text-align: center;
            background: white;
            border-radius: 2px;
        }
        
        .score-summary .score-value {
            font-size: 12px;
            font-weight: bold;
            color: #28a745;
        }
        
        .score-summary .score-label {
            font-size: 8px;
            color: #666;
        }
        
        .evaluation-data {
            margin-top: 15px;
        }
        
        .section-title {
            text-align: center;
            margin: 10px 0;
            font-size: 16px;
            font-weight: bold;
        }
        
        .user-card {
            border: 1px solid #ddd;
            margin-bottom: 8px;
            padding: 6px;
            background: white;
            page-break-inside: avoid;
        }
        
        .user-header {
            border-bottom: 1px solid #eee;
            padding-bottom: 4px;
            margin-bottom: 6px;
        }
        
        .user-name {
            font-size: 13px;
            font-weight: bold;
            color: #333;
            display: inline;
        }
        
        .user-info {
            font-size: 10px;
            color: #666;
            display: inline;
            margin-left: 10px;
        }
        
        .user-scores {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 4px;
            margin: 4px 0;
        }
        
        .user-score-item {
            text-align: center;
            padding: 3px;
            background: #f8f9fa;
            border-radius: 2px;
            font-size: 10px;
        }
        
        .user-score-value {
            font-size: 11px;
            font-weight: bold;
            color: #28a745;
        }
        
        .user-score-label {
            font-size: 8px;
            color: #666;
        }
        
        .aspect-details {
            margin-top: 6px;
        }
        
        .aspect-compact {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 3px;
            margin-bottom: 4px;
        }
        
        .aspect-item {
            padding: 3px;
            background: #f1f3f4;
            border-radius: 2px;
            font-size: 9px;
        }
        
        .aspect-name {
            font-weight: bold;
            color: #333;
        }
        
        .aspect-score {
            color: #007bff;
            font-weight: bold;
            float: right;
        }
        
        .footer {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 9px;
            color: #666;
        }
        
        @page {
            margin: 1cm;
            @bottom-center {
                content: "หน้า " counter(page);
                font-size: 8px;
                color: #666;
            }
        }
        
        .no-break {
            page-break-inside: avoid;
        }
        
        .compact-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin: 4px 0;
        }
        
        .compact-table th,
        .compact-table td {
            border: 1px solid #ddd;
            padding: 2px 4px;
            text-align: left;
        }
        
        .compact-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            font-size: 9px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <div class="subtitle">ปีงบประมาณ {{ $fiscalYear }}</div>
        @if(isset($filters['division']) && $filters['division'])
            <div class="subtitle">สายงาน: {{ $filters['division'] }}</div>
        @endif
        @if(isset($filters['grade']) && $filters['grade'])
            <div class="subtitle">ระดับ: C{{ $filters['grade'] }}</div>
        @endif
        <div class="subtitle">สร้างเมื่อ: {{ $generatedAt }}</div>
    </div>

    <div class="summary-section no-break">
        <h2>สรุปภาพรวม</h2>
        <div class="summary-stats">
            <div class="stat-item">
                <div class="stat-number">{{ $summary['total_users'] }}</div>
                <div class="stat-label">ผู้ถูกประเมิน</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">{{ $summary['completed_evaluations'] }}</div>
                <div class="stat-label">ประเมินสมบูรณ์</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">{{ $summary['completion_rate'] }}%</div>
                <div class="stat-label">อัตราสำเร็จ</div>
            </div>
        </div>

        @if(!empty($summary['average_scores']))
        <div class="score-summary">
            <div class="score-item">
                <div class="score-value">{{ $summary['average_scores']['self'] }}</div>
                <div class="score-label">ตนเอง</div>
            </div>
            <div class="score-item">
                <div class="score-value">{{ $summary['average_scores']['top'] }}</div>
                <div class="score-label">บังคับบัญชา</div>
            </div>
            <div class="score-item">
                <div class="score-value">{{ $summary['average_scores']['bottom'] }}</div>
                <div class="score-label">ใต้บังคับบัญชา</div>
            </div>
            <div class="score-item">
                <div class="score-value">{{ $summary['average_scores']['left'] }}</div>
                <div class="score-label">เพื่อนร่วมงาน ซ้าย</div>
            </div>
            <div class="score-item">
                <div class="score-value">{{ $summary['average_scores']['right'] }}</div>
                <div class="score-label">เพื่อนร่วมงาน ขวา</div>
            </div>
            <div class="score-item">
                <div class="score-value">{{ $summary['average_scores']['overall'] }}</div>
                <div class="score-label">คะแนนรวม</div>
            </div>
        </div>
        @endif
    </div>

    <div class="evaluation-data">
        <h2 class="section-title">รายละเอียดการประเมินรายบุคคล</h2>
        
        @foreach($evaluationData as $user)
        <div class="user-card">
            <div class="user-header">
                <span class="user-name">{{ $user['name'] }}</span>
                <span class="user-info">{{ $user['division'] }} | C{{ $user['grade'] }} | {{ $user['position'] }}</span>
            </div>

            @if(!empty($user['scores']))
            <div class="user-scores">
                @if(isset($user['scores']['self_score']))
                <div class="user-score-item">
                    <div class="user-score-value">{{ number_format($user['scores']['self_score'], 1) }}</div>
                    <div class="user-score-label">ตนเอง</div>
                </div>
                @endif
                @if(isset($user['scores']['top_score']))
                <div class="user-score-item">
                    <div class="user-score-value">{{ number_format($user['scores']['top_score'], 1) }}</div>
                    <div class="user-score-label">บังคับบัญชา</div>
                </div>
                @endif
                @if(isset($user['scores']['bottom_score']))
                <div class="user-score-item">
                    <div class="user-score-value">{{ number_format($user['scores']['bottom_score'], 1) }}</div>
                    <div class="user-score-label">ใต้บังคับบัญชา</div>
                </div>
                @endif
                @if(isset($user['scores']['left_score']))
                <div class="user-score-item">
                    <div class="user-score-value">{{ number_format($user['scores']['left_score'], 1) }}</div>
                    <div class="user-score-label">เพื่อนซ้าย</div>
                </div>
                @endif
                @if(isset($user['scores']['right_score']))
                <div class="user-score-item">
                    <div class="user-score-value">{{ number_format($user['scores']['right_score'], 1) }}</div>
                    <div class="user-score-label">เพื่อนขวา</div>
                </div>
                @endif
                @if(isset($user['scores']['overall_score']))
                <div class="user-score-item">
                    <div class="user-score-value">{{ number_format($user['scores']['overall_score'], 1) }}</div>
                    <div class="user-score-label">รวม</div>
                </div>
                @endif
            </div>
            @endif

            @if(!empty($user['evaluation_details']))
            <div class="aspect-details">
                @foreach($user['evaluation_details'] as $detail)
                    @if(!empty($detail['aspect_scores']))
                        <div class="aspect-compact">
                            @foreach($detail['aspect_scores'] as $aspectName => $aspectScore)
                            <div class="aspect-item">
                                <span class="aspect-name">{{ Str::limit($aspectName, 15) }}</span>
                                <span class="aspect-score">{{ $aspectScore['percentage'] }}%</span>
                            </div>
                            @endforeach
                        </div>
                    @endif
                @endforeach
            </div>
            @endif
        </div>
        @endforeach
    </div>

    <div class="footer">
        <p>ระบบประเมิน 360 องศา | ข้อมูลความลับ - ใช้เพื่อการพัฒนาบุคลากรเท่านั้น</p>
    </div>
</body>
</html>