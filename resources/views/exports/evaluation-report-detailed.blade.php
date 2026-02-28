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
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 15px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }

        .header h1 {
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 5px 0;
        }

        .header .subtitle {
            font-size: 12px;
            color: #666;
            margin: 3px 0;
        }

        .summary-section {
            background-color: #f8f9fa;
            padding: 12px;
            margin: 15px 0;
            border-left: 3px solid #007bff;
        }

        .summary-section h2 {
            font-size: 16px;
            margin: 0 0 10px 0;
            color: #007bff;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
        }

        .summary-table th,
        .summary-table td {
            border: 1px solid #ddd;
            padding: 6px 10px;
            text-align: center;
            font-size: 11px;
        }

        .summary-table th {
            background-color: #e9ecef;
            font-weight: bold;
        }

        .evaluation-data {
            margin-top: 20px;
        }

        .section-title {
            text-align: center;
            margin: 15px 0;
            font-size: 16px;
            font-weight: bold;
        }

        .user-card {
            border: 1px solid #ccc;
            margin-bottom: 15px;
            padding: 12px;
            background: white;
            page-break-inside: avoid;
        }

        .user-header {
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }

        .user-name {
            font-size: 14px;
            font-weight: bold;
            color: #333;
        }

        .user-info {
            font-size: 11px;
            color: #666;
            margin-top: 3px;
        }

        .scores-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
        }

        .scores-table th,
        .scores-table td {
            border: 1px solid #ddd;
            padding: 5px 8px;
            text-align: center;
            font-size: 11px;
        }

        .scores-table th {
            background-color: #f0f4f8;
            font-weight: bold;
            font-size: 10px;
        }

        .scores-table .score-high {
            color: #28a745;
            font-weight: bold;
        }

        .scores-table .score-mid {
            color: #fd7e14;
            font-weight: bold;
        }

        .scores-table .score-low {
            color: #dc3545;
            font-weight: bold;
        }

        .aspect-section {
            margin-top: 10px;
        }

        .aspect-section h4 {
            font-size: 12px;
            color: #555;
            margin: 6px 0 4px 0;
        }

        .aspect-table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0 10px 0;
        }

        .aspect-table th,
        .aspect-table td {
            border: 1px solid #ddd;
            padding: 4px 8px;
            font-size: 10px;
        }

        .aspect-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            text-align: left;
        }

        .aspect-table td:nth-child(2),
        .aspect-table td:nth-child(3),
        .aspect-table td:nth-child(4) {
            text-align: center;
        }

        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 9px;
            color: #666;
        }

        @page {
            margin: 1.5cm;
            @bottom-center {
                content: "หน้า " counter(page);
                font-size: 8px;
                color: #666;
            }
        }

        .no-break {
            page-break-inside: avoid;
        }

        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <div class="subtitle">รายงานฉบับละเอียด</div>
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
        <table class="summary-table">
            <tr>
                <th>ผู้ถูกประเมินทั้งหมด</th>
                <th>ประเมินสมบูรณ์</th>
                <th>อัตราสำเร็จ</th>
            </tr>
            <tr>
                <td>{{ $summary['total_users'] }} คน</td>
                <td>{{ $summary['completed_evaluations'] }} คน</td>
                <td>{{ $summary['completion_rate'] }}%</td>
            </tr>
        </table>

        @if(!empty($summary['average_scores']))
        <table class="summary-table">
            <tr>
                <th>ตนเอง</th>
                <th>ผู้บังคับบัญชา</th>
                <th>ผู้ใต้บังคับบัญชา</th>
                <th>เพื่อนร่วมงาน (ซ้าย)</th>
                <th>เพื่อนร่วมงาน (ขวา)</th>
                <th>คะแนนรวม</th>
            </tr>
            <tr>
                <td>{{ $summary['average_scores']['self'] }}</td>
                <td>{{ $summary['average_scores']['top'] }}</td>
                <td>{{ $summary['average_scores']['bottom'] }}</td>
                <td>{{ $summary['average_scores']['left'] }}</td>
                <td>{{ $summary['average_scores']['right'] }}</td>
                <td><strong>{{ $summary['average_scores']['overall'] }}</strong></td>
            </tr>
        </table>
        @endif
    </div>

    <div class="evaluation-data">
        <h2 class="section-title">รายละเอียดการประเมินรายบุคคล</h2>

        @foreach($evaluationData as $index => $user)
        <div class="user-card">
            <div class="user-header">
                <div class="user-name">{{ $index + 1 }}. {{ $user['name'] }}</div>
                <div class="user-info">สายงาน: {{ $user['division'] }} | ระดับ: C{{ $user['grade'] }} | ตำแหน่ง: {{ $user['position'] }}</div>
            </div>

            @if(!empty($user['scores']))
            <table class="scores-table">
                <tr>
                    <th>ตนเอง</th>
                    <th>ผู้บังคับบัญชา</th>
                    <th>ผู้ใต้บังคับบัญชา</th>
                    <th>เพื่อนร่วมงาน (ซ้าย)</th>
                    <th>เพื่อนร่วมงาน (ขวา)</th>
                    <th>คะแนนรวม</th>
                </tr>
                <tr>
                    @php
                        $scoreFields = ['self_score', 'top_score', 'bottom_score', 'left_score', 'right_score', 'overall_score'];
                    @endphp
                    @foreach($scoreFields as $field)
                    <td class="{{ isset($user['scores'][$field]) ? ($user['scores'][$field] >= 4 ? 'score-high' : ($user['scores'][$field] >= 3 ? 'score-mid' : 'score-low')) : '' }}">
                        {{ isset($user['scores'][$field]) ? number_format($user['scores'][$field], 2) : '-' }}
                    </td>
                    @endforeach
                </tr>
            </table>
            @endif

            @if(!empty($user['evaluation_details']))
            <div class="aspect-section">
                @foreach($user['evaluation_details'] as $detail)
                <h4>{{ $detail['evaluation_name'] }} ({{ $detail['completion_status'] }} - {{ $detail['total_answers'] }} คำตอบ)</h4>
                    @if(!empty($detail['aspect_scores']))
                    <table class="aspect-table">
                        <tr>
                            <th style="width: 50%">ด้าน</th>
                            <th style="width: 15%">คะแนน</th>
                            <th style="width: 15%">คะแนนเต็ม</th>
                            <th style="width: 20%">ร้อยละ</th>
                        </tr>
                        @foreach($detail['aspect_scores'] as $aspectName => $aspectScore)
                        <tr>
                            <td>{{ $aspectName }}</td>
                            <td style="text-align: center">{{ $aspectScore['score'] }}</td>
                            <td style="text-align: center">{{ $aspectScore['max_score'] }}</td>
                            <td style="text-align: center" class="{{ $aspectScore['percentage'] >= 80 ? 'score-high' : ($aspectScore['percentage'] >= 60 ? 'score-mid' : 'score-low') }}">
                                {{ $aspectScore['percentage'] }}%
                            </td>
                        </tr>
                        @endforeach
                    </table>
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
