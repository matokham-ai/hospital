<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        {{-- Broadcast/Echo meta for frontend --}}
        @if(config('broadcasting.default') === 'pusher')
            <meta name="pusher-key" content="{{ config('broadcasting.connections.pusher.key') }}">
            <meta name="pusher-cluster" content="{{ config('broadcasting.connections.pusher.options.cluster ?? config('broadcasting.connections.pusher.cluster') }}">
            <meta name="pusher-use-tls" content="{{ config('broadcasting.connections.pusher.options.useTLS', true) ? 'true' : 'false' }}">
        @endif
        @if(config('broadcasting.default') === 'reverb')
            <meta name="reverb-key" content="{{ config('broadcasting.connections.reverb.key') }}">
            <meta name="reverb-host" content="{{ config('broadcasting.connections.reverb.host') }}">
            <meta name="reverb-port" content="{{ config('broadcasting.connections.reverb.port') }}">
            <meta name="reverb-scheme" content="{{ config('broadcasting.connections.reverb.scheme') }}">
        @endif
        @viteReactRefresh
        @vite(['resources/js/app.tsx', 'resources/css/app.css'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
