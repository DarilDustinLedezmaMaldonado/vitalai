/**
 * VitalAI - Plan de comidas base
 *
 * Plan diario por defecto. Cada usuario puede personalizarlo; su version se
 * guarda en usuarios/{uid}/configuracion/nutricion.
 */

import { Ionicons } from '@expo/vector-icons';

export interface Comida {
  id: string;
  momento: string;
  titulo: string;
  detalle: string;
  calorias: number;
  icono: keyof typeof Ionicons.glyphMap;
  alimentos: IngredientePlan[];
}

export interface IngredientePlan {
  alimentoId: string;
  gramos: number;
}

export const COMIDAS: Comida[] = [
  { id: 'desayuno', momento: 'Desayuno', titulo: 'Avena, fruta y huevo', detalle: 'Avena, leche, banana y huevo', calorias: 0, icono: 'sunny-outline', alimentos: [{ alimentoId: 'avena-seca', gramos: 40 }, { alimentoId: 'leche-dos-por-ciento', gramos: 200 }, { alimentoId: 'banana-cruda', gramos: 100 }, { alimentoId: 'huevo-crudo', gramos: 50 }] },
  { id: 'almuerzo', momento: 'Almuerzo', titulo: 'Pollo, quinua y ensalada', detalle: 'Pechuga, quinua, tomate, lechuga y aceite de oliva', calorias: 0, icono: 'restaurant-outline', alimentos: [{ alimentoId: 'pollo-pechuga-cruda', gramos: 150 }, { alimentoId: 'quinua-cocida', gramos: 150 }, { alimentoId: 'tomate-crudo', gramos: 100 }, { alimentoId: 'lechuga-cruda', gramos: 60 }, { alimentoId: 'aceite-oliva', gramos: 5 }] },
  { id: 'merienda', momento: 'Merienda', titulo: 'Yogur, manzana y almendras', detalle: 'Yogur natural, manzana y almendras', calorias: 0, icono: 'cafe-outline', alimentos: [{ alimentoId: 'yogur-natural', gramos: 170 }, { alimentoId: 'manzana-cruda', gramos: 120 }, { alimentoId: 'almendra-cruda', gramos: 15 }] },
  { id: 'cena', momento: 'Cena', titulo: 'Trucha, papa y ensalada', detalle: 'Trucha, papa cocida, tomate y lechuga', calorias: 0, icono: 'moon-outline', alimentos: [{ alimentoId: 'trucha-cocida', gramos: 150 }, { alimentoId: 'papa-cocida', gramos: 150 }, { alimentoId: 'tomate-crudo', gramos: 100 }, { alimentoId: 'lechuga-cruda', gramos: 60 }] },
];
