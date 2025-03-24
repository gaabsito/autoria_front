<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMedidaCorporalStore } from '@/stores/MedidasCorporales'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import SectionContainer from '@/components/SectionContainer.vue'
//import bodyMeasurementImg from '@/assets/images/body-measurement.jpg' // Asegúrate de tener esta imagen

const medidaStore = useMedidaCorporalStore()
const { medidas, loading, error } = storeToRefs(medidaStore)

// Datos del formulario
const form = ref({
  medidaID: null as number | null,
  peso: null as number | null,
  altura: null as number | null,
  fechaRegistro: new Date().toISOString().substring(0, 10)
})

// Estado para mostrar el calendario
const fechaMenu = ref(false)

// Diálogo de confirmación para eliminar
const dialogDelete = ref(false)
const medidaToDelete = ref<{
  medidaID: number;
  peso: number;
  altura: number;
  fechaRegistro: string;
  imc?: number;
} | null>(null)

// Formatear fecha
const formatDate = (date: string | Date): string => {
  if (!date) return ''
  const dateObj = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  }).format(dateObj)
}

// Reglas de validación
const rules = {
  peso: [
    (v: any) => !!v || 'El peso es requerido',
    (v: any) => (parseFloat(v) > 0) || 'El peso debe ser mayor que 0',
    (v: any) => (parseFloat(v) >= 20 && parseFloat(v) <= 300) || 'El peso debe estar entre 20 y 300 kg'
  ],
  altura: [
    (v: any) => !!v || 'La altura es requerida',
    (v: any) => (parseFloat(v) > 0) || 'La altura debe ser mayor que 0',
    (v: any) => (parseFloat(v) >= 50 && parseFloat(v) <= 250) || 'La altura debe estar entre 50 y 250 cm'
  ]
}

// Cargar medidas al montar
onMounted(async () => {
  try {
    await medidaStore.fetchMedidas()
  } catch (err) {
    console.error('Error al cargar medidas:', err)
  }
})

// Calcular IMC
const calcularIMC = (peso: number | null, altura: number | null): string | null => {
  if (!peso || !altura) return null
  const alturaEnMetros = altura / 100
  return (peso / (alturaEnMetros * alturaEnMetros)).toFixed(1)
}

// Clasificación del IMC
const getIMCClass = (imc: number): string => {
  if (imc < 18.5) return 'text-blue'    // Bajo peso
  if (imc < 25) return 'text-success'   // Normal
  if (imc < 30) return 'text-warning'   // Sobrepeso
  return 'text-error'                   // Obesidad
}

// Guardar medida
const guardarMedida = async () => {
  try {
    // Validar datos
    if (!form.value.peso || !form.value.altura) {
      return
    }

    // Calcular IMC
    const imcValue = calcularIMC(form.value.peso, form.value.altura)
    const imc = imcValue ? parseFloat(imcValue) : null
    
    // Preparar datos
    const medidaData = {
      peso: form.value.peso,
      altura: form.value.altura,
      fechaRegistro: form.value.fechaRegistro,
      imc
    }
    
    // Guardar medida
    if (form.value.medidaID !== null) {
      // Actualizar medida existente
      await medidaStore.updateMedida(form.value.medidaID, medidaData)
    } else {
      // Crear nueva medida
      await medidaStore.addMedida(medidaData)
    }
    
    // Recargar medidas y resetear formulario
    await medidaStore.fetchMedidas()
    resetForm()
  } catch (err) {
    console.error('Error al guardar la medida:', err)
  }
}

// Resetear formulario
const resetForm = () => {
  form.value = {
    medidaID: null,
    peso: null,
    altura: null,
    fechaRegistro: new Date().toISOString().substring(0, 10)
  }
}

// Editar medida
const editarMedida = (medida: any) => {
  form.value = {
    medidaID: medida.medidaID,
    peso: medida.peso,
    altura: medida.altura,
    fechaRegistro: new Date(medida.fechaRegistro).toISOString().substring(0, 10)
  }
}

// Confirmar eliminación
const confirmarEliminar = (medida: any) => {
  medidaToDelete.value = medida
  dialogDelete.value = true
}

