<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { prepareImage } from '@/lib/image';

const router = useRouter();
const session = useSessionStore();

const mode = ref<'idle' | 'camera'>('idle');
const busy = ref(false);
const error = ref<string | null>(null);
const videoEl = ref<HTMLVideoElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
let stream: MediaStream | null = null;

async function startCamera() {
  error.value = null;
  if (!navigator.mediaDevices?.getUserMedia) {
    error.value = 'Câmera não disponível neste navegador. Tente carregar uma foto.';
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false,
    });
    mode.value = 'camera';
    // aguarda o próximo tick para o <video> existir no DOM
    requestAnimationFrame(() => {
      if (videoEl.value) {
        videoEl.value.srcObject = stream;
        void videoEl.value.play();
      }
    });
  } catch {
    error.value = 'Não foi possível acessar a câmera. Verifique a permissão ou carregue uma foto.';
  }
}

function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}

async function capture() {
  if (!videoEl.value) return;
  busy.value = true;
  try {
    const prepared = await prepareImage(videoEl.value);
    session.setImage(prepared);
    stopCamera();
    router.push({ name: 'review' });
  } catch {
    error.value = 'Falha ao capturar a foto. Tente novamente.';
  } finally {
    busy.value = false;
  }
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  busy.value = true;
  error.value = null;
  try {
    const prepared = await prepareImage(file);
    session.setImage(prepared);
    router.push({ name: 'review' });
  } catch {
    error.value = 'Não foi possível ler essa imagem. Tente outra.';
  } finally {
    busy.value = false;
  }
}

onBeforeUnmount(stopCamera);
</script>

<template>
  <div>
    <p class="brand">Passo 1 de 2</p>
    <h1 class="title">Tire uma selfie</h1>
    <p class="subtitle">Para uma análise precisa, siga as dicas abaixo.</p>

    <div class="media-frame" v-if="mode === 'camera'">
      <video ref="videoEl" playsinline muted autoplay></video>
    </div>

    <div class="card" v-else>
      <ul class="hint-list">
        <li><span class="dot">✦</span><span>Retire os óculos.</span></li>
        <li><span class="dot">✦</span><span>Idealmente sem maquiagem.</span></li>
        <li><span class="dot">✦</span><span>Cabelo para trás, rosto livre.</span></li>
        <li><span class="dot">✦</span><span>Olhe para a câmera com expressão neutra.</span></li>
        <li><span class="dot">✦</span><span>Fique em luz natural e bem iluminada.</span></li>
      </ul>
    </div>

    <p v-if="error" class="error-box">{{ error }}</p>

    <div class="spacer" />

    <template v-if="mode === 'camera'">
      <button class="btn btn-primary" :disabled="busy" @click="capture">
        {{ busy ? 'Capturando…' : '📸 Capturar' }}
      </button>
      <button class="btn btn-ghost" :disabled="busy" @click="stopCamera(); mode = 'idle'">
        Cancelar
      </button>
    </template>

    <template v-else>
      <button class="btn btn-primary" :disabled="busy" @click="startCamera">📷 Tirar uma foto</button>
      <button class="btn btn-ghost" :disabled="busy" @click="fileInput?.click()">
        🖼️ Carregar uma foto
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onFile"
      />
    </template>

    <p class="notice">
      🔒 A imagem é processada apenas para gerar seu guia e não é armazenada em nossos servidores.
    </p>
  </div>
</template>
