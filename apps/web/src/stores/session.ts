import { defineStore } from 'pinia';
import type { ProfileAnswers, SupportedImageMediaType } from '@project/shared';

interface CapturedImage {
  dataUrl: string;
  base64: string;
  mediaType: SupportedImageMediaType;
}

interface SessionState {
  image: CapturedImage | null;
  answers: ProfileAnswers | null;
  resultHtml: string | null;
}

/**
 * Estado do fluxo (selfie → revisão → perguntas → dossiê).
 * Guarda a imagem APENAS em memória (nunca em localStorage / servidor).
 */
export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    image: null,
    answers: null,
    resultHtml: null,
  }),
  getters: {
    hasImage: (s) => s.image !== null,
    hasResult: (s) => s.resultHtml !== null,
  },
  actions: {
    setImage(image: CapturedImage) {
      this.image = image;
      this.resultHtml = null;
    },
    setAnswers(answers: ProfileAnswers) {
      this.answers = answers;
    },
    setResult(html: string) {
      this.resultHtml = html;
    },
    reset() {
      this.image = null;
      this.answers = null;
      this.resultHtml = null;
    },
  },
});
