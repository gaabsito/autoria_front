<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMedidaCorporalStore } from '@/stores/medidasCorporales'

const emit = defineEmits(['medidaAdded', 'medidaUpdated'])

const medidaStore = useMedidaCorporalStore()
const formMode = ref('create') // 'create' o 'edit'
const selectedMedidaId = ref<number | null>(null)

// Datos del formulario
const form = ref({
  peso: 70,
  altura: 170,
  porcentajeGrasaCorporal: null as number | null,
  perimetroCintura: null as number | null,
  notas: ''
})

// Mensajes de feedback
const error = ref('')
const success = ref('')





onMounted(async () => {
  try {
    // Cargar la última medida
    const ultimaMedida = await medidaStore.fetchUltimaMedida()
    if (ultimaMedida) {
      // Usar la altura de la última medida si está disponible
      form.value.altura = ultimaMedida.altura || 170
    }
  } catch (err) {
    console.error('Error al cargar la última medida:', err)
  }
})

// Guardar medida
const guardarMedida = async () => {
  error.value = ''
  success.value = ''
  
  // Validaciones
  if (!form.value.peso || form.value.peso < 20 || form.value.peso > 300) {
    error.value = 'Por favor, introduce un peso válido (entre 20 y 300 kg)'
    return
  }
  
  try {
    // Preparar datos
    const medidaData = {
      peso: form.value.peso,
      altura: form.value.altura,

    }
    
    if (formMode.value === 'create') {
      // Crear nueva medida
      await medidaStore.addMedida(medidaData)
      success.value = 'Medida guardada correctamente'
      emit('medidaAdded')
      
      // Limpiar campos opcionales pero mantener la altura
      const alturaAnterior = form.value.altura
      form.value = {
        peso: 70,
        altura: alturaAnterior,
        porcentajeGrasaCorporal: null,
        perimetroCintura: null,
        notas: ''
      }
    } else {
      // Actualizar medida existente
      if (selectedMedidaId.value) {
        await medidaStore.updateMedida(selectedMedidaId.value, medidaData)
        success.value = 'Medida actualizada correctamente'
        emit('medidaUpdated')
        cancelarEdicion()
      }
    }
  } catch (err) {
    console.error('Error:', err)
    error.value = err instanceof Error ? err.message : 'Error al guardar la medida'
  }
}

// Editar medida existente
const editarMedida = (medida) => {
  formMode.value = 'edit'
  selectedMedidaId.value = medida.medidaID
  
  // Rellenar formulario con datos existentes
  form.value = {
    peso: medida.peso,
    altura: medida.altura || 170,
    porcentajeGrasaCorporal: medida.porcentajeGrasaCorporal || null,
    perimetroCintura: medida.perimetroCintura || null,
    notas: medida.notas || ''
  }
}

// Cancelar edición
const cancelarEdicion = () => {
  formMode.value = 'create'
  selectedMedidaId.value = null
  
  // Resetear formulario pero mantener altura
  const alturaAnterior = form.value.altura
  form.value = {
    peso: 70,
    altura: alturaAnterior,
    porcentajeGrasaCorporal: null,
    perimetroCintura: null,
    notas: ''
  }
}

// Función para eliminar medida
const eliminarMedida = async (id) => {
  if (confirm('¿Estás seguro de que deseas eliminar esta medida?')) {
    try {
      await medidaStore.deleteMedida(id)
      success.value = 'Medida eliminada correctamente'
      emit('medidaAdded') // Emitir evento para actualizar la lista
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar la medida'
    }
  }
}
</script>

<template>
  <div class="medidas-corporales">
    <h2 class="titulo">{{ formMode === 'create' ? 'Registrar nueva medida' : 'Editar medida' }}</h2>
    
    <!-- Alertas -->
    <div v-if="error" class="alerta error">{{ error }}</div>
    <div v-if="success" class="alerta exito">{{ success }}</div>
    
    <div class="formulario">
      <!-- Medidas básicas -->
      <div class="campo">
        <label for="peso">Peso (kg):</label>
        <input 
          type="number" 
          id="peso" 
          v-model.number="form.peso" 
          min="20" 
          max="300" 
          step="0.1" 
          required
        />
      </div>
      
      <div class="campo">
        <label for="altura">Altura (cm):</label>
        <input 
          type="number" 
          id="altura" 
          v-model.number="form.altura" 
          min="100" 
          max="250"
        />
      </div>
      
    
      
      <!-- Botones -->
      <div class="botones">
        <button 
          v-if="formMode === 'edit'" 
          type="button" 
          class="btn-secundario" 
          @click="cancelarEdicion"
        >
          Cancelar
        </button>
        
        <button 
          type="button" 
          class="btn-primario" 
          @click="guardarMedida" 
          :disabled="medidaStore.loading"
        >
          {{ formMode === 'create' ? 'Guardar medida' : 'Actualizar medida' }}
        </button>
      </div>
    </div>
    
    <!-- Lista de medidas recientes -->
    <div v-if="medidaStore.medidas.length > 0" class="medidas-recientes">
      <h3>Medidas recientes</h3>
      
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Peso (kg)</th>
            <th>Altura (cm)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="medida in [...medidaStore.medidas].sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()).slice(0, 5)" :key="medida.medidaID">
            <td>{{ new Date(medida.fechaRegistro).toLocaleDateString() }}</td>
            <td>{{ medida.peso }}</td>
            <td>{{ medida.altura || '-' }}</td>

          
         
            <td class="acciones">
              <button class="btn-editar" @click="editarMedida(medida)">Editar</button>
              <button class="btn-eliminar" @click="eliminarMedida(medida.medidaID)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.medidas-corporales {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
}

.titulo {
  color: #e25401;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.alerta {
  padding: 10px 15px;
  margin-bottom: 15px;
  border-radius: 4px;
}

.error {
  background-color: #ffebee;
  color: #b71c1c;
  border-left: 4px solid #f44336;
}

.exito {
  background-color: #e8f5e9;
  color: #1b5e20;
  border-left: 4px solid #4caf50;
}

.formulario {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.campo {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}



.botones {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-primario {
  background-color: #e25401;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-primario:hover {
  background-color: #d24d01;
}

.btn-primario:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secundario {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.medidas-recientes {
  margin-top: 30px;
}

h3 {
  color: #e25401;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.acciones {
  display: flex;
  gap: 5px;
}

.btn-editar, .btn-eliminar {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-editar {
  background-color: #2196f3;
  color: white;
}

.btn-eliminar {
  background-color: #f44336;
  color: white;
}

@media (max-width: 768px) {
  .acciones {
    flex-direction: column;
    gap: 5px;
  }
  
  .btn-editar, .btn-eliminar {
    width: 100%;
  }
}
</style>