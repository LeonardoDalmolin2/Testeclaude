<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { SKIN_TYPES, type ProfileAnswers, type SkinType } from '@project/shared';
import { useSessionStore } from '@/stores/session';

const router = useRouter();
const session = useSessionStore();

const SKIN_LABELS: Record<SkinType, string> = {
  oleosa: 'Oleosa',
  seca: 'Seca',
  mista: 'Mista',
  normal: 'Normal',
  sensivel: 'Sensível',
};

const BRAND_OPTIONS = ['Sephora', 'Océane', 'Fenty', 'NARS', 'Bruna Tavares', 'Nina Secrets'];

const form = reactive<ProfileAnswers>({
  age: 30,
  skinType: 'mista',
  stylePreference: 'Elegante / Natural Sofisticado (Clean Chic)',
  favoriteBrands: ['Sephora', 'Océane', 'Fenty'],
  mainGoal:
    'Valorizar a estrutura óssea e o olhar com acabamento natural e viçoso, sem aspecto pesado.',
});

function toggleBrand(brand: string) {
  const i = form.favoriteBrands.indexOf(brand);
  if (i >= 0) form.favoriteBrands.splice(i, 1);
  else form.favoriteBrands.push(brand);
}

function submit() {
  session.setAnswers({ ...form, favoriteBrands: [...form.favoriteBrands] });
  router.push({ name: 'generating' });
}
</script>

<template>
  <div>
    <p class="brand">Passo 2 de 2</p>
    <h1 class="title">Sobre você</h1>
    <p class="subtitle">Isso ajuda a personalizar o seu dossiê.</p>

    <form @submit.prevent="submit">
      <div class="field">
        <label for="age">Idade</label>
        <input id="age" v-model.number="form.age" type="number" min="12" max="99" required />
      </div>

      <div class="field">
        <label>Tipo de pele</label>
        <div class="chips">
          <span
            v-for="t in SKIN_TYPES"
            :key="t"
            class="chip"
            :class="{ active: form.skinType === t }"
            @click="form.skinType = t"
          >
            {{ SKIN_LABELS[t] }}
          </span>
        </div>
      </div>

      <div class="field">
        <label for="style">Preferência de estilo</label>
        <input id="style" v-model="form.stylePreference" type="text" required />
      </div>

      <div class="field">
        <label>Marcas de preferência</label>
        <div class="chips">
          <span
            v-for="b in BRAND_OPTIONS"
            :key="b"
            class="chip"
            :class="{ active: form.favoriteBrands.includes(b) }"
            @click="toggleBrand(b)"
          >
            {{ b }}
          </span>
        </div>
      </div>

      <div class="field">
        <label for="goal">Objetivo principal</label>
        <textarea id="goal" v-model="form.mainGoal" required></textarea>
      </div>

      <button class="btn btn-primary" type="submit">Gerar meu dossiê ✨</button>
    </form>
  </div>
</template>
