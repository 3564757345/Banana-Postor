
import React, { useState, useCallback, useRef } from 'react';

// html-to-image is loaded via a script tag in index.html and attached to the window
declare const htmlToImage: any;

import { structureAndIdeate, generateImagesForSections, translateContent, regenerateText } from './services/geminiService';
import type { PosterData, InfographicSection, Palette, GenerationMode } from './types';
import { palettes, getInitialPalette } from './styles/palettes';
import InputForm from './components/InputForm';
import LoadingIndicator from './components/LoadingIndicator';
import PosterDisplay from './components/PosterDisplay';
import ImageEditorModal from './components/ImageEditorModal';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { TranslateIcon } from './components/icons/TranslateIcon';


const App: React.FC = () => {
  const [rawText, setRawText] = useState<string>('');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('summarize');
  const [posterData, setPosterData] = useState<PosterData | null>(null);
  const [originalPosterData, setOriginalPosterData] = useState<PosterData | null>(null);
  const [translationsCache, setTranslationsCache] = useState<Record<string, PosterData>>({});
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'zh'>('en');
  const [selectedLayout, setSelectedLayout] = useState<string>('');
  const [selectedPalette, setSelectedPalette] = useState<Palette | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [regeneratingTextId, setRegeneratingTextId] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // State for the new image editor
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingImageInfo, setEditingImageInfo] = useState<{
    sectionIndex: number;
    imageUrl: string;
    prompt: string;
  } | null>(null);

  const posterRef = useRef<HTMLDivElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!rawText.trim()) {
      setError('Please enter some information to generate a poster.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setPosterData(null);
    setOriginalPosterData(null);
    setTranslationsCache({});
    setCurrentLanguage('en');
    setSelectedLayout('');
    setSelectedPalette(null);
    setLoadingProgress(0);

    try {
      setLoadingStep('Analyzing and structuring content...');
      setLoadingProgress(15);
      const structuredData = await structureAndIdeate(rawText, generationMode);
      
      setLoadingProgress(30);
      const handleImageProgress = (current: number, total: number) => {
        const imageGenerationProgress = (current / total) * 65;
        setLoadingProgress(30 + imageGenerationProgress);
        setLoadingStep(`Generating illustration ${current} of ${total}...`);
      };

      const sectionsWithImages: InfographicSection[] = await generateImagesForSections(
        structuredData.sections, 
        structuredData.posterStyle,
        handleImageProgress
      );

      setLoadingStep('Assembling the final poster...');
      setLoadingProgress(100);
      const finalPosterData: PosterData = {
        ...structuredData,
        sections: sectionsWithImages,
      };

      setPosterData(finalPosterData);
      setOriginalPosterData(finalPosterData); 
      setTranslationsCache({ en: finalPosterData }); 
      setSelectedLayout(finalPosterData.layout);
      setSelectedPalette(getInitialPalette(finalPosterData.posterStyle));

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please check the console and your API key.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
      setLoadingProgress(0);
    }
  }, [rawText, generationMode]);
  
  const handleDownload = useCallback(async () => {
    if (!posterRef.current || !selectedPalette) {
      console.error("Poster element or palette not found for download.");
      setError("Poster element or palette not found, cannot download.");
      return;
    }

    setIsDownloading(true);
    setError(null);
    try {
        const dataUrl = await htmlToImage.toPng(posterRef.current, { 
            quality: 0.98,
            pixelRatio: 2,
            backgroundColor: selectedPalette.bgColor,
        });
        const link = document.createElement('a');
        link.download = `${posterData?.title.replace(/[\s\W]+/g, '-').toLowerCase() || 'infographic'}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error('Failed to download poster:', err);
        setError('Could not download the poster. Please try again.');
    } finally {
        setIsDownloading(false);
    }
  }, [posterData, selectedPalette]);

  const handleLanguageToggle = useCallback(async () => {
    if (!posterData || !originalPosterData) return;

    const targetLang = currentLanguage === 'en' ? 'zh' : 'en';
    const targetLangName = targetLang === 'zh' ? 'Chinese' : 'English';

    if (translationsCache[targetLang]) {
        setPosterData(translationsCache[targetLang]);
        setCurrentLanguage(targetLang);
        return;
    }

    setIsTranslating(true);
    setError(null);
    try {
        const translatedData = await translateContent(originalPosterData, targetLangName);
        setTranslationsCache(prev => ({ ...prev, [targetLang]: translatedData }));
        setPosterData(translatedData);
        setCurrentLanguage(targetLang);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred during translation.');
    } finally {
        setIsTranslating(false);
    }
  }, [posterData, originalPosterData, currentLanguage, translationsCache]);

  // --- Editing Handlers ---

  const handleTextUpdate = useCallback((newText: string, sectionIndex: number | 'title', field: 'heading' | 'text' | 'title') => {
    setPosterData(currentData => {
        if (!currentData) return null;
        if (sectionIndex === 'title') {
            return { ...currentData, title: newText };
        }
        const sections = [...currentData.sections];
        // Ensure the field is valid for a section object
        if (field === 'heading' || field === 'text') {
            sections[sectionIndex] = { ...sections[sectionIndex], [field]: newText };
        }
        return { ...currentData, sections };
    });
  }, []);

  const handleRegenerateText = useCallback(async (textId: string, textToRewrite: string, context: string) => {
    setRegeneratingTextId(textId);
    setError(null);
    try {
      const newText = await regenerateText(textToRewrite, context);
      const [type, indexStr, field] = textId.split('-');
      
      if (type === 'title') {
        handleTextUpdate(newText, 'title', 'title');
      } else if (type === 'section') {
        const index = parseInt(indexStr, 10);
        handleTextUpdate(newText, index, field as 'heading' | 'text');
      }
    } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to regenerate text.');
    } finally {
      setRegeneratingTextId(null);
    }
  }, [handleTextUpdate]);

  const handleOpenImageEditor = useCallback((sectionIndex: number) => {
    if (!posterData) return;
    const section = posterData.sections[sectionIndex];
    setEditingImageInfo({
      sectionIndex,
      imageUrl: section.imageUrl || '',
      prompt: section.illustrationPrompt,
    });
    setIsEditorOpen(true);
  }, [posterData]);

  const handleUpdateImage = useCallback((sectionIndex: number, newImageUrl: string) => {
    setPosterData(currentData => {
        if (!currentData) return null;
        const sections = [...currentData.sections];
        sections[sectionIndex] = { ...sections[sectionIndex], imageUrl: newImageUrl };
        return { ...currentData, sections };
    });
  }, []);


  return (
    <div className="bg-black min-h-screen text-gray-200 p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-brand-pink">
            🍌 Banana Postor｜香蕉打印店
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Transform your text into a stunning, AI-powered infographic poster in seconds.
          </p>
        </header>

        <main className="w-full">
          <InputForm
            rawText={rawText}
            setRawText={setRawText}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            generationMode={generationMode}
            setGenerationMode={setGenerationMode}
          />
          {error && <div className="mt-4 text-center text-red-300 bg-red-500/20 p-3 rounded-lg">{error}</div>}
          
          {isLoading && <LoadingIndicator step={loadingStep} progress={loadingProgress} />}

          {posterData && !isLoading && selectedPalette && (
            <div className="mt-12">
               <h2 className="text-3xl font-bold text-center mb-2 text-white">Your Generated Infographic</h2>
               <p className="text-center text-gray-400 mb-6">Customize, edit, and download your poster!</p>
                
                <div className="bg-gray-900 border border-brand-pink/30 rounded-xl p-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <span className="font-semibold text-gray-300 mr-4">Layout:</span>
                        <div className="inline-flex flex-wrap gap-2 mt-2 md:mt-0">
                            {['Single Column', 'Two Column Alternating', 'Grid', 'Cards'].map(layout => (
                                <button
                                    key={layout}
                                    onClick={() => setSelectedLayout(layout)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                                        selectedLayout === layout 
                                        ? 'bg-brand-pink text-black font-semibold shadow-lg' 
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {layout}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="border-t md:border-t-0 md:border-l border-gray-700 h-px md:h-12 w-full md:w-px"></div>
                    <div>
                        <span className="font-semibold text-gray-300 mr-4">Palette:</span>
                        <div className="inline-flex flex-wrap gap-3 mt-2 md:mt-0">
                             {palettes.map(palette => (
                                <button
                                    key={palette.name}
                                    title={palette.name}
                                    onClick={() => setSelectedPalette(palette)}
                                    className={`h-8 w-8 rounded-full border-2 p-0.5 transition-transform transform hover:scale-110 focus:outline-none ${selectedPalette?.name === palette.name ? 'border-brand-pink ring-2 ring-brand-pink' : 'border-gray-600'}`}
                                >
                                   <div className={`h-full w-full rounded-full ${palette.bg} border border-white/10`}></div>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="border-t md:border-t-0 md:border-l border-gray-700 h-px md:h-12 w-full md:w-px"></div>
                    <div>
                        <button
                            onClick={handleLanguageToggle}
                            disabled={isTranslating || isLoading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-pink transition-all duration-200"
                        >
                            {isTranslating ? 'Translating...' : <><TranslateIcon />{currentLanguage === 'en' ? 'Translate to Chinese' : 'Translate to English'}</>}
                        </button>
                    </div>
                </div>

              <PosterDisplay 
                ref={posterRef} 
                data={posterData} 
                layout={selectedLayout} 
                palette={selectedPalette}
                onTextUpdate={handleTextUpdate}
                onRegenerateText={handleRegenerateText}
                regeneratingTextId={regeneratingTextId}
                onOpenImageEditor={handleOpenImageEditor}
              />

              <div className="mt-8 text-center">
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-transparent text-base font-semibold rounded-md text-black bg-brand-pink hover:bg-pink-400 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-pink transition-all duration-200"
                >
                    {isDownloading ? 'Downloading...' : <><DownloadIcon />Download Poster</>}
                </button>
            </div>

            </div>
          )}
        </main>
      </div>
      {isEditorOpen && editingImageInfo && (
        <ImageEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          imageInfo={editingImageInfo}
          posterStyle={posterData?.posterStyle || 'Minimalist'}
          onUpdateImage={handleUpdateImage}
        />
      )}
    </div>
  );
};

export default App;
