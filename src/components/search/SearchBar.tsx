"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  X,
  TrendingUp,
  Clock,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import useSearchStore from "@/stores/searchStore";
import { SuggestionsHandler } from "@/lib/suggestions";
import { getDidYouMeanSuggestions } from "@/lib/didumean";
// Type definitions
interface Product {
  id: string;
  name: string;
  finalPrice?: number;
  mainImage?: string;
}

interface Category {
  id: string;
  name: string;
}

interface SuggestionsData {
  queries?: string[];
  products?: Product[];
  categories?: Category[];
  trending?: string[];
  recent?: string[];
  didYouMean?: string[];
}

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

type SuggestionType =
  | "query"
  | "product"
  | "category"
  | "trending"
  | "recent"
  | "didYouMean";

// Enhanced placeholder texts
const PLACEHOLDERS = [
  "Search furniture, sofas, beds...",
  "Find dining sets, chairs...",
  "Discover office furniture...",
  "Explore home decor items...",
  "Search by brand, style, color...",
];

// Enhanced trending searches
const TRENDING_SEARCHES = [
  "sofa set 3 seater",
  "king size bed with storage",
  "dining table 6 seater",
  "ergonomic office chair",
  "coffee table wooden",
  "wardrobe with mirror",
  "study table with drawers",
  "recliner chair leather",
];

