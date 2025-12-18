import React, { useState, useEffect, useRef, useCallback } from "react";

interface TestCategory {
  id: number;
  name: string;
}

interface TestCatalog {
  id: number;
  name: string;
  code: string;
  price: number | string;
  turnaround_time: number;
  category_id?: number;
  category?: TestCategory;
  unit?: string;
  normal_range?: string;
  sample_type?: string;
  instructions?: string;
  status: string;
}

interface LabTestSearchProps {
  onSelect: (test: TestCatalog) => void;
  selectedCategory?: string;
}

/**
 * LabTestSearch Component
 * 
 * Requirements 4.1, 4.3:
 * - Provides autocomplete search interface for lab tests
 * - Implements category filtering
 * - Displays turnaround time information
 */
export default function LabTestSearch({ onSelect, selectedCategory }: LabTestSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [testSuggestions, setTestSuggestions] = useState<TestCatalog[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [categoryFilter, setCategoryFilter] = useState<string>(selectedCategory || "");
  const [categories, setCategories] = useState<string[]>([]);

  const suggestionBoxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
        
        const response = await fetch("/api/test-catalogs/categories/list", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-CSRF-TOKEN": csrfToken,
            "X-Requested-With": "XMLHttpRequest",
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error("Failed to load test categories:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Failed to load test categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Load default tests on mount
  useEffect(() => {
    loadTests("");
  }, []);

  // Update category filter when prop changes
  useEffect(() => {
    if (selectedCategory) {
      setCategoryFilter(selectedCategory);
    }
  }, [selectedCategory]);

  /**
   * Load tests from API
   * Requirement 4.1: Search interface for available lab tests
   * Requirement 4.3: Include turnaround time information
   */
  const loadTests = async (query: string, category?: string) => {
    try {
      setLoadingTests(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (query.trim()) {
        params.append("query", query.trim());
      }
      if (category) {
        params.append("category", category);
      }
      params.append("status", "active");

      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";

      const response = await fetch(`/api/test-catalogs/search/advanced?${params.toString()}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestSuggestions(data);
        setShowSuggestions(true);
        setHighlightedIndex(data.length > 0 ? 0 : -1);
      } else {
        console.error("Failed to load tests:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Failed to load tests:", error);
    } finally {
      setLoadingTests(false);
    }
  };

  /**
   * Debounced search handler
   * Requirement 4.1: Autocomplete search
   */
  const debouncedSearch = useCallback(
    (() => {
      let timer: number | undefined;
      return (term: string, category?: string) => {
        if (timer) {
          window.clearTimeout(timer);
        }
        timer = window.setTimeout(() => {
          loadTests(term, category);
        }, 300);
      };
    })(),
    []
  );

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    debouncedSearch(value, categoryFilter);
  };

  /**
   * Handle category filter change
   * Requirement 4.1: Category filtering
   */
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setCategoryFilter(category);
    loadTests(searchTerm, category);
  };

  /**
   * Handle test selection
   */
  const handleTestSelect = (test: TestCatalog) => {
    onSelect(test);
    setSearchTerm("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || testSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < testSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : testSuggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < testSuggestions.length) {
        handleTestSelect(testSuggestions[highlightedIndex]);
      } else if (testSuggestions.length === 1) {
        handleTestSelect(testSuggestions[0]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  /**
   * Format turnaround time for display
   * Requirement 4.3: Display turnaround time information
   */
  const formatTurnaroundTime = (hours: number): string => {
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    return `${days}d ${remainingHours}h`;
  };

  /**
   * Get turnaround time badge color
   */
  const getTurnaroundBadgeColor = (hours: number): string => {
    if (hours <= 6) return "bg-green-100 text-green-700";
    if (hours <= 24) return "bg-blue-100 text-blue-700";
    if (hours <= 48) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      {/* Category Filter - Requirement 4.1 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Filter by Category
        </label>
        <select
          value={categoryFilter}
          onChange={handleCategoryChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Search Input - Requirement 4.1 */}
      <div className="relative">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Search Lab Tests
        </label>
        <input
          ref={inputRef}
          type="text"
          data-lab-search-input
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type to search tests by name or code..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div
            ref={suggestionBoxRef}
            className="absolute z-20 mt-1 w-full max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            {loadingTests ? (
              <div className="px-3 py-3 text-sm text-gray-500 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Searching tests...
              </div>
            ) : testSuggestions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-500">
                {searchTerm.trim().length > 0
                  ? `No tests found matching "${searchTerm}"`
                  : "No tests available"}
              </div>
            ) : (
              <>
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                  {testSuggestions.length} test{testSuggestions.length !== 1 ? 's' : ''} found
                </div>
                {testSuggestions.map((test, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  
                  return (
                    <div
                      key={test.id}
                      onClick={() => handleTestSelect(test)}
                      className={`px-3 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                        isHighlighted
                          ? "bg-blue-50 border-l-2 border-blue-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm font-medium text-gray-900">
                              {test.name}
                            </div>
                            <span className="text-xs text-gray-500 font-mono">
                              {test.code}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            {test.category && (
                              <span className="px-2 py-0.5 bg-gray-100 rounded">
                                {typeof test.category === 'object' ? test.category.name : test.category}
                              </span>
                            )}
                            {test.sample_type && (
                              <span>Sample: {test.sample_type}</span>
                            )}
                            <span className="font-medium">
                              KES {typeof test.price === 'number' ? test.price.toFixed(2) : test.price}
                            </span>
                          </div>
                        </div>
                        
                        {/* Turnaround Time Badge - Requirement 4.3 */}
                        <div className="flex-shrink-0">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getTurnaroundBadgeColor(
                              test.turnaround_time
                            )} flex items-center gap-1`}
                            title={`Expected turnaround time: ${formatTurnaroundTime(test.turnaround_time)}`}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{formatTurnaroundTime(test.turnaround_time)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
