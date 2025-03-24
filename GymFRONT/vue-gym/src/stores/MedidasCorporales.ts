import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MedidaCorporal, MedidaCorporalCreate, MedidaCorporalUpdate } from '@/types/MedidaCorporal'
import type { ApiResponse } from '@/types/ApiResponse'
import { useAuthStore } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7087'

export const useMedidaCorporalStore = defineStore('medidasCorporales', () => {
    const medidas = ref<MedidaCorporal[]>([])
    const ultimaMedida = ref<MedidaCorporal | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Obtener todas las medidas corporales del usuario
    async function fetchMedidas() {
        loading.value = true
        error.value = null
        try {
            const authStore = useAuthStore()
            if (!authStore.token) throw new Error('No autorizado')

            const response = await fetch(`${API_URL}/MedidaCorporal`, {
                headers: {
                    'Authorization': `Bearer ${authStore.token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Error al cargar las medidas corporales')
            }

            const data: ApiResponse<MedidaCorporal[]> = await response.json()
            
            if (!data.success) {
                throw new Error(data.message || 'Error al cargar las medidas corporales')
            }
            
            // Convertir fechas de string a Date
            const medidasConFechas = data.data?.map(medida => ({
                ...medida,
                fechaRegistro: new Date(medida.fechaRegistro)
            }))
            
            medidas.value = medidasConFechas || []
            return medidas.value
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido'
            medidas.value = []
            throw e
        } finally {
            loading.value = false
        }
    }

    // Obtener la última medida corporal del usuario
    async function fetchUltimaMedida() {
        loading.value = true
        error.value = null
        try {
            const authStore = useAuthStore()
            if (!authStore.token) throw new Error('No autorizado')

            const response = await fetch(`${API_URL}/MedidaCorporal/latest`, {
                headers: {
                    'Authorization': `Bearer ${authStore.token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Error al cargar la última medida corporal')
            }

            const data: ApiResponse<MedidaCorporal> = await response.json()
            
            if (!data.success || !data.data) {
                ultimaMedida.value = null
                return null
            }
            
            // Convertir fecha de string a Date
            const medidaConFecha = {
                ...data.data,
                fechaRegistro: new Date(data.data.fechaRegistro)
            }
            
            ultimaMedida.value = medidaConFecha
            return medidaConFecha
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido'
            ultimaMedida.value = null
            throw e
        } finally {
            loading.value = false
        }
    }

    // Añadir una nueva medida corporal
    async function addMedida(medida: MedidaCorporalCreate) {
        loading.value = true
        error.value = null
        try {
            const authStore = useAuthStore()
            if (!authStore.token) throw new Error('No autorizado')

            const response = await fetch(`${API_URL}/MedidaCorporal`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(medida)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Error al añadir la medida corporal')
            }

            const data: ApiResponse<MedidaCorporal> = await response.json()
            
            if (!data.success || !data.data) {
                throw new Error('Error al añadir la medida corporal')
            }
            
            // Convertir fecha de string a Date
            const nuevaMedida = {
                ...data.data,
                fechaRegistro: new Date(data.data.fechaRegistro)
            }
            
            // Actualizar la lista de medidas y la última medida
            medidas.value = [nuevaMedida, ...medidas.value]
            ultimaMedida.value = nuevaMedida
            
            return nuevaMedida
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido'
            throw e
        } finally {
            loading.value = false
        }
    }

    // Actualizar una medida corporal existente
    async function updateMedida(id: number, medida: MedidaCorporalUpdate) {
        loading.value = true
        error.value = null
        try {
            const authStore = useAuthStore()
            if (!authStore.token) throw new Error('No autorizado')

            const response = await fetch(`${API_URL}/MedidaCorporal/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(medida)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Error al actualizar la medida corporal')
            }

            // Actualizar la medida en la lista de medidas
            medidas.value = medidas.value.map(m => {
                if (m.medidaID === id) {
                    // Actualizar solo los campos proporcionados
                    return { ...m, ...medida }
                }
                return m
            })
            
            // Actualizar la última medida si es esta
            if (ultimaMedida.value && ultimaMedida.value.medidaID === id) {
                ultimaMedida.value = { ...ultimaMedida.value, ...medida }
            }
            
            return true
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido'
            throw e
        } finally {
            loading.value = false
        }
    }

    // Eliminar una medida corporal
    async function deleteMedida(id: number) {
        loading.value = true
        error.value = null
        try {
            const authStore = useAuthStore()
            if (!authStore.token) throw new Error('No autorizado')

            const response = await fetch(`${API_URL}/MedidaCorporal/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Error al eliminar la medida corporal')
            }

            // Eliminar la medida de la lista
            medidas.value = medidas.value.filter(m => m.medidaID !== id)
            
            // Si era la última medida, actualizar ultimaMedida
            if (ultimaMedida.value && ultimaMedida.value.medidaID === id) {
                // Buscar la nueva última medida
                const ultimasMedidas = [...medidas.value].sort((a, b) => 
                    b.fechaRegistro.getTime() - a.fechaRegistro.getTime()
                )
                ultimaMedida.value = ultimasMedidas.length > 0 ? ultimasMedidas[0] : null
            }
            
            return true
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido'
            throw e
        } finally {
            loading.value = false
        }
    }


    return {
        medidas,
        ultimaMedida,
        loading,
        error,
        fetchMedidas,
        fetchUltimaMedida,
        addMedida,
        updateMedida,
        deleteMedida,
    }
})