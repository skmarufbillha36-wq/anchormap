/**
 * Central icon system for AnchorMap.
 * All icons are from lucide-react — no emojis, no mixed libraries.
 *
 * Usage:
 *   import { Icons, CategoryIcon } from '@/lib/icons';
 *   <Icons.Search size={16} />
 *   <CategoryIcon slug="education" size={20} />
 */

import {
  // Navigation & UI
  Search, X, ChevronDown, ChevronUp, ChevronRight, Menu, ArrowLeft,
  // Auth
  LogIn, LogOut, UserPlus, User, Shield, KeyRound,
  // Map
  MapPin, Map, Navigation, Compass, Globe,
  // Admin sections
  LayoutDashboard, FolderTree, Star, Flag, Lightbulb, Users, FileText,
  // Locations
  Building2, Building, Eye, CheckCircle, XCircle, Clock, AlertCircle,
  // Actions
  Plus, Trash2, Pencil, Check, Save, Upload, Download, RefreshCw, Filter, MoreHorizontal,
  // Status
  Heart, BookOpen, ImageIcon, Phone, Mail, ExternalLink, Info, Anchor,
  // Category-specific
  GraduationCap, HeartPulse, Siren, Landmark, Camera, Trees,
  Hospital, School, Baby, Library, Stethoscope, Pill, CircleSlash,
  ShieldCheck, Flame, Ambulance, Banknote, Receipt, Milestone, PawPrint,
  Theater, Hotel, TreePine, HelpCircle, Pickaxe,
  // Settings
  Settings, Bell, SlidersHorizontal,
} from 'lucide-react';

// Re-export everything under a single namespace
export const Icons = {
  // Navigation
  Search, X, ChevronDown, ChevronUp, ChevronRight, Menu, ArrowLeft,
  // Auth
  LogIn, LogOut, UserPlus, User, Shield, KeyRound,
  // Map
  MapPin, Map, Navigation, Compass, Globe,
  // Admin sections
  LayoutDashboard, FolderTree, Star, Flag, Lightbulb, Users, FileText,
  // Locations
  Building2, Building, Eye, CheckCircle, XCircle, Clock, AlertCircle,
  // Actions
  Plus, Trash2, Pencil, Check, Save, Upload, Download, RefreshCw, Filter, MoreHorizontal,
  // Status / misc
  Heart, BookOpen, ImageIcon, Phone, Mail, ExternalLink, Info, Anchor,
  // Categories
  GraduationCap, HeartPulse, Siren, Landmark, Camera, Trees,
  Hospital, School, Baby, Library, Stethoscope, Pill, CircleSlash, PawPrint,
  ShieldCheck, Flame, Ambulance, Banknote, Receipt,
  Milestone, Pickaxe, Theater, Hotel, TreePine, HelpCircle,
  // Settings
  Settings, Bell, SlidersHorizontal,
} as const;

export type IconName = keyof typeof Icons;

// ─── Category → Icon mapping ──────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.FC<{ size?: number; className?: string; color?: string; strokeWidth?: number }>> = {
  // Top-level
  education:         GraduationCap,
  healthcare:        HeartPulse,
  emergency:         Siren,
  'public-services': Landmark,
  historical:        Building2,
  tourism:           Camera,

  // Education subcategories
  university:        GraduationCap,
  school:            School,
  kindergarten:      Baby,
  library:           Library,

  // Healthcare subcategories
  hospital:          Hospital,
  clinic:            Stethoscope,
  pharmacy:          Pill,
  dentist:           CircleSlash,
  veterinary:        PawPrint,

  // Emergency subcategories
  'police-station':       ShieldCheck,
  'fire-station':         Flame,
  'emergency-hospital':   Ambulance,

  // Public services subcategories
  'government-office': Building2,
  municipality:        Building,
  'post-office':       Mail,
  'tax-office':        Receipt,
  bank:                Banknote,

  // Historical subcategories
  museum:                 Building2,
  'historical-building':  Building,
  monument:               Milestone,
  mosque:                 Landmark,
  'archaeological-site':  Pickaxe,
  'cultural-center':      Theater,

  // Tourism subcategories
  'tourist-attraction':   Camera,
  viewpoint:              Eye,
  hotel:                  Hotel,
  park:                   TreePine,
  'tourist-information':  Info,
};

/**
 * Returns the Lucide icon component for a given category slug.
 * Falls back to MapPin for unknown slugs.
 */
export function getCategoryIcon(slug: string) {
  return CATEGORY_ICONS[slug] ?? MapPin;
}

interface CategoryIconProps {
  slug: string;
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export function CategoryIcon({ slug, size = 18, color, className, strokeWidth = 2 }: CategoryIconProps) {
  const Icon = getCategoryIcon(slug);
  return <Icon size={size} color={color} className={className} strokeWidth={strokeWidth} />;
}
