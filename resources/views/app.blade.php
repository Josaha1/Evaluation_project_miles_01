<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title inertia>{{ config('app.name', 'Laravel') }}</title>
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
    <script>
        (function() {
            try {
                const savedDarkMode = localStorage.getItem('darkMode');
                let isDark = false;

                if (savedDarkMode !== null) {
                    isDark = JSON.parse(savedDarkMode);
                } else {
                    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    localStorage.setItem('darkMode', JSON.stringify(isDark));
                }

                if (isDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch (error) {
                console.warn('Error initializing dark mode:', error);
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>
</head>

<body>
    @inertia
</body>

</html>
