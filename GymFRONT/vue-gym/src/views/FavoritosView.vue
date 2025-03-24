<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import SectionContainer from '@/components/SectionContainer.vue'
import FavoritosList from '@/components/FavoritosList.vue'
import heroImage from '@/assets/images/ejercicios.jpg' // Reutilizamos una imagen existente

const authStore = useAuthStore()
const router = useRouter()

// Verificar autenticación
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login?redirect=/favoritos')
  }
})
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- Hero Section -->
    <PageHeader
      title="Mis Favoritos"
      subtitle="Gestiona tus entrenamientos favoritos para acceder a ellos rápidamente"
      :backgroundImage="heroImage"
    />

    <!-- Contenido principal -->
    <SectionContainer>
      <FavoritosList />
    </SectionContainer>
  </v-container>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/main.scss';

.v-container {
  padding-bottom: 2rem !important;
}
</style>