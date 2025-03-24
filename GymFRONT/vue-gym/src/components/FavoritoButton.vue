<script setup lang="ts">
import { ref, onMounted, computed } from 'vue' // Añade computed
import { useAuthStore } from '@/stores/auth'
import { useFavoritoStore } from '@/stores/favoritos'
import { useRouter } from 'vue-router'

const props = defineProps<{
  workoutId: number // Cambia entrenamientoId por workoutId
  size?: string // small, medium, large
  showText?: boolean
}>()

const authStore = useAuthStore()
const favoritoStore = useFavoritoStore()
const router = useRouter()

const isFavorite = ref(false)
const loading = ref(false)

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await checkFavoriteStatus()
  }
})

async function checkFavoriteStatus() {
  try {
    isFavorite.value = await favoritoStore.checkFavorito(props.workoutId)
  } catch (error) {
    console.error('Error al verificar estado de favorito:', error)
  }
}

async function toggleFavorite() {
  if (!authStore.isAuthenticated) {
    router.push(`/login?redirect=/workouts/${props.workoutId}`)
    return
  }
  loading.value = true
  try {
    await favoritoStore.toggleFavorito(props.workoutId)
    isFavorite.value = await favoritoStore.checkFavorito(props.workoutId)
  } catch (error) {
    console.error('Error al cambiar estado de favorito:', error)
  } finally {
    loading.value = false
  }
}

// Determinar tamaño del botón según la prop size
const buttonSize = computed(() => {
  switch (props.size) {
    case 'small': return 'x-small'
    case 'large': return 'x-large'
    default: return 'medium'
  }
})
</script>

<template>
  <v-btn
    :icon="!props.showText"
    :text="props.showText"
    :size="buttonSize"
    :color="isFavorite ? 'error' : 'grey'"
    :loading="loading"
    :disabled="loading"
    @click="toggleFavorite"
    class="favorite-btn"
  >
    <v-icon>{{ isFavorite ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
    <span v-if="props.showText">{{ isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos' }}</span>
  </v-btn>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/main.scss';

.favorite-btn {
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}
</style>