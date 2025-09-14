
import React from 'react';
import { MagicWandIcon } from './icons/MagicWandIcon';
import type { GenerationMode } from '../types';

interface InputFormProps {
  rawText: string;
  setRawText: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  generationMode: GenerationMode;
  setGenerationMode: (mode: GenerationMode) => void;
}

const InputForm: React.FC<InputFormProps> = ({ rawText, setRawText, onGenerate, isLoading, generationMode, setGenerationMode }) => {
  return (
    <div className="bg-gray-900 border border-brand-pink/30 rounded-xl p-6 shadow-lg backdrop-blur-sm">
      <label htmlFor="info-text" className="block text-lg font-semibold text-gray-200 mb-2">
        Enter your information here
      </label>
      <textarea
        id="info-text"
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Paste your article, notes, or any raw text here. For example: 'The sun is a star at the center of the Solar System. It is a nearly perfect sphere of hot plasma...'"
        className="w-full h-48 p-4 bg-black border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-brand-pink focus:border-brand-pink transition-shadow duration-200 resize-none"
        disabled={isLoading}
      />
      
      <fieldset className="mt-4">
        <legend className="block text-sm font-medium text-gray-300 mb-2">Generation Mode</legend>
        <div className="flex items-center gap-x-6">
          <div className="flex items-center gap-x-2">
            <input
              id="summarize-mode"
              name="generation-mode"
              type="radio"
              checked={generationMode === 'summarize'}
              onChange={() => setGenerationMode('summarize')}
              disabled={isLoading}
              className="h-4 w-4 border-gray-600 bg-gray-800 text-brand-pink focus:ring-brand-pink"
            />
            <label htmlFor="summarize-mode" className="block text-sm font-medium leading-6 text-gray-200">
              Summarize & Illustrate
            </label>
          </div>
          <div className="flex items-center gap-x-2">
            <input
              id="illustrate-mode"
              name="generation-mode"
              type="radio"
              checked={generationMode === 'illustrate'}
              onChange={() => setGenerationMode('illustrate')}
              disabled={isLoading}
              className="h-4 w-4 border-gray-600 bg-gray-800 text-brand-pink focus:ring-brand-pink"
            />
            <label htmlFor="illustrate-mode" className="block text-sm font-medium leading-6 text-gray-200">
              Illustrate & Arrange
            </label>
          </div>
        </div>
      </fieldset>

      <button
        onClick={onGenerate}
        disabled={isLoading || !rawText.trim()}
        className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-semibold rounded-md text-black bg-brand-pink hover:bg-pink-400 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-pink transition-all duration-200 transform hover:scale-105 disabled:scale-100"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <MagicWandIcon />
            Generate Poster
          </>
        )}
      </button>
    </div>
  );
};

export default InputForm;