// Eliminar medida
const eliminarMedida = async () => {
  if (!medidaToDelete.value) return
  
  try {
    await medidaStore.deleteMedida(medidaToDelete.value.medidaID)
    dialogDelete.value = false
    medidaToDelete.value = null
    await medidaStore.fetchMedidas()
  } catch (err) {
    console.error('Error al eliminar la medida:', err)
  }
}
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- Hero Section -->
    <PageHeader 
      title="MEDIDAS CORPORALES"
      subtitle="Registra tu peso y altura para hacer seguimiento de tu progreso"
      :backgroundImage="bodyMeasurementImg"
    />
    
    <!-- Contenido principal -->
    <SectionContainer>
      <v-row>
        <!-- Formulario -->
        <v-col cols="12" md="6">
          <v-card class="mb-4 measurement-card">
            <v-card-title class="measurement-title">
              <v-icon start class="me-2">{{ form.medidaID !== null ? 'mdi-pencil' : 'mdi-scale-bathroom' }}</v-icon>
              {{ form.medidaID !== null ? 'Editar Medida' : 'Nueva Medida' }}
            </v-card-title>
            
            <v-card-text class="pa-4">
              <!-- Mensaje de error -->
              <v-alert v-if="error" type="error" closable class="mb-4">
                {{ error }}
              </v-alert>
              
              <v-form @submit.prevent="guardarMedida">
                <!-- Fecha -->
                <v-menu
                  v-model="fechaMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  min-width="auto"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="form.fechaRegistro"
                      label="Fecha"
                      prepend-inner-icon="mdi-calendar"
                      readonly
                      v-bind="props"
                      variant="outlined"
                      class="mb-4"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="form.fechaRegistro"
                    @update:model-value="fechaMenu = false"
                  ></v-date-picker>
                </v-menu>
                
                <!-- Peso -->
                <v-text-field
                  v-model.number="form.peso"
                  label="Peso (kg)"
                  type="number"
                  variant="outlined"
                  prepend-inner-icon="mdi-weight-kilogram"
                  :rules="rules.peso"
                  class="mb-4"
                ></v-text-field>
                
                <!-- Altura -->
                <v-text-field
                  v-model.number="form.altura"
                  label="Altura (cm)"
                  type="number"
                  variant="outlined"
                  prepend-inner-icon="mdi-human-male-height"
                  :rules="rules.altura"
                  class="mb-4"
                ></v-text-field>
                
                <!-- IMC calculado -->
                <v-text-field
                  v-if="form.peso && form.altura"
                  :model-value="calcularIMC(form.peso, form.altura)"
                  label="IMC (calculado)"
                  variant="outlined"
                  prepend-inner-icon="mdi-calculator"
                  readonly
                  class="mb-4"
                ></v-text-field>
                
                <!-- Botones -->
                <div class="d-flex justify-end">
                  <v-btn 
                    variant="text" 
                    color="grey" 
                    class="me-4" 
                    @click="resetForm"
                    :disabled="loading"
                  >
                    {{ form.medidaID !== null ? 'Cancelar' : 'Limpiar' }}
                  </v-btn>
                  <v-btn 
                    type="submit" 
                    color="primary" 
                    :loading="loading"
                    :disabled="loading || !form.peso || !form.altura"
                  >
                    {{ form.medidaID !== null ? 'Actualizar' : 'Guardar' }}
                  </v-btn>
                </div>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
        
        <!-- Lista de medidas -->
        <v-col cols="12" md="6">
          <v-card class="measurement-card">
            <v-card-title class="measurement-title">
              <v-icon start class="me-2">mdi-format-list-bulleted</v-icon>
              Historial de Medidas
            </v-card-title>
            
            <!-- Indicador de carga -->
            <div v-if="loading" class="text-center pa-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            
            <!-- Sin medidas -->
            <v-card-text v-else-if="medidas.length === 0" class="text-center pa-4">
              <v-icon size="64" color="grey-lighten-1" class="mb-2">mdi-scale-bathroom</v-icon>
              <p>No hay medidas registradas</p>
              <p class="text-subtitle-2 text-medium-emphasis">Registra tu primera medida para hacer seguimiento de tu progreso</p>
            </v-card-text>
            
            <!-- Lista de medidas -->
            <v-list v-else>
              <v-list-item
                v-for="medida in medidas"
                :key="medida.medidaID"
                :title="formatDate(medida.fechaRegistro)"
                :subtitle="`Peso: ${medida.peso} kg | Altura: ${medida.altura} cm`"
                class="measurement-item"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" class="me-2">
                    <v-icon color="white">mdi-scale-bathroom</v-icon>
                  </v-avatar>
                </template>
                
                <template v-slot:append>
                  <v-chip v-if="medida.imc" :color="getIMCClass(medida.imc)" class="me-4">
                    IMC: {{ medida.imc }}
                  </v-chip>
                  
                  <div class="d-flex">
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      class="me-2"
                      @click="editarMedida(medida)"
                      title="Editar"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      color="error"
                      @click="confirmarEliminar(medida)"
                      title="Eliminar"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </SectionContainer>
    
    <!-- Diálogo de confirmación para eliminar -->
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">¿Eliminar medida?</v-card-title>
        <v-card-text>
          ¿Estás seguro de que deseas eliminar esta medida del {{ medidaToDelete ? formatDate(medidaToDelete.fechaRegistro) : '' }}? Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="dialogDelete = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="elevated" @click="eliminarMedida">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/main.scss';

:deep(.v-field) {
  border-radius: $border-radius !important;
}

.v-btn {
  font-family: $font-family-base;
  border-radius: $border-radius;
}

.measurement-card {
  border-radius: $border-radius;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
}

.measurement-title {
  background-color: $primary-color;
  color: white;
  font-family: $font-family-base;
  padding: 1rem;
}

.measurement-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba($primary-color, 0.05);
  }
}

.text-success {
  color: #4CAF50 !important;
}

.text-warning {
  color: #FF9800 !important;
}

.text-error {
  color: #F44336 !important;
}

.text-blue {
  color: #2196F3 !important;
}

// Responsive
@media (max-width: 600px) {
  :deep(.v-card-title) {
    font-size: 1.1rem !important;
  }
  
  .measurement-item {
    .v-list-item__content {
      max-width: 70%;
    }
  }
}
</style>