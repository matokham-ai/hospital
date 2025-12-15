<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvalidTestPriceException extends Exception
{
    protected $testCatalog;
    protected $currentPrice;
    protected $requestedPrice;
    protected $validationType;
    protected $pendingOrders;

    public function __construct($testCatalog, float $currentPrice, float $requestedPrice, string $validationType, int $pendingOrders = 0, $message = null)
    {
        $this->testCatalog = $testCatalog;
        $this->currentPrice = $currentPrice;
        $this->requestedPrice = $requestedPrice;
        $this->validationType = $validationType;
        $this->pendingOrders = $pendingOrders;
        
        $defaultMessage = match($validationType) {
            'significant_change' => "Price change for test '{$testCatalog->name}' exceeds 50% threshold (from {$currentPrice} to {$requestedPrice}).",
            'pending_orders' => "Cannot change price for test '{$testCatalog->name}' because it has {$pendingOrders} pending orders.",
            'invalid_range' => "Price {$requestedPrice} for test '{$testCatalog->name}' is outside the valid range.",
            'precision_error' => "Price {$requestedPrice} has too many decimal places. Maximum 2 decimal places allowed.",
            default => "Invalid price change for test '{$testCatalog->name}'."
        };
        
        parent::__construct($message ?? $defaultMessage);
    }

    public function getTestCatalog()
    {
        return $this->testCatalog;
    }

    public function getCurrentPrice(): float
    {
        return $this->currentPrice;
    }

    public function getRequestedPrice(): float
    {
        return $this->requestedPrice;
    }

    public function getValidationType(): string
    {
        return $this->validationType;
    }

    public function getPendingOrders(): int
    {
        return $this->pendingOrders;
    }

    public function render(Request $request): JsonResponse
    {
        $suggestions = match($this->validationType) {
            'significant_change' => [
                'Verify the price change is intentional',
                'Consider implementing the change gradually',
                'Notify relevant departments about the price change',
                'Use force_update parameter if change is confirmed'
            ],
            'pending_orders' => [
                'Wait for pending orders to be completed',
                'Cancel pending orders if appropriate',
                'Schedule price change for later',
                'Contact laboratory manager for guidance'
            ],
            'invalid_range' => [
                'Check the valid price range for this test category',
                'Ensure price is not negative',
                'Verify price does not exceed maximum limit'
            ],
            'precision_error' => [
                'Round price to 2 decimal places',
                'Use format like 99.99 instead of 99.999'
            ],
            default => ['Contact system administrator for assistance']
        };

        $priceChangePercentage = $this->currentPrice > 0 
            ? abs(($this->requestedPrice - $this->currentPrice) / $this->currentPrice) * 100 
            : 0;

        return response()->json([
            'message' => $this->getMessage(),
            'error' => 'INVALID_TEST_PRICE',
            'validation_type' => $this->validationType,
            'test' => [
                'id' => $this->testCatalog->id,
                'name' => $this->testCatalog->name,
                'code' => $this->testCatalog->code,
                'category' => $this->testCatalog->category,
            ],
            'price_details' => [
                'current_price' => $this->currentPrice,
                'requested_price' => $this->requestedPrice,
                'change_percentage' => round($priceChangePercentage, 2),
                'pending_orders' => $this->pendingOrders,
            ],
            'suggestions' => $suggestions
        ], 422);
    }
}
