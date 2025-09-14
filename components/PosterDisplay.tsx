import React, { forwardRef } from 'react';
import type { PosterData, Palette } from '../types';
import { RegenerateIcon } from './icons/RegenerateIcon';
import { EditIcon } from './icons/EditIcon';

interface PosterDisplayProps {
  data: PosterData;
  layout: string;
  palette: Palette;
  regeneratingTextId: string | null;
  onTextUpdate: (newText: string, sectionIndex: number | 'title', field: 'heading' | 'text' | 'title') => void;
  onRegenerateText: (textId: string, textToRewrite: string, context: string) => void;
  onOpenImageEditor: (sectionIndex: number) => void;
}

const EditableText: React.FC<{
    textId: string;
    initialValue: string;
    onUpdate: (newValue: string) => void;
    onRegenerate: () => void;
    isRegenerating: boolean;
    context: string;
    as?: 'h2' | 'h3' | 'p';
    className?: string;
}> = ({ textId, initialValue, onUpdate, onRegenerate, isRegenerating, as = 'p', className = '' }) => {
    const Element = as;

    const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
        onUpdate(e.currentTarget.textContent || '');
    };

    return (
        <div className="group relative">
            <Element
                key={textId} // Force re-render if initialValue changes externally
                contentEditable
                suppressContentEditableWarning
                onBlur={handleBlur}
                className={`outline-none focus:ring-2 focus:ring-brand-pink focus:bg-pink-500/10 rounded-md px-1 -mx-1 ${className}`}
            >
                {initialValue}
            </Element>
            <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                title="Regenerate text with AI"
                className="absolute -top-1 -right-8 p-1.5 rounded-full bg-gray-700/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-pink hover:text-black disabled:opacity-50"
                aria-label="Regenerate text"
            >
                {isRegenerating ? (
                     <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                ) : (
                    <RegenerateIcon className="w-4 h-4" />
                )}
            </button>
        </div>
    );
};