// Placeholder animation hook
const usePlaceholderAnimation = () => {
  const [placeholderText, setPlaceholderText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = PLACEHOLDERS[currentPhraseIndex];

    const timeout = setTimeout(
      () => {
        if (isDeleting) {
          setPlaceholderText(currentPhrase.substring(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        } else {
          setPlaceholderText(currentPhrase.substring(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }

        if (isDeleting && charIndex === 0) {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }
      },
      isDeleting ? 40 : 100
    );

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentPhraseIndex]);

  return placeholderText;
};

const SearchBar: React.FC<SearchBarProps> = ({ className = "", onSearch }) => {
  const [query, setQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const loadingProducts = useSearchStore((state: any) => state.loadingProducts);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();
  const pathName = usePathname();
  const animatedPlaceholder = usePlaceholderAnimation();
  const placeholderText =
    pathName === "/" ? animatedPlaceholder : "Search furniture & home decor...";

  const { setQuery: setSearchQuery } = useSearchStore();

  // Clear input on page load and route changes (except search page)
  useEffect(() => {
    if (pathName !== "/search") {
      setQuery("");
    }
    setIsSearching(false);
    setIsLoading(false);
  }, [pathName]);

  // Load recent searches
  useEffect(() => {
    try {
      const recentSearchesData = JSON.parse(
        localStorage.getItem("recentSearches") || "[]"
      );
      setRecentSearches(recentSearchesData.slice(0, 6));
    } catch (error) {
      console.error("Error loading search data:", error);
    }
  }, []);

  // Save to recent searches
  const saveToRecentSearches = useCallback(
    (searchQuery: string) => {
      try {
        const cleanQuery = searchQuery.trim().toLowerCase();
        if (cleanQuery.length < 2) return;

        const updatedRecent = [
          searchQuery,
          ...recentSearches.filter((item) => item.toLowerCase() !== cleanQuery),
        ].slice(0, 6);

        setRecentSearches(updatedRecent);
        localStorage.setItem("recentSearches", JSON.stringify(updatedRecent));
      } catch (error) {
        console.error("Error saving search data:", error);
      }
    },
    [recentSearches]
  );

  // Get default suggestions (recent + trending)
  const getDefaultSuggestions = useCallback((): SuggestionsData => {
    const maxItems = 8;
    const hasRecent = recentSearches.length > 0;

    if (hasRecent) {
      const recentCount = Math.min(4, recentSearches.length);
      const trendingCount = maxItems - recentCount;
      return {
        recent: recentSearches.slice(0, recentCount),
        trending: TRENDING_SEARCHES.slice(0, trendingCount),
        queries: [],
        products: [],
        categories: [],
        didYouMean: [],
      };
    } else {
      return {
        trending: TRENDING_SEARCHES.slice(0, maxItems),
        recent: [],
        queries: [],
        products: [],
        categories: [],
        didYouMean: [],
      };
    }
  }, [recentSearches]);

  // Get instant suggestions
  const getInstantSuggestions = useCallback(
    (searchQuery: string): SuggestionsData => {
      if (searchQuery.length < 2) {
        return getDefaultSuggestions();
      }

      const result = SuggestionsHandler.getSmartSuggestions(searchQuery);
      const maxItems = 8;
      const querySuggestions = result.suggestions?.slice(0, maxItems) || [];

      return {
        queries: querySuggestions,
        trending: [],
        recent: [],
        products: [],
        categories: [],
        didYouMean: [],
      };
    },
    [getDefaultSuggestions]
  );

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setQuery(value);
    setIsLoading(false);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      // Show recent + trending when no text
      setSuggestions(getDefaultSuggestions());
      setShowSuggestions(true);
      return;
    }

    // Show loading for query suggestions
    setIsLoading(true);

    debounceRef.current = setTimeout(() => {
      const instantSuggestions = getInstantSuggestions(trimmedValue);
      setSuggestions(instantSuggestions);
      setShowSuggestions(true);
      setSelectedIndex(-1);
      setIsLoading(false);
    }, 150);
  };

  // Input focus handler - always show suggestions
  const handleInputFocus = (): void => {
    setIsFocused(true);
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      setSuggestions(getInstantSuggestions(trimmedQuery));
    } else {
      // Always show recent + trending when focused with no text
      setSuggestions(getDefaultSuggestions());
    }
    setShowSuggestions(true);
  };

  // Input blur handler
  const handleInputBlur = (): void => {
    setIsFocused(false);
  };

  // Submit handler
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery && !isSearching) {
      await performSearch(trimmedQuery);
    }
  };

  // Perform search
  const performSearch = async (searchQuery: string): Promise<void> => {
    if (!searchQuery || isSearching) return;

    setIsSearching(true);
    setIsLoading(true);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    saveToRecentSearches(searchQuery);
    setSearchQuery(searchQuery);

    if (onSearch) {
      onSearch(searchQuery);
    }

    // Create clean URL slug
    const createSlug = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
    };
    const slug = createSlug(searchQuery);
    router.push(`/search?q=${encodeURIComponent(slug)}`);
    setIsSearching(false);
    setIsLoading(false);
  };

  // Get all suggestions for keyboard navigation
  const getAllSuggestionItems = () => {
    const items: Array<{ item: any; type: SuggestionType; index: number }> = [];
    let currentIndex = 0;

    if (suggestions?.recent && suggestions.recent.length > 0) {
      suggestions.recent.forEach((item) => {
        items.push({ item, type: "recent", index: currentIndex++ });
      });
    }

    if (suggestions?.trending && suggestions.trending.length > 0) {
      suggestions.trending.forEach((item) => {
        items.push({ item, type: "trending", index: currentIndex++ });
      });
    }

    if (suggestions?.queries && suggestions.queries.length > 0) {
      suggestions.queries.forEach((item) => {
        items.push({ item, type: "query", index: currentIndex++ });
      });
    }

    if (suggestions?.didYouMean && suggestions.didYouMean.length > 0) {
      suggestions.didYouMean.forEach((item) => {
        items.push({ item, type: "didYouMean", index: currentIndex++ });
      });
    }

    if (suggestions?.products && suggestions.products.length > 0) {
      suggestions.products.forEach((item) => {
        items.push({ item, type: "product", index: currentIndex++ });
      });
    }

    if (suggestions?.categories && suggestions.categories.length > 0) {
      suggestions.categories.forEach((item) => {
        items.push({ item, type: "category", index: currentIndex++ });
      });
    }

    return items;
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!showSuggestions || !suggestions) return;

    const allItems = getAllSuggestionItems();
    const totalItems = allItems.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          handleSuggestionSelect(allItems[selectedIndex]);
        } else {
          handleSubmit(e as any);
        }
        break;

      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;

      case "Tab":
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          e.preventDefault();
          const selectedItem = allItems[selectedIndex];
          const itemName = getItemName(selectedItem.item);
          setQuery(itemName);
        }
        break;
    }
  };

  // Suggestion selection
  const handleSuggestionSelect = async (suggestionItem: {
    item: any;
    type: SuggestionType;
    index: number;
  }): Promise<void> => {
    let selectedQuery = "";

    if (suggestionItem.type === "product") {
      selectedQuery = suggestionItem.item.name;
    } else if (suggestionItem.type === "category") {
      selectedQuery = suggestionItem.item.name;
    } else {
      selectedQuery = suggestionItem.item;
    }

    if (selectedQuery) {
      setQuery(selectedQuery);
      await performSearch(selectedQuery);
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Clear search
  const clearSearch = (): void => {
    setQuery("");
    setSuggestions(getDefaultSuggestions());
    setShowSuggestions(true);
    setSelectedIndex(-1);
    setIsLoading(false);
    setIsSearching(false);
    inputRef.current?.focus();
  };

  // Get item name helper
  const getItemName = (item: string | Product | Category): string => {
    if (typeof item === "string") return item;
    return item.name;
  };

  // Render suggestion section
  const renderSuggestionSection = (
    items: any[],
    type: SuggestionType,
    icon: React.ReactNode,
    startIndex: number,
    title: string,
    maxItems: number = 6
  ) => {
    if (!items || items.length === 0) return null;

    const limitedItems = items.slice(0, maxItems);

    return (
      <div className="border-b border-gray-100 last:border-b-0">
        {limitedItems.map((item, i) => {
          const globalIndex = startIndex + i;
          const isSelected = selectedIndex === globalIndex;
          const itemName = getItemName(item);

          return (
            <div
              key={`${type}-${i}`}
              className={`px-4 py-2 cursor-pointer flex items-center justify-between group transition-colors duration-150 ${
                isSelected
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() =>
                handleSuggestionSelect({ item, type, index: globalIndex })
              }
              onMouseEnter={() => setSelectedIndex(globalIndex)}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div
                  className={`flex-shrink-0 w-4 h-4 transition-colors duration-150 ${
                    isSelected ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`truncate text-sm ${
                      isSelected ? "text-blue-700" : ""
                    }`}
                  >
                    {itemName}
                  </div>
                  {type === "product" && item.finalPrice && (
                    <div className="text-sm text-green-600 font-semibold">
                      ₹{item.finalPrice.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              {isSelected && (
                <ArrowUpRight size={12} className="text-blue-600" />
              )}
            </div>
          );
        })}
      </div>
    );
  };
  const renderDidYouMeanSection = (
    items: string[],
    icon: React.ReactNode,
    startIndex: number,
    query: string,
    isFallback: boolean,
    maxItems: number = 4
  ) => {
    if (!items || items.length === 0) return null;

    const limitedItems = items.slice(0, maxItems);

    return (
      <div className="border-b border-gray-100 last:border-b-0 pt-1">
        {isFallback && (
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-2 px-3">
            No results found for "{query}" · Did you mean?
          </div>
        )}
        {limitedItems.map((suggestion, i) => {
          const globalIndex = startIndex + i;
          const isSelected = selectedIndex === globalIndex;

          return (
            <div
              key={`didyoumean-${i}`}
              className={`px-4 py-3 cursor-pointer flex items-center justify-between group transition-colors duration-150 ${
                isSelected
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => {
                setQuery(suggestion);
                performSearch(suggestion);
              }}
              onMouseEnter={() => setSelectedIndex(globalIndex)}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div
                  className={`flex-shrink-0 w-4 h-4 transition-colors duration-150 ${
                    isSelected ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`truncate ${isSelected ? "text-blue-700" : ""}`}
                  >
                    {suggestion}
                  </div>
                </div>
              </div>
              {isSelected && (
                <ArrowUpRight size={12} className="text-blue-600" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Check if we have suggestions
  const hasSuggestions =
    suggestions &&
    ((suggestions.recent && suggestions.recent.length > 0) ||
      (suggestions.trending && suggestions.trending.length > 0) ||
      (suggestions.queries && suggestions.queries.length > 0) ||
      (suggestions.products && suggestions.products.length > 0) ||
      (suggestions.categories && suggestions.categories.length > 0));

  let currentIndex = 0;

  return (
    <div className={`relative ${className}`} role="search">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Search Input - Premium styling without focus ring */}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholderText}
            disabled={isSearching || loadingProducts}
            className={`w-full pl-5 pr-16 h-[30px] max-h-[30px] text-xs font-normal rounded-xs bg-gray-50  border border-gray-200 
            focus:outline-none focus:border-gray-600  focus:bg-white transition-all duration-300 ease-out 
            text-gray-900 placeholder-gray-400 
            ${
              isSearching || loadingProducts
                ? "cursor-not-allowed opacity-70"
                : ""
            }`}
            autoComplete="off"
            aria-label="Search furniture and home decor"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            role="combobox"
          />
          <style jsx>{`
            input:not(:placeholder-shown) {
              font-size: 0.875rem; /* text-sm */
            }
          `}</style>
          {/* Search Icons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {/* Clear button - only show on hover and when there's query */}
            {query && !isSearching && !loadingProducts && isHovered && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded hover:bg-gray-100"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}

            {/* Search button - always visible */}
            <button
              type="submit"
              disabled={isSearching || loadingProducts || !query.trim()}
              className={`p-2 rounded transition-colors duration-200 ${
                isSearching || loadingProducts
                  ? "text-blue-600 bg-blue-50"
                  : query.trim()
                  ? "text-blue-600 hover:bg-blue-50"
                  : "text-gray-400"
              }`}
              aria-label={
                isSearching || loadingProducts ? "Searching..." : "Search"
              }
            >
              {isSearching || isLoading || loadingProducts ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xs shadow-lg z-50 max-w-full "
          style={{
            maxHeight: "min(400px, 80vh)",
            width: "100%",
            overflow: "hidden",
          }}
          role="listbox"
          aria-label="Search suggestions"
        >
          {hasSuggestions ? (
            <div>
              {/* Recent Searches */}
              {suggestions?.recent && suggestions.recent.length > 0 && (
                <>
                  {renderSuggestionSection(
                    suggestions.recent,
                    "recent",
                    <Clock size={12} />,
                    currentIndex,
                    "Recent Searches",
                    4
                  )}
                  {((currentIndex += suggestions.recent.length), null)}
                </>
              )}

              {/* Trending Searches */}
              {suggestions?.trending && suggestions.trending.length > 0 && (
                <>
                  {renderSuggestionSection(
                    suggestions.trending,
                    "trending",
                    <TrendingUp size={12} />,
                    currentIndex,
                    "Trending Searches",
                    8
                  )}
                  {((currentIndex += suggestions.trending.length), null)}
                </>
              )}

              {/* Query Suggestions */}
              {suggestions?.queries && suggestions.queries.length > 0 && (
                <>
                  {renderSuggestionSection(
                    suggestions.queries,
                    "query",
                    <Search size={12} />,
                    currentIndex,
                    "Suggestions",
                    8
                  )}
                </>
              )}
            </div>
          ) : (
            (() => {
              const didYouMeanSuggestions = getDidYouMeanSuggestions(query);

              return (
                <>
                  {didYouMeanSuggestions.length > 0 &&
                    renderDidYouMeanSection(
                      didYouMeanSuggestions,
                      <Search size={12} />,
                      currentIndex + (suggestions?.queries?.length || 0),
                      query,
                      didYouMeanSuggestions.isFallback,
                      4
                    )}
                </>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
