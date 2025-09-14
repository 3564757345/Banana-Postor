import type { Palette } from '../types';

export const palettes: Palette[] = [
  {
    name: 'Modern',
    bg: 'bg-white', 
    bgColor: '#ffffff',
    title: 'text-gray-900', 
    heading: 'text-gray-800', 
    text: 'text-gray-600', 
    accent: 'border-gray-300'
  },
  {
    name: 'Corporate',
    bg: 'bg-blue-900', 
    bgColor: '#1e3a8a',
    title: 'text-white', 
    heading: 'text-blue-200', 
    text: 'text-blue-100', 
    accent: 'border-blue-400'
  },
  {
    name: 'Playful',
    bg: 'bg-yellow-300', 
    bgColor: '#fde047',
    title: 'text-gray-800', 
    heading: 'text-pink-600', 
    text: 'text-gray-700', 
    accent: 'border-pink-500'
  },
  {
    name: 'Dark Mode',
    bg: 'bg-gray-800', 
    bgColor: '#1f2937',
    title: 'text-white', 
    heading: 'text-purple-300', 
    text: 'text-gray-300', 
    accent: 'border-purple-500'
  },
  {
    name: 'Forest',
    bg: 'bg-green-900',
    bgColor: '#14532d',
    title: 'text-white',
    heading: 'text-green-200',
    text: 'text-green-100',
    accent: 'border-green-400'
  },
  {
    name: 'Sunset',
    bg: 'bg-orange-100',
    bgColor: '#ffedd5',
    title: 'text-red-900',
    heading: 'text-orange-700',
    text: 'text-gray-800',
    accent: 'border-red-500'
  },
];

export const getInitialPalette = (styleSuggestion: string): Palette => {
    const s = styleSuggestion.toLowerCase();
    if (s.includes('corporate') || s.includes('blue')) return palettes[1];
    if (s.includes('vibrant') || s.includes('playful')) return palettes[2];
    if (s.includes('elegant') || s.includes('dark')) return palettes[3];
    if (s.includes('nature') || s.includes('forest') || s.includes('green')) return palettes[4];
    if (s.includes('warm') || s.includes('sunset')) return palettes[5];
    // Default to Modern
    return palettes[0];
};