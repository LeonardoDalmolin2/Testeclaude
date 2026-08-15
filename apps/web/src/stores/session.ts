import { defineStore } from 'pinia';
import type { ProfileAnswers, SupportedImageMediaType } from '@project/shared';

interface CapturedImage {
  dataUrl: string;
  base64: string;
  mediaType: SupportedImageMediaType;
}

interface SessionState {
  image: CapturedImage | null;
  /** true somente após pré-checagem local + remota aprovadas para a imagem atual. */
  photoApproved: boolean;
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
    photoApproved: false,
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
      this.photoApproved = false;
      this.resultHtml = null;
    },
    setPhotoApproved(approved: boolean) {
      this.photoApproved = approved;
    },
    setAnswers(answers: ProfileAnswers) {
      this.answers = answers;
    },
    setResult(html: string) {
      this.resultHtml = html;
    },
    reset() {
      this.image = null;
      this.photoApproved = false;
      this.answers = null;
      this.resultHtml = null;
    },
  },
});
