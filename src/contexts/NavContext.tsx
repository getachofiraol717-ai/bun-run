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

const defaultNavItems: NavItem[] = [
  { id: '1', to: '/', label: 'Home', visible: true, order: 0, authRequired: false },
  { id: '2', to: '/dashboard', label: 'Dashboard', visible: true, order: 1, authRequired: true },
  { id: '3', to: '/library', label: 'Library', visible: true, order: 2, authRequired: true },
  { id: '4', to: '/galaxy', label: 'Galaxy', visible: true, order: 3, authRequired: true },
  { id: '5', to: '/ai-tutor', label: 'AI Tutor', visible: true, order: 3.5, authRequired: true },
  { id: '6', to: '/quiz', label: 'Quiz', visible: true, order: 4, authRequired: true },
  { id: '6b', to: '/communication', label: 'Chat & Hub', visible: true, order: 4.5, authRequired: true },
  { id: '7', to: '/creator', label: 'Creator', visible: true, order: 5, authRequired: true },
  { id: '8', to: '/wellbeing', label: 'Wellbeing', visible: true, order: 6, authRequired: true },
  { id: '9', to: '/pricing', label: 'Pricing', visible: true, order: 7, authRequired: true },
  { id: '10', to: '/contact', label: 'Contact', visible: true, order: 8, authRequired: true },
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

  const navItems: NavItem[] = dbItems && dbItems.length > 0
    ? dbItems.map(item => ({
        id: item.id,
        to: item.path,
        label: item.label,
        visible: item.visible,
        order: item.sort_order,
        authRequired: ALWAYS_AUTH_PATHS.has(item.path) || Boolean(item.auth_required),
      }))
    : defaultNavItems;

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
