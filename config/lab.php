<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Laboratory Priority Levels
    |--------------------------------------------------------------------------
    |
    | Define priority levels for laboratory test orders with their expected
    | turnaround times and display colors.
    |
    */

    'priorities' => [
        'urgent' => [
            'label' => 'Urgent',
            'turnaround_hours' => 2,
            'color' => 'red',
        ],
        'fast' => [
            'label' => 'Fast',
            'turnaround_hours' => 6,
            'color' => 'orange',
        ],
        'normal' => [
            'label' => 'Normal',
            'turnaround_hours' => 24,
            'color' => 'blue',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Valid Priority Levels
    |--------------------------------------------------------------------------
    |
    | List of valid priority level values for validation.
    |
    */

    'valid_priorities' => ['urgent', 'fast', 'normal'],
];
