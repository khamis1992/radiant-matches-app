import { useState, useEffect, useCallback } from "react";

export interface SavedSearch {
  id: string;
  name: string;
  filters: {
    priceRange: [number, number];
    minRating: number;
    minExperience: number;
    locations: string[];
    serviceTypes: string[];
  };
  createdAt: string;
}

const SAVED_SEARCHES_KEY = "artist-saved-searches";
const MAX_SAVED_SEARCHES = 5;

/**
 * Hook for managing saved search presets
 * Allows users to save, load, and delete filter configurations
 */
export const useSavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Load saved searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_SEARCHES_KEY);
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch {
        // Invalid JSON, reset
        localStorage.removeItem(SAVED_SEARCHES_KEY);
      }
    }
  }, []);

  // Save a new search preset
  const saveSearch = useCallback((name: string, filters: SavedSearch["filters"]) => {
    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name: name.trim() || `Search ${savedSearches.length + 1}`,
      filters,
      createdAt: new Date().toISOString(),
    };

    setSavedSearches((prev) => {
      // Limit to MAX_SAVED_SEARCHES
      const updated = [newSearch, ...prev].slice(0, MAX_SAVED_SEARCHES);
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });

    return newSearch;
  }, [savedSearches.length]);

  // Delete a saved search
  const deleteSearch = useCallback((searchId: string) => {
    setSavedSearches((prev) => {
      const updated = prev.filter((s) => s.id !== searchId);
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear all saved searches
  const clearAllSearches = useCallback(() => {
    setSavedSearches([]);
    localStorage.removeItem(SAVED_SEARCHES_KEY);
  }, []);

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    clearAllSearches,
  };
};

