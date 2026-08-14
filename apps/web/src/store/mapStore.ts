import { create } from 'zustand';
import { LocationSummary, MapBounds, Category } from '@ankara-gis/types';

interface MapState {
  // Map viewport
  bounds: MapBounds | null;
  zoom: number;

  // Data
  locations: LocationSummary[];
  selectedLocationId: string | null;
  categories: Category[];

  // Filters
  activeCategoryId: string | null;
  activeDistrict: string | null;
  searchQuery: string;

  // UI state
  isSidebarOpen: boolean;
  isSearching: boolean;

  // Imperative map actions
  flyToTarget: { lat: number; lng: number; zoom?: number } | null;

  // Actions
  setBounds: (bounds: MapBounds) => void;
  setZoom: (zoom: number) => void;
  setLocations: (locations: LocationSummary[]) => void;
  selectLocation: (id: string | null) => void;
  setCategories: (cats: Category[]) => void;
  setActiveCategoryId: (id: string | null) => void;
  setActiveDistrict: (district: string | null) => void;
  setSearchQuery: (q: string) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsSearching: (searching: boolean) => void;
  setFlyToTarget: (target: { lat: number; lng: number; zoom?: number } | null) => void;
  clearFilters: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  bounds: null,
  zoom: 12,
  locations: [],
  selectedLocationId: null,
  categories: [],
  activeCategoryId: null,
  activeDistrict: null,
  searchQuery: '',
  isSidebarOpen: false,
  isSearching: false,
  flyToTarget: null,

  setBounds: (bounds) => set({ bounds }),
  setZoom: (zoom) => set({ zoom }),
  setLocations: (locations) => set({ locations }),
  selectLocation: (id) => set({ selectedLocationId: id, isSidebarOpen: !!id }),
  setCategories: (categories) => set({ categories }),
  setActiveCategoryId: (activeCategoryId) => set({ activeCategoryId }),
  setActiveDistrict: (activeDistrict) => set({ activeDistrict }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setFlyToTarget: (flyToTarget) => set({ flyToTarget }),
  clearFilters: () =>
    set({ activeCategoryId: null, activeDistrict: null, searchQuery: '' }),
}));
