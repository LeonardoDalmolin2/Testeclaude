<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getHealth } from '@/api/client';

const router = useRouter();
const apiStatus = ref<'checking' | 'ok' | 'error'>('checking');

onMounted(async () => {
  try {
    const health = await getHealth();
    apiStatus.value = health.status === 'ok' ? 'ok' : 'error';
  } catch {
    apiStatus.value = 'error';
  }
});

function start() {
  router.push({ name: 'selfie' });
}
</script>

<template>
  <div>
    <p class="brand">Estúdio de Visagismo</p>
    <h1 class="title">Seu guia de beleza,<br />feito para o seu rosto.</h1>
    <p class="subtitle">
      Tire uma selfie, responda algumas perguntas e receba um dossiê personalizado de visagismo,
      colorimetria e maquiagem — direto no seu celular.
    </p>

    <div class="card">
      <ul class="hint-list">
        <li><span class="dot">✦</span><span>Análise de formato de rosto, subtom e contraste.</span></li>
        <li><span class="dot">✦</span><span>Paleta de cores ideais com amostras e códigos.</span></li>
        <li><span class="dot">✦</span><span>Técnicas passo a passo e curadoria de produtos.</span></li>
      </ul>
    </div>

    <p class="notice">
      🔒 Sua foto é usada apenas para gerar este guia e <strong>não é armazenada</strong> nos nossos
      servidores. Ela é processada de forma transitória pelo serviço de análise de IA.
    </p>

    <div class="spacer" />

    <span class="badge">
      <span class="led" :class="{ ok: apiStatus === 'ok', err: apiStatus === 'error' }" />
      API:
      <template v-if="apiStatus === 'checking'">verificando…</template>
      <template v-else-if="apiStatus === 'ok'">online</template>
      <template v-else>offline</template>
    </span>

    <button class="btn btn-primary" style="margin-top: 12px" @click="start">Começar</button>
  </div>
</template>
