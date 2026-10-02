/**
 * VitalAI - Redaccion de respuestas a partir de las herramientas
 *
 * Cuando el coach usa una herramienta, la app redacta la respuesta con los
 * resultados exactos en lugar de pedirle al modelo una segunda consulta. Asi
 * cada mensaje gasta una sola consulta de la cuota gratuita, responde mas
 * rapido y los numeros siempre salen del motor nutricional.
 */

type Resultado = Record<string, any>;

export interface LlamadaEjecutada {
  nombre: string;
  resultado: Resultado;
}

const CONSEJOS = [
  'La proteína te ayuda a sentirte satisfecho por más tiempo.',
  'Registrar cada comida es el hábito que más predice el éxito.',
  'Las verduras suman volumen con pocas calorías: úsalas para no pasar hambre.',
  'Repartir la proteína entre tus comidas ayuda a cuidar tu masa muscular.',
];

function consejo(): string {
  return CONSEJOS[Math.floor(Math.random() * CONSEJOS.length)];
}

/** Nombre de alimento en minuscula para usarlo dentro de una frase. */
function enFrase(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

function lista(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

function redactarEstado(r: Resultado): string {
  const restante = Math.max(0, r.restante_kcal);
  const pendientes = (r.comidas_pendientes ?? []).map((c: string) => c.toLowerCase());
  return `Hoy llevas ${r.consumido_kcal} de ${r.meta_kcal} kcal (te quedan ${restante}), `
    + `${Math.round(r.proteina?.consumido_g ?? 0)} de ${r.proteina?.meta_g} g de proteína y ${r.agua_vasos} de 8 vasos de agua.`
    + (pendientes.length ? ` Te falta: ${lista(pendientes)}.` : '');
}

function redactarPlan(r: Resultado): string {
  const comidas = (r.comidas ?? []) as { momento: string; kcal: number; porciones: string[] }[];
  const detalle = comidas.map((c) => `${c.momento} (${c.kcal} kcal): ${lista(c.porciones)}.`).join(' ');
  return `${r.explicacion}${detalle ? ` ${detalle}` : ''}`;
}

function redactarProgreso(r: Resultado): string {
  if (!r.dias_registrados) return 'Aún no tienes días registrados. Registra tus comidas y tu peso para ver tu progreso.';
  const signo = r.cambio_kg > 0 ? '+' : '';
  return `Tu peso actual es ${r.peso_actual_kg} kg (${signo}${r.cambio_kg} kg desde el inicio) `
    + `y cumpliste tu meta el ${r.adherencia_porcentaje}% de ${r.dias_registrados} días registrados.`;
}

/** Redacta la respuesta de un turno a partir de las herramientas ejecutadas. */
export function redactarRespuesta(llamadas: LlamadaEjecutada[]): string {
  const frases: string[] = [];
  const errores = llamadas.filter((l) => l.resultado?.ok === false);
  const exitosas = llamadas.filter((l) => l.resultado?.ok !== false && !l.resultado?.nota);

  const alimentos = exitosas.filter((l) => l.nombre === 'registrar_alimento');
  if (alimentos.length) {
    const items = alimentos.map((l) => `${enFrase(String(l.resultado.registrado))} (${l.resultado.calorias} kcal)`);
    const ultimo = alimentos[alimentos.length - 1].resultado;
    const restante = ultimo.restante_kcal;
    frases.push(`Listo, registré ${lista(items)}.`);
    frases.push(restante >= 0
      ? `Llevas ${ultimo.total_hoy_kcal} kcal y te quedan ${restante}.`
      : `Llevas ${ultimo.total_hoy_kcal} kcal, ${-restante} por encima de tu meta; no pasa nada, mañana retomas el plan.`);
  }

  for (const l of exitosas) {
    const r = l.resultado;
    switch (l.nombre) {
      case 'marcar_comida_del_plan':
        frases.push(`Marqué esa comida del plan como hecha. Llevas ${r.total_hoy_kcal} kcal y te quedan ${Math.max(0, r.restante_kcal)}.`);
        break;
      case 'registrar_agua':
        frases.push(r.vasos_hoy >= 8 ? `¡Llevas ${r.vasos_hoy} vasos: meta de agua cumplida!` : `Listo, llevas ${r.vasos_hoy} de 8 vasos de agua.`);
        break;
      case 'registrar_peso':
        frases.push(`Guardé tu peso de hoy: ${r.peso_kg} kg.`);
        break;
      case 'deshacer_ultimo_alimento':
        frases.push(`Quité ${enFrase(String(r.quitado))}. Ahora llevas ${r.total_hoy_kcal} kcal.`);
        break;
      case 'estado_del_dia':
        // Si en el mismo mensaje se registro comida, los totales ya se dijeron.
        if (!alimentos.length) frases.push(redactarEstado(r));
        break;
      case 'plan_resto_del_dia':
        frases.push(redactarPlan(r));
        break;
      case 'resumen_progreso':
        frases.push(redactarProgreso(r));
        break;
    }
  }

  for (const l of errores) frases.push(`No pude completar una acción: ${l.resultado.motivo}`);
  if (alimentos.length && !errores.length) frases.push(consejo());
  return frases.join(' ') || 'Listo.';
}
