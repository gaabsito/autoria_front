// src/types/MedidaCorporal.ts
export interface MedidaCorporal {
    medidaID: number;
    usuarioID: number;
    fechaRegistro: Date;
    peso: number;
    altura?: number;
}

export interface MedidaCorporalCreate {
    peso: number;
    altura?: number;
}

export interface MedidaCorporalUpdate {
    peso?: number;
    altura?: number;
}