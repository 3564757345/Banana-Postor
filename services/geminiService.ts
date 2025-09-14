
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { StructuredContent, InfographicSection, PosterData, GenerationMode } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const contentSchema = {
    type: Type.OBJECT,
    properties: {
      title: { 
          type: Type.STRING, 
          description: "A concise, engaging title for the infographic." 
      },
      posterStyle: { 
          type: Type.STRING, 
          description: "Suggest a visual style like 'Minimalist & Modern', 'Corporate Blue', 'Vibrant & Playful', or 'Elegant Dark Mode'." 
      },
      layout: { 
          type: Type.STRING, 
          description: "Suggest a layout from this list: 'Single Column', 'Two Column Alternating', 'Grid', 'Cards'." 
      },
      sections: {
        type: Type.ARRAY,
        description: "The main content broken down into logical sections.",
        items: {
          type: Type.OBJECT,
          properties: {
            heading: { 
                type: Type.STRING, 
                description: "A short, descriptive heading for this section."
            },
            text: { 
                type: Type.STRING,
                description: "The text for this section. If the user wants a summary, this is the summarized text. Otherwise, it is the original text."
            },
            illustrationPrompt: { 
                type: Type.STRING,
                description: "A simple, clear prompt for an AI image generator to create a relevant icon or illustration. E.g., 'A simple flat design icon of a lightbulb'."
            },
          },
          required: ['heading', 'text', 'illustrationPrompt']
        }
      }
    },
    required: ['title', 'posterStyle', 'layout', 'sections']
};

export const structureAndIdeate = async (rawText: string, mode: GenerationMode): Promise<StructuredContent> => {
    
    const instructions = {
        summarize: `
        You are an expert infographic designer. Your task is to take the user's raw text and transform it into a plan for a visually appealing infographic poster.
        1.  **Analyze and Summarize:** Read the text, identify the main topic, and break it down into 3-5 logical sections. Create a concise title and a short summary for each section's text.
        2.  **Brainstorm Illustrations:** For each section, come up with a clear and simple illustration concept that visually represents the information. Describe this concept in a short prompt suitable for an AI image generator.
        3.  **Suggest Style and Layout:** Based on the content, suggest an overall visual style and a layout structure.
        Provide your response strictly in the requested JSON format.
        `,
        illustrate: `
        You are an expert infographic designer. Your task is to take the user's raw text and prepare it for a poster without altering the core text content.
        1. **Analyze and Sectionalize:** Read the text and break it down into 3-5 logical sections. For each section, use the user's original text. **DO NOT summarize or alter the original text for these sections.** Assign a short, descriptive heading to each section based on its content.
        2. **Create Title:** Generate a concise, engaging title for the entire infographic.
        3. **Brainstorm Illustrations:** For each section, create a clear and simple illustration concept that visually represents its text. Describe this concept in a short prompt for an AI image generator.
        4. **Suggest Style and Layout:** Based on the content, suggest an overall visual style and a layout structure.
        Provide your response strictly in the requested JSON format. The 'text' field for each section must contain the original, unaltered text provided by the user for that section.
        `
    };

    const systemInstruction = instructions[mode];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [{ text: rawText }]
            },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: contentSchema,
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("AI returned an empty response for content structure.");
        }
        const structuredData: StructuredContent = JSON.parse(jsonText);
        
        const validLayouts = ['Single Column', 'Two Column Alternating', 'Grid', 'Cards'];
        if (!validLayouts.includes(structuredData.layout)) {
            structuredData.layout = 'Single Column'; // Fallback to a default layout
        }

        return structuredData;
    } catch (error) {
        console.error("Error structuring content:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse AI response as JSON. The response may be incomplete or malformed.");
        }
        throw new Error("Failed to structure content from AI. Please check your API key and the Gemini API status.");
    }
};

