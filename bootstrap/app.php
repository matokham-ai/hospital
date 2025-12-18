<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->group(base_path('routes/admin.php'));
            
            Route::middleware('web')
                ->group(base_path('routes/opd.php'));
                
            Route::middleware('web')
                ->group(base_path('routes/pharmacy.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Register middleware aliases
        $middleware->alias([
            'master-data-errors' => \App\Http\Middleware\MasterDataErrorHandler::class,
            'admin.access' => \App\Http\Middleware\AdminPanelAccess::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Register custom exception handlers for master data
        $exceptions->render(function (\App\Exceptions\DepartmentInUseException $e, $request) {
            return $e->render($request);
        });

        $exceptions->render(function (\App\Exceptions\BedOccupancyConflictException $e, $request) {
            return $e->render($request);
        });

        $exceptions->render(function (\App\Exceptions\InvalidTestPriceException $e, $request) {
            return $e->render($request);
        });

        $exceptions->render(function (\App\Exceptions\DrugStockException $e, $request) {
            return $e->render($request);
        });

        $exceptions->render(function (\App\Exceptions\MasterDataValidationException $e, $request) {
            return $e->render($request);
        });

        // Enhanced validation exception handling
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'error' => 'VALIDATION_ERROR',
                    'errors' => $e->errors(),
                    'suggestions' => [
                        'Check all required fields are provided',
                        'Verify data formats match requirements',
                        'Ensure all constraints are satisfied'
                    ]
                ], 422);
            }
            
            // Let Laravel handle non-JSON requests normally
            return null;
        });

        // Enhanced model not found exception handling
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if ($request->expectsJson()) {
                $modelName = class_basename($e->getModel());
                return response()->json([
                    'message' => "The requested {$modelName} was not found.",
                    'error' => 'RESOURCE_NOT_FOUND',
                    'model' => $modelName,
                    'suggestions' => [
                        'Check if the ID is correct',
                        'Verify the resource exists',
                        'Ensure you have permission to access this resource'
                    ]
                ], 404);
            }
            
            // Let Laravel handle non-JSON requests normally
            return null;
        });
    })->create();
