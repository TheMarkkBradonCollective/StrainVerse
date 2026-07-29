import type React from 'react';
import { AppView } from './types';
import { Sprout, Globe, Users, User as UserIcon, Flame } from 'lucide-react';

export interface NavItem {
  view: AppView;
  label: string;
  icon: React.ElementType;
  ageGate?: boolean;
}

/** StrainVerse is the primary app — center tab in bottom nav and default view. */
export const NAV_ITEMS: NavItem[] = [
  { view: AppView.HERBHUB, label: 'HerbHub', icon: Globe },
  { view: AppView.MATCHIT, label: 'MatchIt', icon: Flame, ageGate: true },
  { view: AppView.STRAINVERSE, label: 'StrainVerse', icon: Sprout },
  { view: AppView.SOCIALSESH, label: 'SocialSesh', icon: Users },
  { view: AppView.PROFILE, label: 'My Stash', icon: UserIcon },
];

export const getVisibleNavItems = (userAge: number | null): NavItem[] =>
  NAV_ITEMS.filter(item => !item.ageGate || (userAge !== null && userAge >= 21));
