<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

const router = useRouter();
const session = useSessionStore();

function retake() {
  session.reset();
  router.replace({ name: 'selfie' });
}

function proceed() {
  router.push({ name: 'questions' });
}
</script>

<template>
  <div>
    <p class="brand">Analisando sua foto</p>
    <h1 class="title">Ficou boa?</h1>
    <p class="subtitle">Confira se o rosto está nítido e bem iluminado antes de continuar.</p>

    <div class="media-frame">
      <img v-if="session.image" :src="session.image.dataUrl" alt="Sua selfie" />
    </div>

    <div class="spacer" />

    <button class="btn btn-primary" @click="proceed">Continuar</button>
    <button class="btn btn-ghost" @click="retake">Tirar outra foto</button>
  </div>
</template>
