<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

const router = useRouter();
const session = useSessionStore();

const html = computed(() => session.resultHtml ?? '');

function download() {
  const blob = new Blob([html.value], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dossie-visagismo.html';
  a.click();
  URL.revokeObjectURL(url);
}

function restart() {
  session.reset();
  router.replace({ name: 'home' });
}
</script>

<template>
  <div>
    <div class="topbar">
      <p class="brand" style="margin: 0">Seu dossiê</p>
      <button class="link-btn" @click="restart">Recomeçar</button>
    </div>

    <iframe
      class="result-frame"
      :srcdoc="html"
      title="Dossiê de Visagismo"
      sandbox="allow-same-origin"
    ></iframe>

    <button class="btn btn-primary" style="margin-top: 14px" @click="download">
      ⬇️ Baixar como HTML
    </button>
  </div>
</template>
