<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import LogoCanvas from '@/components/LogoCanvas.vue'

// Define los props
const props = defineProps({
  menuItems: {
    type: Array,
    default: () => []
  },
  authMenuItems: {
    type: Array,
    default: () => []
  },
  drawer: {
    type: Boolean,
    default: false
  }
});

// Define emisiones
const emit = defineEmits(['update:drawer']);
const authStore = useAuthStore()
const router = useRouter()

// Usa un getter/setter para drawer
const drawerLocal = ref(props.drawer);

// Función para actualizar drawer
const toggleDrawer = () => {
  drawerLocal.value = !drawerLocal.value;
  emit('update:drawer', drawerLocal.value);
};

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

// Añadimos el ítem de favoritos al menú
const authMenuItemsWithFavorites = [
  ...props.authMenuItems,
  { title: 'Mis Favoritos', icon: 'mdi-heart', route: '/favoritos' }
];
</script>

<template>
  <v-app-bar class="app-bar">
    <v-app-bar-nav-icon @click="toggleDrawer"></v-app-bar-nav-icon>
    <router-link to="/" class="app-bar__logo">
      <div class="logo-container">
        <LogoCanvas />
      </div>
    </router-link>

    <v-btn variant="text" to="/about" class="desktop-only">
      Sobre Nosotros
    </v-btn>
    
    <template v-if="!authStore.isAuthenticated">
      <v-btn variant="text" to="/login" class="desktop-only">
        Iniciar Sesión
      </v-btn>
    </template>
    
    <template v-else>
      <!-- Se ha eliminado el botón de Favoritos del header principal -->
      <v-btn variant="text" @click="handleLogout" class="desktop-only">
        Cerrar Sesión
      </v-btn>
    </template>
  </v-app-bar>

  <v-navigation-drawer v-model="drawerLocal" temporary>
    <v-list>
      <v-list-item v-for="item in props.menuItems" :key="item.title" :to="item.route" :prepend-icon="item.icon"
        :title="item.title"></v-list-item>

      <v-divider class="my-2"></v-divider>

      <template v-if="authStore.isAuthenticated">
        <!-- Usar los elementos del menú con favoritos incluidos -->
        <v-list-item v-for="item in authMenuItemsWithFavorites" :key="item.title" :to="item.route" :prepend-icon="item.icon"
          :title="item.title"></v-list-item>
        <v-list-item @click="handleLogout" prepend-icon="mdi-logout" title="Cerrar Sesión"></v-list-item>
      </template>
      <template v-else>
        <v-list-item to="/login" prepend-icon="mdi-login" title="Iniciar Sesión"></v-list-item>
        <v-list-item to="/register" prepend-icon="mdi-account-plus" title="Registrarse"></v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped lang="scss">
@import '@/assets/styles/main.scss';

.app-bar {
  background-color: $primary-color !important;
}

.app-bar__logo {
  color: white;
  font-weight: bold;
  text-decoration: none;
  font-size: 1.2rem;
}

.desktop-only {
  display: none;
}

@media (min-width: 768px) {
  .desktop-only {
    display: inline-flex;
  }
}
</style>