const PosterDisplay = forwardRef<HTMLDivElement, PosterDisplayProps>((
    { data, layout, palette, onTextUpdate, onRegenerateText, regeneratingTextId, onOpenImageEditor }, ref
) => {
    
  if (!palette) return null;
  const styleClasses = palette;

  const renderLayout = () => {
    const sections = data.sections.map((section, index) => ({
      ...section,
      _id: `section-${index}`, // Unique identifier for each section
    }));

    switch (layout.toLowerCase().replace(/\s+/g, '-')) {
      case 'two-column-alternating':
        return (
          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={section._id} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className={`p-4 space-y-3 ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
                  <EditableText 
                    textId={`${section._id}-heading`}
                    initialValue={section.heading}
                    onUpdate={(newVal) => onTextUpdate(newVal, index, 'heading')}
                    onRegenerate={() => onRegenerateText(`${section._id}-heading`, section.heading, 'Section heading')}
                    isRegenerating={regeneratingTextId === `${section._id}-heading`}
                    as="h3"
                    context="Section heading"
                    className={`text-2xl font-bold ${styleClasses.heading}`}
                  />
                  <EditableText 
                    textId={`${section._id}-text`}
                    initialValue={section.text}
                    onUpdate={(newVal) => onTextUpdate(newVal, index, 'text')}
                    onRegenerate={() => onRegenerateText(`${section._id}-text`, section.text, 'Section content')}
                    isRegenerating={regeneratingTextId === `${section._id}-text`}
                    as="p"
                    context="Section content"
                    className={`${styleClasses.text}`}
                  />
                </div>
                <div className={`flex justify-center items-center relative group ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}>
                  <img src={section.imageUrl} alt={section.heading} className="rounded-lg shadow-lg max-h-64 object-cover" />
                  <button onClick={() => onOpenImageEditor(index)} className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-pink hover:text-black"><EditIcon /></button>
                </div>
              </div>
            ))}
          </div>
        );
      case 'grid':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => (
              <div key={section._id} className={`p-6 rounded-lg border ${styleClasses.accent} bg-black/5 flex flex-col`}>
                <div className="relative group mb-4">
                    <img src={section.imageUrl} alt={section.heading} className="rounded-md shadow-lg h-40 w-full object-cover" />
                    <button onClick={() => onOpenImageEditor(index)} className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-pink hover:text-black"><EditIcon /></button>
                </div>
                <div className="space-y-2">
                    <EditableText as="h3" textId={`${section._id}-heading`} initialValue={section.heading} onUpdate={(newVal) => onTextUpdate(newVal, index, 'heading')} onRegenerate={() => onRegenerateText(`${section._id}-heading`, section.heading, 'Grid item heading')} isRegenerating={regeneratingTextId === `${section._id}-heading`} context="Grid item heading" className={`text-xl font-bold ${styleClasses.heading}`} />
                    <EditableText as="p" textId={`${section._id}-text`} initialValue={section.text} onUpdate={(newVal) => onTextUpdate(newVal, index, 'text')} onRegenerate={() => onRegenerateText(`${section._id}-text`, section.text, 'Grid item content')} isRegenerating={regeneratingTextId === `${section._id}-text`} context="Grid item content" className={`${styleClasses.text} text-sm`} />
                </div>
              </div>
            ))}
          </div>
        );
      case 'cards':
         return (
            <div className="flex flex-col items-center gap-8">
                {sections.map((section, index) => (
                    <div key={section._id} className={`flex flex-col md:flex-row items-center gap-6 p-6 rounded-lg border ${styleClasses.accent} bg-black/5 w-full max-w-3xl shadow-lg`}>
                        <div className="flex-shrink-0 relative group">
                            <img src={section.imageUrl} alt={section.heading} className="rounded-lg shadow-md h-32 w-32 object-cover" />
                            <button onClick={() => onOpenImageEditor(index)} className="absolute top-1 right-1 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-pink hover:text-black"><EditIcon /></button>
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <EditableText as="h3" textId={`${section._id}-heading`} initialValue={section.heading} onUpdate={(newVal) => onTextUpdate(newVal, index, 'heading')} onRegenerate={() => onRegenerateText(`${section._id}-heading`, section.heading, 'Card heading')} isRegenerating={regeneratingTextId === `${section._id}-heading`} context="Card heading" className={`text-2xl font-bold ${styleClasses.heading}`} />
                            <EditableText as="p" textId={`${section._id}-text`} initialValue={section.text} onUpdate={(newVal) => onTextUpdate(newVal, index, 'text')} onRegenerate={() => onRegenerateText(`${section._id}-text`, section.text, 'Card content')} isRegenerating={regeneratingTextId === `${section._id}-text`} context="Card content" className={`${styleClasses.text}`} />
                        </div>
                    </div>
                ))}
            </div>
        );
      case 'single-column':
      default:
        return (
          <div className="space-y-8 flex flex-col items-center">
            {sections.map((section, index) => (
              <div key={section._id} className="text-center space-y-3">
                 <div className="flex justify-center items-center relative group mb-4">
                  <img src={section.imageUrl} alt={section.heading} className="rounded-lg shadow-lg h-48 w-48 object-cover" />
                  <button onClick={() => onOpenImageEditor(index)} className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-pink hover:text-black"><EditIcon /></button>
                </div>
                <EditableText as="h3" textId={`${section._id}-heading`} initialValue={section.heading} onUpdate={(newVal) => onTextUpdate(newVal, index, 'heading')} onRegenerate={() => onRegenerateText(`${section._id}-heading`, section.heading, 'Section heading')} isRegenerating={regeneratingTextId === `${section._id}-heading`} context="Section heading" className={`text-2xl font-bold ${styleClasses.heading}`} />
                <EditableText as="p" textId={`${section._id}-text`} initialValue={section.text} onUpdate={(newVal) => onTextUpdate(newVal, index, 'text')} onRegenerate={() => onRegenerateText(`${section._id}-text`, section.text, 'Section content')} isRegenerating={regeneratingTextId === `${section._id}-text`} context="Section content" className={`max-w-2xl mx-auto ${styleClasses.text}`} />
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div ref={ref} id="poster-to-download" className={`p-8 sm:p-12 rounded-xl shadow-2xl ${styleClasses.bg} border-4 ${styleClasses.accent} transition-colors duration-500`}>
      <header className="text-center mb-12">
        <EditableText 
            as="h2"
            textId="title-main-0"
            initialValue={data.title}
            onUpdate={(newVal) => onTextUpdate(newVal, 'title', 'title')}
            onRegenerate={() => onRegenerateText('title-main-0', data.title, 'Poster main title')}
            isRegenerating={regeneratingTextId === 'title-main-0'}
            context="Poster main title"
            className={`text-4xl sm:text-5xl font-extrabold ${styleClasses.title}`}
        />
      </header>
      <main>
        {renderLayout()}
      </main>
    </div>
  );
});

export default PosterDisplay;