export const generateImage = async (prompt: string, style: string): Promise<string> => {
    const fullPrompt = `${style} illustration style. ${prompt}. Clean background.`;
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/png',
                  aspectRatio: '1:1',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                return `data:image/png;base64,${base64ImageBytes}`;
            } else {
                throw new Error('No images were generated.');
            }
        } catch (error: any) {
            attempt++;
            const isRateLimitError = error?.error?.code === 429 || (error.message && error.message.includes('429'));
            
            if (isRateLimitError && attempt < maxRetries) {
                // Exponential backoff with jitter: 2^attempt * 1000ms + random ms
                const delay = (2 ** attempt) * 1000 + Math.random() * 1000;
                console.warn(`Rate limit hit for prompt "${prompt}". Retrying in ${Math.round(delay / 1000)}s... (Attempt ${attempt}/${maxRetries})`);
                await sleep(delay);
            } else {
                console.error(`Error generating image for prompt "${prompt}" after ${attempt} attempts:`, error);
                throw new Error(`Failed to generate an image for: "${prompt}"`);
            }
        }
    }
    throw new Error(`Failed to generate image for "${prompt}" after ${maxRetries} retries.`);
};

export const generateImagesForSections = async (
    sections: InfographicSection[], 
    style: string, 
    onProgress: (current: number, total: number) => void
): Promise<InfographicSection[]> => {
    const sectionsWithImages: InfographicSection[] = [];
    let counter = 0;
    const totalSections = sections.length;
    
    for (const section of sections) {
        counter++;
        onProgress(counter, totalSections);
        const imageUrl = await generateImage(section.illustrationPrompt, style);
        sectionsWithImages.push({
            ...section,
            imageUrl,
        });
        if (counter < totalSections) {
            await sleep(2000); 
        }
    }
    
    return sectionsWithImages;
};

const translationSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    heading: { type: Type.STRING },
                    text: { type: Type.STRING }
                },
                required: ['heading', 'text']
            }
        }
    },
    required: ['title', 'sections']
};

export const translateContent = async (posterData: PosterData, targetLanguage: 'English' | 'Chinese'): Promise<PosterData> => {
    const contentToTranslate = {
        title: posterData.title,
        sections: posterData.sections.map(s => ({ heading: s.heading, text: s.text }))
    };

    const systemInstruction = `
    You are an expert translator. Your task is to translate the provided JSON object's text fields ('title', 'heading', 'text') into ${targetLanguage}.
    - Do NOT change the structure of the JSON.
    - Provide your response strictly in the requested JSON format.
    - The translation should be accurate and natural-sounding.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [{ text: `Please translate this content: ${JSON.stringify(contentToTranslate)}` }]
            },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: translationSchema,
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("AI returned an empty response for translation.");
        }

        const translatedTextParts = JSON.parse(jsonText);

        const translatedPosterData: PosterData = {
            ...posterData,
            title: translatedTextParts.title,
            sections: posterData.sections.map((originalSection, index) => ({
                ...originalSection,
                heading: translatedTextParts.sections[index]?.heading || originalSection.heading,
                text: translatedTextParts.sections[index]?.text || originalSection.text,
            })),
        };

        return translatedPosterData;

    } catch (error) {
        console.error(`Error translating content to ${targetLanguage}:`, error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse translated AI response as JSON.");
        }
        throw new Error(`Failed to translate content to ${targetLanguage}.`);
    }
};

export const regenerateText = async (textToRewrite: string, context: string): Promise<string> => {
    const systemInstruction = `You are a creative copywriter. Rewrite the provided text to be more engaging, clear, or concise, based on the context. Respond with only the rewritten text, no extra formatting or explanations.`;
    const prompt = `Context: ${context}\n\nText to rewrite: "${textToRewrite}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
            },
        });
        const newText = response.text.trim();
        if (!newText) {
            throw new Error("AI returned an empty response for text regeneration.");
        }
        return newText;
    } catch (error) {
        console.error("Error regenerating text:", error);
        throw new Error("Failed to regenerate text from AI.");
    }
};

const dataUrlToParts = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        throw new Error("Invalid data URL format");
    }
    return { mimeType: match[1], data: match[2] };
};

export const editImage = async (imageDataUrl: string, prompt: string): Promise<string> => {
    try {
        const { mimeType, data } = dataUrlToParts(imageDataUrl);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data, mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const base64ImageBytes: string = imagePart.inlineData.data;
            const newMimeType = imagePart.inlineData.mimeType;
            return `data:${newMimeType};base64,${base64ImageBytes}`;
        } else {
            const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text);
            const failureReason = textPart?.text || "The model did not return an image. It might have refused the request due to safety policies.";
            throw new Error(`Image editing failed: ${failureReason}`);
        }

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred during image editing.");
    }
};
