// ============================================================
// AnchorMap GIS — Shared TypeScript Types
// Single source of truth for all interfaces shared between
// the frontend (apps/web) and backend (apps/api).
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export type UserRole = 'USER' | 'ADMIN';
export type AuthProvider = 'email' | 'google';
export type LocationStatus = 'pending' | 'approved' | 'rejected' | 'deleted';
export type LocationSource = 'osm' | 'manual' | 'user_suggestion';
export type ReviewStatus = 'published' | 'hidden' | 'flagged';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'RESTORE'
  | 'APPROVE'
  | 'REJECT'
  | 'HIDE'
  | 'FLAG'
  | 'PROMOTE';
export type AuditEntityType =
  | 'location'
  | 'category'
  | 'review'
  | 'user'
  | 'suggestion'
  | 'report';

export type ReportType =
  | 'wrong_location'
  | 'wrong_info'
  | 'permanently_closed'
  | 'duplicate'
  | 'inappropriate'
  | 'other';

// ─── Core Entities ───────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  provider: AuthProvider;
  emailVerified: boolean;
  createdAt: string; // ISO date string
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameTr: string | null;
  slug: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  sortOrder: number;
  children?: Category[];
  locationCount?: number;
}

export interface DayHours {
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface Photo {
  id: string;
  locationId: string;
  url: string;
  publicId: string;
  caption: string | null;
  captionTr: string | null;
  isPrimary: boolean;
  uploadedBy: string | null;
  createdAt: string;
}

export interface Location {
  id: string;
  osmId: number | null;
  osmType: string | null;
  slug: string;
  name: string;
  nameTr: string | null;
  categoryId: string;
  category?: Category;
  subcategory: string | null;
  lat: number;
  lng: number;
  district: string | null;
  address: string | null;
  description: string | null;
  descriptionTr: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  instagram: string | null;
  operator: string | null;
  addrPostcode: string | null;
  hoursJson: OpeningHours | { raw?: string; [key: string]: any } | null;
  tags: string[];
  accessibility: string | null;
  status: LocationStatus;
  source: LocationSource;
  avgRating: number | null;
  reviewCount: number;
  photos?: Photo[];
  isFavorited?: boolean; // populated when authenticated
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

/** Lightweight version returned in map/list responses */
export interface LocationSummary {
  id: string;
  slug: string;
  name: string;
  nameTr: string | null;
  categoryId: string;
  lat: number;
  lng: number;
  district: string | null;
  avgRating: number | null;
  reviewCount: number;
  primaryPhotoUrl: string | null;
}

/** Proximity search result includes distance */
export interface LocationNearby extends LocationSummary {
  distanceM: number;
}

export interface Review {
  id: string;
  locationId: string;
  userId: string;
  user?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  rating: number;
  content: string | null;
  status: ReviewStatus;
  flagCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  userId: string;
  locationId: string;
  location?: LocationSummary;
  createdAt: string;
}

export interface Report {
  id: string;
  locationId: string;
  location?: Pick<Location, 'id' | 'name' | 'slug'>;
  reporterId: string | null;
  type: ReportType | null;
  description: string | null;
  status: ReportStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  suggestedBy: string | null;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  name: string;
  nameTr: string | null;
  categoryId: string | null;
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
  lat: number;
  lng: number;
  address: string | null;
  description: string | null;
  status: SuggestionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  locationId: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  changesJson: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

// ─── API Payloads ─────────────────────────────────────────────

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Auth DTOs ────────────────────────────────────────────────

export interface RegisterDto {
  email: string;
  name: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// ─── Location DTOs ────────────────────────────────────────────

export interface CreateLocationDto {
  name: string;
  nameTr?: string;
  categoryId: string;
  subcategory?: string;
  lat: number;
  lng: number;
  district?: string;
  address?: string;
  description?: string;
  descriptionTr?: string;
  phone?: string;
  website?: string;
  email?: string;
  instagram?: string;
  hoursJson?: OpeningHours;
  tags?: string[];
  accessibility?: string;
  status?: LocationStatus;
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> {}

export interface LocationFilters {
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  categoryId?: string;
  district?: string;
  status?: LocationStatus;
  source?: LocationSource;
  q?: string;
  page?: number;
  limit?: number;
}

export interface NearbyFilters {
  lat: number;
  lng: number;
  radius?: number; // meters, default 1000, max 50000
  categoryId?: string;
  limit?: number;
}

// ─── Review DTOs ──────────────────────────────────────────────

export interface CreateReviewDto {
  rating: number;
  content?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  content?: string;
}

// ─── Report & Suggestion DTOs ─────────────────────────────────

export interface CreateReportDto {
  locationId: string;
  type: ReportType;
  description?: string;
}

export interface CreateSuggestionDto {
  name: string;
  nameTr?: string;
  categoryId?: string;
  lat: number;
  lng: number;
  address?: string;
  description?: string;
}

// ─── Map Bounds ───────────────────────────────────────────────

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// ─── Geographic Constants ─────────────────────────────────────

export const ANKARA_CENTER: [number, number] = [39.9334, 32.8597];
export const ANKARA_BBOX: MapBounds = {
  minLat: 39.5,
  maxLat: 40.2,
  minLng: 32.3,
  maxLng: 33.1,
};
export const ANKARA_DEFAULT_ZOOM = 12;
export const ANKARA_MIN_ZOOM = 10;
export const ANKARA_MAX_ZOOM = 18;

export const CATEGORY_COLORS: Record<string, string> = {
  education: '#3b82f6',
  healthcare: '#ef4444',
  emergency: '#f97316',
  'public-services': '#8b5cf6',
  historical: '#d97706',
  tourism: '#10b981',
};
