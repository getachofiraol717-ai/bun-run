import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NavItem {
  id: string;
  to: string;
  label: string;
  visible: boolean;
  order: number;
  authRequired: boolean;
}

interface NavContextType {
  navItems: NavItem[];
  isLoading: boolean;
}

const NavContext = createContext<NavContextType | undefined>(undefined);

// Main destinations are visible to everyone — guests clicking them are
// routed to the login page by the auth guard. Only Settings stays auth-only.
const defaultNavItems: NavItem[] = [
  { id: '1', to: '/', label: 'Home', visible: true, order: 0, authRequired: false },
  { id: '2', to: '/dashboard', label: 'Dashboard', visible: true, order: 1, authRequired: false },
  { id: '3', to: '/library', label: 'Library', visible: true, order: 2, authRequired: false },
  { id: '4', to: '/galaxy', label: 'Galaxy', visible: true, order: 3, authRequired: false },
  { id: '5', to: '/ai-tutor', label: 'AI Tutor', visible: true, order: 3.5, authRequired: false },
  { id: '6', to: '/quiz', label: 'Quiz', visible: true, order: 4, authRequired: false },
  { id: '6b', to: '/communication', label: 'Chat & Hub', visible: true, order: 4.5, authRequired: false },
  { id: '7', to: '/creator', label: 'Creator', visible: true, order: 5, authRequired: false },
  { id: '8', to: '/wellbeing', label: 'Wellbeing', visible: true, order: 6, authRequired: false },
  { id: '9', to: '/pricing', label: 'Pricing', visible: true, order: 7, authRequired: false },
  { id: '10', to: '/contact', label: 'Contact', visible: true, order: 8, authRequired: false },
  { id: '11', to: '/settings', label: 'Settings', visible: true, order: 9, authRequired: true },
];

const ALWAYS_AUTH_PATHS = new Set(['/galaxy', '/pricing', '/contact', '/settings', '/dashboard', '/library', '/ai-tutor', '/quiz', '/communication', '/creator', '/wellbeing', '/analytics']);

export const NavProvider = ({ children }: { children: ReactNode }) => {
  const { data: dbItems, isLoading } = useQuery({
    queryKey: ['nav_items_live'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('nav_items')
          .select('*')
          .order('sort_order');
        if (error) return null;
        return data;
      } catch {
        return null;
      }
    },
    staleTime: 5000,
    refetchInterval: 10000,
  });

  // Merge DB overrides onto the defaults: the database can relabel, reorder,
  // or hide items, but it can never wipe the menu out entirely (a sparse or
  // broken nav_items table previously left the navbar with just "Home").
  const navItems: NavItem[] = (() => {
    if (!dbItems || dbItems.length === 0) return defaultNavItems;
    const byPath = new Map(dbItems.map(item => [item.path as string, item]));
    const merged = defaultNavItems.map(def => {
      const db = byPath.get(def.to);
      if (!db) return def;
      return {
        id: db.id ?? def.id,
        to: def.to,
        label: db.label ?? def.label,
        visible: db.visible ?? def.visible,
        order: typeof db.sort_order === 'number' ? db.sort_order : def.order,
        authRequired: ALWAYS_AUTH_PATHS.has(def.to) || Boolean(db.auth_required ?? def.authRequired),
      };
    });
    // Include any extra custom paths saved in the DB that aren't in defaults.
    for (const item of dbItems) {
      if (!defaultNavItems.some(def => def.to === item.path)) {
        merged.push({
          id: item.id,
          to: item.path,
          label: item.label,
          visible: item.visible ?? true,
          order: typeof item.sort_order === 'number' ? item.sort_order : 99,
          authRequired: ALWAYS_AUTH_PATHS.has(item.path) || Boolean(item.auth_required),
        });
      }
    }
    // Guard against a broken/sparse table hiding nearly everything.
    if (merged.filter(item => item.visible).length < 3) return defaultNavItems;
    return merged;
  })();

  return (
    <NavContext.Provider value={{ navItems, isLoading }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = () => {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
};
