declare global {
    interface Window {
      ai: {
        languageModel: {
          capabilities: () => Promise<{
            available: string;
            defaultTemperature: number;
            defaultTopK: number;
          }>;
          create: (options?: any) => Promise<any>;
        };
        writer: {
          create: (options?: {
            sharedContext?: string;
            tone?: string;
            signal?: AbortSignal;
          }) => Promise<{
            write: (content: string, options?: { 
              context?: string;
              signal?: AbortSignal;
            }) => Promise<string>;
            writeStreaming: (content: string, options?: {
              context?: string;
              signal?: AbortSignal;
            }) => AsyncIterableIterator<string>;
            destroy: () => void;
          }>;
        };
      };
      translation: {
        canTranslate: (options: {
          sourceLanguage: string;
          targetLanguage: string;
        }) => Promise<string>;
        createTranslator: (options: {
          sourceLanguage: string;
          targetLanguage: string;
        }) => Promise<{
          translate: (text: string) => Promise<string>;
        }>;
      };
    }
    const translation: Window['translation'];
  }
  
  export {};
  