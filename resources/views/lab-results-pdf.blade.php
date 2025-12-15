<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Lab Results - {{ $order->test_name }}</title>
    <style>
        @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
            .header { page-break-inside: avoid; }
            .results-section { page-break-inside: avoid; }
            .signature-section { page-break-before: auto; }
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .hospital-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        
        .report-title {
            font-size: 18px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .patient-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #2563eb;
        }
        
        .info-grid {
            display: table;
            width: 100%;
        }
        
        .info-grid > div {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 20px;
        }
        
        .info-item {
            margin-bottom: 10px;
        }
        
        .info-label {
            font-weight: bold;
            color: #374151;
            display: inline-block;
            width: 120px;
        }
        
        .info-value {
            color: #1f2937;
        }
        
        .results-section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .results-table th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #d1d5db;
        }
        
        .results-table td {
            padding: 12px;
            border: 1px solid #d1d5db;
        }
        
        .status-normal { color: #059669; font-weight: bold; }
        .status-abnormal { color: #d97706; font-weight: bold; }
        .status-critical { color: #dc2626; font-weight: bold; }
        
        .result-description {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #0ea5e9;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        
        .signature-section {
            margin-top: 40px;
            display: table;
            width: 100%;
        }
        
        .signature-box {
            display: table-cell;
            width: 50%;
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid #000;
        }
        
        .signature-box:first-child {
            padding-right: 40px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="hospital-name">MediCare Hospital Management System</div>
        <div class="report-title">Laboratory Test Results</div>
        <div style="font-size: 12px; color: #666; margin-top: 10px;">
            Generated on {{ now()->format('F j, Y \a\t g:i A') }}
        </div>
    </div>

    <div class="patient-info">
        <div class="info-grid">
            <div>
                <div class="info-item">
                    <span class="info-label">Patient Name:</span>
                    <span class="info-value">{{ $order->first_name }} {{ $order->last_name }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Patient ID:</span>
                    <span class="info-value">{{ $order->patient_id }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Test Name:</span>
                    <span class="info-value">{{ $order->test_name }}</span>
                </div>
            </div>
            <div>
                <div class="info-item">
                    <span class="info-label">Order Date:</span>
                    <span class="info-value">{{ \Carbon\Carbon::parse($order->created_at)->format('M j, Y g:i A') }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Ordered By:</span>
                    <span class="info-value">{{ $order->ordered_by_name ?? 'System' }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Priority:</span>
                    <span class="info-value" style="text-transform: uppercase;">{{ $order->priority }}</span>
                </div>
            </div>
        </div>
    </div>

    @if($results->count() > 0)
    <div class="results-section">
        <div class="section-title">Test Results</div>
        
        <table class="results-table">
            <thead>
                <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                    <th>Reference Range</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($results as $result)
                <tr>
                    <td><strong>{{ $result->parameter_name }}</strong></td>
                    <td>{{ $result->value }} {{ $result->unit }}</td>
                    <td>{{ $result->reference_range }} {{ $result->unit }}</td>
                    <td class="status-{{ $result->status }}">{{ strtoupper($result->status) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="section-title">Clinical Interpretations</div>
        @foreach($results as $result)
            @if($result->description)
            <div class="result-description">
                <strong>{{ $result->parameter_name }}:</strong> {{ $result->description }}
            </div>
            @endif
        @endforeach

        <div class="result-description">
            <strong>Overall Assessment:</strong>
            @php
                $abnormalCount = $results->where('status', '!=', 'normal')->count();
            @endphp
            @if($abnormalCount == 0)
                All parameters are within normal limits. No immediate action required.
            @else
                {{ $abnormalCount }} parameter(s) require clinical attention. Please correlate with patient symptoms and consider follow-up as appropriate.
            @endif
        </div>
    </div>
    @else
    <div class="results-section">
        <div class="section-title">Test Results</div>
        <p style="text-align: center; color: #6b7280; padding: 40px;">
            Results are being processed and will be available soon.
        </p>
    </div>
    @endif

    <div class="signature-section">
        <div class="signature-box">
            <div>Laboratory Technician</div>
        </div>
        <div class="signature-box">
            <div>Reviewing Physician</div>
        </div>
    </div>

    <div class="footer">
        <p>This report is generated electronically and is valid without signature.</p>
        <p>For questions regarding this report, please contact the laboratory at ext. 2345</p>
        <p><strong>Confidential:</strong> This report contains confidential patient information.</p>
    </div>
</body>
</html>