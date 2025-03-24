// src/types/Favorito.ts
export interface Favorito {
    usuarioID: number;
    entrenamientoID: number;
    fechaAgregado: Date;
    tituloEntrenamiento?: string;
    imagenEntrenamiento?: string;
    dificultadEntrenamiento?: string;
}

export interface FavoritoCreateDTO {
    entrenamientoID: number;
}