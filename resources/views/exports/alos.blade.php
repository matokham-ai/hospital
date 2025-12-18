<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
    <h2>Average Length of Stay Report</h2>
    <p><strong>Period:</strong> {{ $startDate }} to {{ $endDate }}</p>
    <table>
        <thead>
            <tr>
                <th>Encounter ID</th>
                <th>Patient Name</th>
                <th>Admission Date</th>
                <th>Discharge Date</th>
                <th>Stay Length (days)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
            <tr>
                <td>{{ $row['encounter_id'] }}</td>
                <td>{{ $row['patient_name'] }}</td>
                <td>{{ $row['admission_date'] }}</td>
                <td>{{ $row['discharge_date'] }}</td>
                <td>{{ $row['stay_length_days'] }} days</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
