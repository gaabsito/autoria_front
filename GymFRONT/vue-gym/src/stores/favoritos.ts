// src/stores/favoritos.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Favorito, FavoritoCreateDTO } from '@/types/Favorito'
import { useAuthStore } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7087'

export const useFavoritoStore = defineStore('favoritos', () => {
    const favoritos = ref<Favorito[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Obtener favoritos del usuario
    async function fetchFavoritos() {
        loading.value = true
        error.value = null
        try {
            const authStore = useAuthStore()
            if (!authStore.isAuthenticated) {
                favoritos.value = []
                return []
            }

            const response = await fetch(`${API_URL}/Favorito`, {
                headers: {
                    'Authorization': `Bearer ${authStore.token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Error al cargar favoritos')
            }

            const data = await response.json()
            favoritos.value = data
            return data
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido'
            favoritos.value = []
            throw e
        } finally {
            loading.value = false
        }
    }

    // Verificar si un entrenamiento está en favoritos
    async function checkFavorito(entrenamientoId: number) {
        try {
            const authStore = useAuthStore()
            if (!authStore.isAuthenticated) {
                return false
            }

            const response = await fetch(`${API_URL}/Favorito/exists/${entrenamientoId}`, {
                headers: {
                    'Authorization': `Bearer ${authStore.token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Error al verificar favorito')
            }

            return await response.json()
        } catch (e) {
            console.error('Error al verificar favorito:', e)
            return false
        }
    }

    // Añadir un entrenamiento a favoritos
    async function addFavorito(entrenamientoId: number) {
        loading.value = true
        error.value = null
        try {
            const authStore = useAuthStore()
            if (!authStore.isAuthenticated) {
                throw new Error('Debes iniciar sesión para añadir favoritos')
            }

            const dto: FavoritoCreateDTO = {
                entrenamientoID: entrenamientoId
            }

            const response = await fetch(`${API_URL}/Favorito`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dto)
            })

            if (!response.ok) {
                const errorData = await response.text()
                throw new Error(errorData || 'Error al añadir favorito')
            }

            // Actualizar la lista de favoritos
            await fetchFavoritos()
            return true
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido'
            throw e
        } finally {
            loading.value = false
        }
    }

    // Eliminar un entrenamiento de favoritos
    async function removeFavorito(entrenamientoId: number) {
        loading.value = true
        error.value = null
        try {
            const authStore = useAuthStore()
            if (!authStore.isAuthenticated) {
                throw new Error('Debes iniciar sesión para eliminar favoritos')
            }

            const response = await fetch(`${API_URL}/Favorito/${entrenamientoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const errorData = await response.text()
                throw new Error(errorData || 'Error al eliminar favorito')
            }

            // Actualizar la lista de favoritos
            favoritos.value = favoritos.value.filter(f => f.entrenamientoID !== entrenamientoId)
            return true
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido'
            throw e
        } finally {
            loading.value = false
        }
    }

    // Toggle favorito (añadir o eliminar)
    async function toggleFavorito(entrenamientoId: number) {
        const isFavorito = await checkFavorito(entrenamientoId)
        if (isFavorito) {
            return await removeFavorito(entrenamientoId)
        } else {
            return await addFavorito(entrenamientoId)
        }
    }

    return {
        favoritos,
        loading,
        error,
        fetchFavoritos,
        checkFavorito,
        addFavorito,
        removeFavorito,
        toggleFavorito
    }
})