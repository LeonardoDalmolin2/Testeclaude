<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { PHOTO_REJECT_GUIDANCE } from '@project/shared';
import { checkPhoto } from '@/api/client';
import { checkImageLocally } from '@/lib/image';
import { useSessionStore } from '@/stores/session';

const router = useRouter();
const session = useSessionStore();

const checking = ref(false);
const feedback = ref<string | null>(null);
const isTechnicalError = ref(false);

const primaryCtaLabel = computed(() => {
  if (checking.value) return 'Analisando foto…';
  if (feedback.value && !isTechnicalError.value) return 'Tirar outra foto';
  return 'Continuar';
});

function retake() {
  session.reset();
  router.replace({ name: 'selfie' });
}

async function proceed() {
  if (checking.value || !session.image) return;

  // Já aprovada nesta sessão para a mesma imagem: não chama a API de novo.
  if (session.photoApproved) {
    router.push({ name: 'questions' });
    return;
  }

  // Se a última falha foi de qualidade (não técnica), o CTA principal vira "Tirar outra foto".
  if (feedback.value && !isTechnicalError.value) {
    retake();
    return;
  }

  checking.value = true;
  feedback.value = null;
  isTechnicalError.value = false;

  try {
    const local = await checkImageLocally(session.image.dataUrl);
    if (!local.approved) {
      session.setPhotoApproved(false);
      feedback.value = local.guidance;
      return;
    }

    const remote = await checkPhoto({
      imageBase64: session.image.base64,
      mediaType: session.image.mediaType,
    });

    if (!remote.approved) {
      session.setPhotoApproved(false);
      feedback.value = remote.guidance || PHOTO_REJECT_GUIDANCE.invalid_image;
      return;
    }

    session.setPhotoApproved(true);
    router.push({ name: 'questions' });
  } catch (err) {
    session.setPhotoApproved(false);
    isTechnicalError.value = true;
    feedback.value =
      err instanceof Error
        ? err.message
        : PHOTO_REJECT_GUIDANCE.service_unavailable;
  } finally {
    checking.value = false;
  }
}
</script>

<template>
  <div>
    <p class="brand">Analisando sua foto</p>
    <h1 class="title">Ficou boa?</h1>
    <p class="subtitle">
      Confira se o rosto está nítido e bem iluminado. Antes de continuar, validamos se a foto está
      apta para a análise.
    </p>

    <div class="media-frame">
      <img v-if="session.image" :src="session.image.dataUrl" alt="Sua selfie" />
    </div>

    <p v-if="checking" class="check-status">Verificando se a foto está apta…</p>
    <p v-else-if="feedback" class="error-box" role="alert">{{ feedback }}</p>

    <div class="spacer" />

    <button class="btn btn-primary" :disabled="checking" @click="proceed">
      {{ primaryCtaLabel }}
    </button>
    <button
      v-if="isTechnicalError"
      class="btn btn-ghost"
      :disabled="checking"
      @click="proceed"
    >
      Tentar novamente
    </button>
    <button class="btn btn-ghost" :disabled="checking" @click="retake">
      Tirar outra foto
    </button>
  </div>
</template>

<style scoped>
.check-status {
  margin: 14px 0 0;
  color: var(--c-muted);
  text-align: center;
  font-size: 14px;
}
</style>
