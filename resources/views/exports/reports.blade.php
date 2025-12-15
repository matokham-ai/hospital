<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>HMS Report - {{ ucfirst(str_replace('_', ' ', $reportType)) }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 24px;
        }
        .header h2 {
            color: #666;
            margin: 5px 0;
            font-size: 18px;
        }
        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
        }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #374151;
            font-size: 14px;
        }
        .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .chart-placeholder {
            background-color: #f8f9fa;
            border: 2px dashed #dee2e6;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 20px 0;
            color: #6c757d;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h3 {
            color: #2563eb;
            border-bottom: 1px solid #2563eb;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Hospital Management System</h1>
        <h2>{{ ucfirst(str_replace('_', ' ', $reportType)) }} Report</h2>
    </div>

    <div class="meta-info">
        <div>
            <strong>Report Period:</strong> {{ $startDate }} to {{ $endDate }}
        </div>
        <div>
            <strong>Generated:</strong> {{ $generatedAt }}
        </div>
        <div>
            <strong>Report Type:</strong> {{ ucfirst(str_replace('_', ' ', $reportType)) }}
        </div>
    </div>

    @if($reportType === 'patient_census')
        <div class="summary-cards">
            <div class="summary-card">
                <h3>Total Inpatients</h3>
                <div class="value">{{ $data->summary->total_inpatients ?? 0 }}</div>
            </div>
            <div class="summary-card">
                <h3>Avg Daily Census</h3>
                <div class="value">{{ $data->summary->avg_daily_census ?? 0 }}</div>
            </div>
            <div class="summary-card">
                <h3>Total Admissions</h3>
                <div class="value">{{ $data->summary->total_admissions ?? 0 }}</div>
            </div>
            <div class="summary-card">
                <h3>Total Discharges</h3>
                <div class="value">{{ $data->summary->total_discharges ?? 0 }}</div>
            </div>
        </div>

        <div class="section">
            <h3>Daily Patient Census</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Inpatients</th>
                        <th>Outpatients</th>
                        <th>Emergency</th>
                        <th>Total Visits</th>
                        <th>Admissions</th>
                        <th>Discharges</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data->daily_census as $day)
                    <tr>
                        <td>{{ $day['date'] }}</td>
                        <td>{{ $day['inpatients'] }}</td>
                        <td>{{ $day['outpatients'] }}</td>
                        <td>{{ $day['emergency'] }}</td>
                        <td>{{ $day['total_visits'] }}</td>
                        <td>{{ $day['admissions'] }}</td>
                        <td>{{ $day['discharges'] }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

    @elseif($reportType === 'bed_occupancy')
        <div class="summary-cards">
            <div class="summary-card">
                <h3>Total Beds</h3>
                <div class="value">{{ $data->summary->total_beds ?? 0 }}</div>
            </div>
            <div class="summary-card">
                <h3>Occupied Beds</h3>
                <div class="value">{{ $data->summary->occupied_beds ?? 0 }}</div>
            </div>
            <div class="summary-card">
                <h3>Available Beds</h3>
                <div class="value">{{ $data->summary->available_beds ?? 0 }}</div>
            </div>
            <div class="summary-card">
                <h3>Occupancy Rate</h3>
                <div class="value">{{ $data->summary->current_occupancy_rate ?? 0 }}%</div>
            </div>
        </div>

        <div class="section">
            <h3>Occupancy by Ward</h3>
            <table>
                <thead>
                    <tr>
                        <th>Ward Name</th>
                        <th>Total Beds</th>
                        <th>Occupied</th>
                        <th>Available</th>
                        <th>Occupancy Rate</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data->occupancy_by_ward as $ward)
                    <tr>
                        <td>{{ $ward['ward_name'] }}</td>
                        <td>{{ $ward['total_beds'] }}</td>
                        <td>{{ $ward['occupied_beds'] }}</td>
                        <td>{{ $ward['available_beds'] }}</td>
                        <td>{{ $ward['occupancy_rate'] }}%</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

    @elseif($reportType === 'lab_tat')
        <div class="summary-cards">
            <div class="summary-card">
                <h3>Average TAT</h3>
                <div class="value">{{ $data->summary->avg_tat_hours ?? 0 }}h</div>
            </div>
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="value">{{ $data->summary->total_tests ?? 0 }}</div>
            </div>
            <div class="summary-card">
                <h3>Delayed Tests</h3>
                <div class="value">{{ $data->summary->delayed_tests ?? 0 }}</div>
            </div>
            <div class="summary-card">
                <h3>Delay Rate</h3>
                <div class="value">{{ $data->summary->delay_percentage ?? 0 }}%</div>
            </div>
        </div>

        <div class="section">
            <h3>TAT by Category</h3>
            <table>
                <thead>
                    <tr>
                        <th>Test Category</th>
                        <th>Average TAT (Hours)</th>
                        <th>Total Tests</th>
                        <th>Delayed Tests</th>
                        <th>Delay %</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data->tat_by_category as $category)
                    <tr>
                        <td>{{ $category['category'] }}</td>
                        <td>{{ $category['avg_tat_hours'] }}</td>
                        <td>{{ $category['total_tests'] }}</td>
                        <td>{{ $category['delayed_tests'] }}</td>
                        <td>{{ $category['delay_percentage'] }}%</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

    @elseif($reportType === 'revenue_department')
        <div class="summary-cards">
            <div class="summary-card">
                <h3>Total Revenue</h3>
                <div class="value">${{ number_format($data->summary->total_revenue ?? 0, 2) }}</div>
            </div>
            <div class="summary-card">
                <h3>Avg Daily Revenue</h3>
                <div class="value">${{ number_format($data->summary->avg_daily_revenue ?? 0, 2) }}</div>
            </div>
            <div class="summary-card">
                <h3>Total Transactions</h3>
                <div class="value">{{ $data->summary->total_transactions ?? 0 }}</div>
            </div>
            <div class="summary-card">
                <h3>Unique Patients</h3>
                <div class="value">{{ $data->summary->unique_patients ?? 0 }}</div>
            </div>
        </div>

        <div class="section">
            <h3>Revenue by Department</h3>
            <table>
                <thead>
                    <tr>
                        <th>Department</th>
                        <th>Total Revenue</th>
                        <th>Item Count</th>
                        <th>Avg per Item</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data->revenue_by_department as $dept)
                    <tr>
                        <td>{{ $dept['department'] }}</td>
                        <td>${{ number_format($dept['total_revenue'], 2) }}</td>
                        <td>{{ $dept['item_count'] }}</td>
                        <td>${{ number_format($dept['avg_per_item'], 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    <div class="footer">
        <p>This report was generated automatically by the Hospital Management System on {{ $generatedAt }}</p>
        <p>© {{ date('Y') }} Hospital Management System. All rights reserved.</p>
    </div>
</body>
</html>