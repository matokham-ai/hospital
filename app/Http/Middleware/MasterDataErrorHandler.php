<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use App\Exceptions\DepartmentInUseException;
use App\Exceptions\BedOccupancyConflictException;
use App\Exceptions\InvalidTestPriceException;
use App\Exceptions\DrugStockException;
use App\Exceptions\MasterDataValidationException;

class MasterDataErrorHandler
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $next($request);
        } catch (DepartmentInUseException $e) {
            return $this->handleDepartmentInUseException($e, $request);
        } catch (BedOccupancyConflictException $e) {
            return $this->handleBedOccupancyConflictException($e, $request);
        } catch (InvalidTestPriceException $e) {
            return $this->handleInvalidTestPriceException($e, $request);
        } catch (DrugStockException $e) {
            return $this->handleDrugStockException($e, $request);
        } catch (MasterDataValidationException $e) {
            return $this->handleMasterDataValidationException($e, $request);
        } catch (ModelNotFoundException $e) {
            return $this->handleModelNotFoundException($e, $request);
        } catch (ValidationException $e) {
            return $this->handleValidationException($e, $request);
        } catch (\Exception $e) {
            return $this->handleGenericException($e, $request);
        }
    }

    /**
     * Handle DepartmentInUseException
     */
    protected function handleDepartmentInUseException(DepartmentInUseException $e, Request $request): Response
    {
        if ($request->expectsJson()) {
            return $e->render($request);
        }

        return redirect()->back()
            ->withErrors(['department' => $e->getMessage()])
            ->withInput();
    }

    /**
     * Handle BedOccupancyConflictException
     */
    protected function handleBedOccupancyConflictException(BedOccupancyConflictException $e, Request $request): Response
    {
        if ($request->expectsJson()) {
            return $e->render($request);
        }

        return redirect()->back()
            ->withErrors(['bed' => $e->getMessage()])
            ->withInput();
    }

    /**
     * Handle InvalidTestPriceException
     */
    protected function handleInvalidTestPriceException(InvalidTestPriceException $e, Request $request): Response
    {
        if ($request->expectsJson()) {
            return $e->render($request);
        }

        return redirect()->back()
            ->withErrors(['price' => $e->getMessage()])
            ->withInput();
    }

    /**
     * Handle DrugStockException
     */
    protected function handleDrugStockException(DrugStockException $e, Request $request): Response
    {
        if ($request->expectsJson()) {
            return $e->render($request);
        }

        return redirect()->back()
            ->withErrors(['stock' => $e->getMessage()])
            ->withInput();
    }

    /**
     * Handle MasterDataValidationException
     */
    protected function handleMasterDataValidationException(MasterDataValidationException $e, Request $request): Response
    {
        if ($request->expectsJson()) {
            return $e->render($request);
        }

        $errors = [];
        foreach ($e->getValidationErrors() as $field => $message) {
            $errors[$field] = $message;
        }

        return redirect()->back()
            ->withErrors($errors)
            ->withInput();
    }

    /**
     * Handle ModelNotFoundException
     */
    protected function handleModelNotFoundException(ModelNotFoundException $e, Request $request): Response
    {
        $modelName = class_basename($e->getModel());
        $message = "The requested {$modelName} was not found.";

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'error' => 'RESOURCE_NOT_FOUND',
                'model' => $modelName,
                'suggestions' => [
                    'Check if the ID is correct',
                    'Verify the resource exists',
                    'Ensure you have permission to access this resource'
                ]
            ], 404);
        }

        return redirect()->back()
            ->withErrors(['general' => $message]);
    }

    /**
     * Handle ValidationException
     */
    protected function handleValidationException(ValidationException $e, Request $request): Response
    {
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

        return redirect()->back()
            ->withErrors($e->errors())
            ->withInput();
    }

    /**
     * Handle generic exceptions
     */
    protected function handleGenericException(\Exception $e, Request $request): Response
    {
        // Log the error for debugging
        \Log::error('Master Data Error: ' . $e->getMessage(), [
            'exception' => $e,
            'request' => $request->all(),
            'user' => $request->user()?->id,
            'url' => $request->fullUrl(),
        ]);

        $message = app()->environment('production') 
            ? 'An error occurred while processing your request.' 
            : $e->getMessage();

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'error' => 'INTERNAL_ERROR',
                'suggestions' => [
                    'Try again in a few moments',
                    'Contact system administrator if the problem persists',
                    'Check your internet connection'
                ]
            ], 500);
        }

        return redirect()->back()
            ->withErrors(['general' => $message])
            ->withInput();
    }
}
