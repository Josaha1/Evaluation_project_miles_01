<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>Access Code Cards</title>
    <style>
        @page {
            margin: 15mm;
            size: A4 portrait;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'THSarabunNew', 'Sarabun', 'DejaVu Sans', sans-serif;
            font-size: 14px;
            color: #333;
        }

        .page {
            page-break-after: always;
        }

        .page:last-child {
            page-break-after: avoid;
        }

        .grid {
            width: 100%;
        }

        .row {
            width: 100%;
            overflow: hidden;
            margin-bottom: 10mm;
        }

        .card {
            width: 85mm;
            height: 120mm;
            float: left;
            margin-right: 5mm;
            border: 2px solid #4F46E5;
            border-radius: 8px;
            padding: 8mm;
            text-align: center;
            position: relative;
            background: #fff;
        }

        .card:nth-child(2) {
            margin-right: 0;
        }

        .card-header {
            font-size: 11px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 5mm;
            padding-bottom: 3mm;
            border-bottom: 1px solid #E5E7EB;
        }

        .card-header .title {
            font-size: 14px;
            display: block;
            margin-bottom: 2px;
        }

        .card-header .subtitle {
            font-size: 10px;
            color: #6B7280;
            font-weight: normal;
        }

        .qr-code {
            margin: 3mm auto;
            width: 40mm;
            height: 40mm;
        }

        .qr-code svg {
            width: 100%;
            height: 100%;
        }

        .access-code {
            font-size: 22px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            letter-spacing: 3px;
            color: #4F46E5;
            margin: 4mm 0;
            padding: 3mm;
            background: #F3F4F6;
            border-radius: 4px;
        }

        .info {
            font-size: 10px;
            color: #6B7280;
            line-height: 1.6;
            text-align: left;
            margin-top: 3mm;
        }

        .info .label {
            font-weight: bold;
            color: #374151;
        }

        .card-footer {
            position: absolute;
            bottom: 5mm;
            left: 8mm;
            right: 8mm;
            font-size: 9px;
            color: #9CA3AF;
            border-top: 1px solid #E5E7EB;
            padding-top: 2mm;
        }
    </style>
</head>
<body>
    @foreach($cards as $index => $card)
        @if($index % 4 === 0)
            @if($index > 0)
                </div>{{-- close page --}}
            @endif
            <div class="page">
        @endif

        @if($index % 2 === 0)
            <div class="row">
        @endif

        <div class="card">
            <div class="card-header">
                <span class="title">360 Evaluation System</span>
                <span class="subtitle">External Evaluator Access Card</span>
            </div>

            <div class="qr-code">
                {!! $card['qr_svg'] !!}
            </div>

            <div class="access-code">{{ $card['code'] }}</div>

            <div class="info">
                <div><span class="label">Org:</span> {{ $card['organization'] }}</div>
                <div><span class="label">Evaluatee:</span> {{ $card['evaluatee'] }}</div>
                <div><span class="label">Expires:</span> {{ $card['expires_at'] }}</div>
            </div>

            <div class="card-footer">
                Scan QR Code or enter the access code at the login page
            </div>
        </div>

        @if($index % 2 === 1)
            </div>{{-- close row --}}
        @endif

        @if($index === count($cards) - 1)
            @if($index % 2 === 0)
                </div>{{-- close unclosed row --}}
            @endif
            </div>{{-- close page --}}
        @endif
    @endforeach
</body>
</html>
