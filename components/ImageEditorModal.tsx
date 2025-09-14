
import React, { useState, useEffect, useCallback } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import CanvasEditor from './CanvasEditor';
import { RegenerateIcon } from './icons/RegenerateIcon';

type EditMode = 'regenerate' | 'prompt' | 'inpaint';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageInfo: {
    sectionIndex: number;
    imageUrl: string;
    prompt: string;
  };
  posterStyle: string;
  onUpdateImage: (sectionIndex: number, newImageUrl: string) => void;
}

const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg z-20">
        <svg className="animate-spin h-8 w-8 text-brand-pink mb-4" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p className="text-white font-semibold">{message}</p>
    </div>
);

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, imageInfo, posterStyle, onUpdateImage }) => {
  const [mode, setMode] = useState<EditMode>('regenerate');
  const [newPrompt, setNewPrompt] = useState('');
  const [inpaintPrompt, setInpaintPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setMode('regenerate');
      setNewPrompt('');
      setInpaintPrompt('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleRegenerate = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage('Re-generating...');
    setError(null);
    try {
      const newImageUrl = await generateImage(imageInfo.prompt, posterStyle);
      onUpdateImage(imageInfo.sectionIndex, newImageUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate image.');
    } finally {
      setIsLoading(false);
    }
  }, [imageInfo, posterStyle, onUpdateImage, onClose]);

  const handleGenerateFromPrompt = useCallback(async () => {
    if (!newPrompt.trim()) {
        setError("Please enter a prompt.");
        return;
    }
    setIsLoading(true);
    setLoadingMessage('Generating...');
    setError(null);
    try {
      const newImageUrl = await generateImage(newPrompt, posterStyle);
      onUpdateImage(imageInfo.sectionIndex, newImageUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image from prompt.');
    } finally {
      setIsLoading(false);
    }
  }, [newPrompt, posterStyle, imageInfo.sectionIndex, onUpdateImage, onClose]);

  const handleInpaint = useCallback(async () => {
    if (!inpaintPrompt.trim()) {
        setError("Please describe the change you want to make.");
        return;
    }
    setIsLoading(true);
    setLoadingMessage('Applying edit...');
    setError(null);
    try {
      // For now, the canvas is a visual guide. The API uses the whole image + prompt.
      const newImageUrl = await editImage(imageInfo.imageUrl, inpaintPrompt);
      onUpdateImage(imageInfo.sectionIndex, newImageUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit image.');
    } finally {
      setIsLoading(false);
    }
  }, [inpaintPrompt, imageInfo, onUpdateImage, onClose]);


  if (!isOpen) return null;

  const renderContent = () => {
    switch (mode) {
      case 'regenerate':
        return (
          <div className="text-center">
            <p className="mb-4 text-gray-300">Re-generate the image using the original prompt:</p>
            <p className="mb-6 text-sm italic bg-gray-700 p-2 rounded-md">"{imageInfo.prompt}"</p>
            <button onClick={handleRegenerate} className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-semibold rounded-md text-black bg-brand-pink hover:bg-pink-400">
                <RegenerateIcon /> Re-generate Image
            </button>
          </div>
        );
      case 'prompt':
        return (
          <div>
            <label htmlFor="new-prompt" className="block text-sm font-medium text-gray-300 mb-2">Enter a new prompt</label>
            <textarea
              id="new-prompt"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="e.g., A vibrant abstract painting of a city at night"
              className="w-full h-24 p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-brand-pink focus:border-brand-pink"
            />
            <button onClick={handleGenerateFromPrompt} className="mt-4 w-full px-6 py-3 text-base font-semibold rounded-md text-black bg-brand-pink hover:bg-pink-400">
              Generate with New Prompt
            </button>
          </div>
        );
      case 'inpaint':
        return (
            <div>
                <p className="text-sm text-gray-400 mb-2">Draw a mask on the area you want to change, then describe the edit below.</p>
                <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-600">
                    <CanvasEditor imageUrl={imageInfo.imageUrl} />
                </div>
                <label htmlFor="inpaint-prompt" className="block text-sm font-medium text-gray-300 mb-2">Describe your edit</label>
                <input
                    id="inpaint-prompt"
                    type="text"
                    value={inpaintPrompt}
                    onChange={(e) => setInpaintPrompt(e.target.value)}
                    placeholder="e.g., Add a red hat on the person"
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-brand-pink focus:border-brand-pink"
                />
                 <button onClick={handleInpaint} className="mt-4 w-full px-6 py-3 text-base font-semibold rounded-md text-black bg-brand-pink hover:bg-pink-400">
                    Apply Edit
                </button>
            </div>
        )
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-brand-pink/50 rounded-xl shadow-2xl w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
        {isLoading && <LoadingSpinner message={loadingMessage} />}
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Edit Image</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            
            <div className="mb-4 border-b border-gray-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {(['regenerate', 'prompt', 'inpaint'] as EditMode[]).map((tab) => (
                    <button
                    key={tab}
                    onClick={() => setMode(tab)}
                    className={`${
                        mode === tab
                        ? 'border-brand-pink text-brand-pink'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize`}
                    >
                    {tab}
                    </button>
                ))}
                </nav>
            </div>
            
            {error && <div className="my-2 text-center text-red-300 bg-red-500/20 p-2 rounded-md text-sm">{error}</div>}

            <div className="min-h-[200px]">
                {renderContent()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
