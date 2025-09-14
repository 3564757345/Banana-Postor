export type GenerationMode = 'summarize' | 'illustrate';

export interface InfographicSection {
  heading: string;
  text: string;
  illustrationPrompt: string;
  imageUrl?: string; 
}

export interface StructuredContent {
  title: string;
  posterStyle: string; // e.g., 'Minimalist & Modern', 'Corporate Blue'
  layout: string; // e.g., 'Single Column', 'Two Column Alternating'
  sections: InfographicSection[];
}

export interface PosterData extends StructuredContent {}

export interface Palette {
  name: string;
  bg: string; // Tailwind CSS class for display
  bgColor: string; // Actual hex color for download
  title:string;
  heading: string;
  text: string;
  accent: string;
}