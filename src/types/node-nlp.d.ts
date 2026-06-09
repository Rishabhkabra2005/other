declare module "node-nlp" {
  export class NlpManager {
    constructor(options?: {
      languages?: string[];
      forceNER?: boolean;
      autoSave?: boolean;
      [key: string]: unknown;
    });

    addDocument(language: string, utterance: string, intent: string): void;
    addAnswer(language: string, intent: string, answer: string): void;
    train(): Promise<void>;
    process(text: string, language?: string): Promise<unknown>;
  }
}
