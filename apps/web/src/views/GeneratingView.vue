<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { generateDossier } from '@/api/client';

const router = useRouter();
const session = useSessionStore();
const error = ref<string | null>(null);

async function run() {
  error.value = null;
  if (!session.image || !session.answers) {
    router.replace({ name: 'selfie' });
    return;
  }
  try {
    const { html } = await generateDossier({
      imageBase64: session.image.base64,
      mediaType: session.image.mediaType,
      answers: session.answers,
    });
    session.setResult(html);
    router.replace({ name: 'result' });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro inesperado ao gerar o dossiê.';
  }
}

onMounted(run);
</script>

<template>
  <div class="center">
    <p class="brand">Quase lá</p>
    <h1 class="title">Criando seu dossiê…</h1>

    <template v-if="!error">
      <div class="loader" />
      <p class="subtitle">
        Nossa consultora de IA está analisando seu formato de rosto, subtom e contraste para montar
        um guia sob medida. Isso pode levar alguns segundos.
      </p>
    </template>

    <template v-else>
      <p class="error-box">{{ error }}</p>
      <div class="spacer" />
      <button class="btn btn-primary" @click="run">Tentar novamente</button>
      <button class="btn btn-ghost" @click="router.replace({ name: 'questions' })">
        Voltar às perguntas
      </button>
    </template>
  </div>
</template>
