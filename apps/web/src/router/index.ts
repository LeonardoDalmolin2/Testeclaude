import { createRouter, createWebHistory } from 'vue-router';
import { useSessionStore } from '@/stores/session';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/selfie', name: 'selfie', component: () => import('@/views/SelfieView.vue') },
    {
      path: '/review',
      name: 'review',
      component: () => import('@/views/ReviewView.vue'),
      meta: { requiresImage: true },
    },
    {
      path: '/questions',
      name: 'questions',
      component: () => import('@/views/QuestionsView.vue'),
      meta: { requiresImage: true, requiresPhotoApproved: true },
    },
    {
      path: '/generating',
      name: 'generating',
      component: () => import('@/views/GeneratingView.vue'),
      meta: { requiresImage: true, requiresPhotoApproved: true },
    },
    {
      path: '/result',
      name: 'result',
      component: () => import('@/views/ResultView.vue'),
      meta: { requiresResult: true },
    },
  ],
});

// Guarda simples: sem imagem/resultado em memória, volta para o início do fluxo.
router.beforeEach((to) => {
  const session = useSessionStore();
  if (to.meta.requiresImage && !session.hasImage) return { name: 'selfie' };
  if (to.meta.requiresPhotoApproved && !session.photoApproved) return { name: 'review' };
  if (to.meta.requiresResult && !session.hasResult) return { name: 'home' };
  return true;
});

export { router };
