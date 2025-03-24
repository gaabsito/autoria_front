<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useFavoritoStore } from '@/stores/favoritos'
import { storeToRefs } from 'pinia'

const favoritoStore = useFavoritoStore()
const { favoritos, loading, error } = storeToRefs(favoritoStore)

// Filtros
const searchQuery = ref('')

onMounted(async () => {
  try {
    await favoritoStore.fetchFavoritos()
  } catch (err) {
    console.error('Error al cargar favoritos:', err)
  }
})

// Filtrar favoritos
const filteredFavoritos = computed(() => {
  return favoritos.value.filter(favorito => {
    return favorito.tituloEntrenamiento?.toLowerCase().includes(searchQuery.value.toLowerCase()) ?? false
  })
})

// Eliminar de favoritos
const removeFavorito = async (entrenamientoId: number) => {
  try {
    await favoritoStore.removeFavorito(entrenamientoId)
  } catch (err) {
    console.error('Error al eliminar favorito:', err)
  }
}

// Función para formatear fechas
const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString();
}

// Función para determinar el color de la dificultad
const getDifficultyColor = (difficulty: string | undefined): string => {
  if (!difficulty) return 'primary';
  
  switch (difficulty) {
    case 'Fácil': return 'success';
    case 'Media': return 'warning';
    case 'Difícil': return 'error';
    default: return 'primary';
  }
}
</script>

<template>
  <div class="favoritos-container">
    <!-- Filtros -->
    <v-text-field
      v-model="searchQuery"
      label="Buscar en favoritos"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      clearable
      hide-details
      class="mb-4"
    ></v-text-field>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center my-4">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Empty State -->
    <v-alert v-else-if="favoritos.length === 0" type="info" class="mb-4">
      No tienes entrenamientos favoritos todavía.
    </v-alert>

    <!-- No Results After Filtering -->
    <v-alert v-else-if="filteredFavoritos.length === 0" type="info" class="mb-4">
      No se encontraron resultados con el filtro aplicado.
    </v-alert>

    <!-- Favoritos List -->
    <v-row v-else>
      <v-col
        v-for="favorito in filteredFavoritos"
        :key="favorito.entrenamientoID"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="h-100 favorito-card">
          <v-img
            :src="favorito.imagenEntrenamiento || '/api/placeholder/400/300'"
            height="200"
            cover
            class="bg-grey-lighten-2"
          ></v-img>

          <v-card-title class="text-truncate">
            {{ favorito.tituloEntrenamiento }}
          </v-card-title>

          <v-card-subtitle>
            <v-chip :color="getDifficultyColor(favorito.dificultadEntrenamiento)" size="small" class="mr-2">
              {{ favorito.dificultadEntrenamiento }}
            </v-chip>
            <small>Agregado: {{ formatDate(favorito.fechaAgregado) }}</small>
          </v-card-subtitle>

          <v-card-actions>
            <v-btn
              variant="text"
              color="error"
              @click="removeFavorito(favorito.entrenamientoID)"
            >
              <v-icon start>mdi-heart-off</v-icon>
              Quitar
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              color="primary"
              :to="`/workouts/${favorito.entrenamientoID}`"
            >
              Ver más
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/main.scss';

.favoritos-container {
  padding: 1rem 0;
}

.favorito-card {
  border-radius: $border-radius;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
  
  .v-card-title {
    font-family: $font-family-base;
    font-weight: 500;
  }
  
  .v-card-subtitle {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
}

.v-btn {
  font-family: $font-family-base;
  border-radius: $border-radius;
}

:deep(.v-field) {
  border-radius: $border-radius !important;
}
</style>