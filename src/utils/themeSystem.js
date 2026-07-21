import { Leaf, Moon, Sparkles, Waves } from 'lucide-react';

export const THEMES = [
  { id: 'aurora-violet', label: 'Aurora Violet', Icon: Sparkles },
  { id: 'midnight-ocean', label: 'Midnight Ocean', Icon: Waves },
  { id: 'sunset-ember', label: 'Sunset Ember', Icon: Moon },
  { id: 'emerald-frost', label: 'Emerald Frost', Icon: Leaf },
];

export const normalizeTheme = (value) => {
  if (value === 'dark') return 'midnight-ocean';
  if (value === 'light' || value === 'contrast') return 'aurora-violet';
  return THEMES.some((theme) => theme.id === value) ? value : 'aurora-violet';
};

export const applyTheme = (nextTheme) => {
  const normalized = normalizeTheme(nextTheme);
  document.documentElement.setAttribute('data-theme', normalized);
  localStorage.setItem('conversa_theme', normalized);
  window.dispatchEvent(new CustomEvent('conversa-theme-change', { detail: normalized }));
};
