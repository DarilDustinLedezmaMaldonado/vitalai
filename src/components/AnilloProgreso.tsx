/**
 * VitalAI - Anillos de progreso concentricos (estilo Google Fit)
 *
 * Cada anillo muestra valor/meta. Empieza arriba y avanza en sentido horario.
 * Si se supera la meta, el anillo queda completo. Sin animacion: la pantalla
 * de inicio se abre muchas veces al dia y el llenado se volveria ruido.
 */

import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { crearEstilos } from '@/constants/estilos';

export interface Anillo {
  valor: number;
  meta: number;
  color: string;
  pista: string;
}

interface AnilloProgresoProps {
  anillos: Anillo[];
  tamano?: number;
  grosor?: number;
  separacion?: number;
  children?: ReactNode;
}

export default function AnilloProgreso({
  anillos,
  tamano = 168,
  grosor = 14,
  separacion = 4,
  children,
}: AnilloProgresoProps) {
  const centro = tamano / 2;

  return (
    <View style={{ width: tamano, height: tamano }}>
      <Svg width={tamano} height={tamano}>
        {anillos.map((anillo, indice) => {
          const radio = centro - grosor / 2 - indice * (grosor + separacion);
          const circunferencia = 2 * Math.PI * radio;
          const fraccion = anillo.meta > 0 ? Math.min(1, Math.max(0, anillo.valor / anillo.meta)) : 0;
          return (
            <React.Fragment key={indice}>
              <Circle cx={centro} cy={centro} r={radio} stroke={anillo.pista} strokeWidth={grosor} fill="none" />
              {fraccion > 0 && (
                <Circle
                  cx={centro}
                  cy={centro}
                  r={radio}
                  stroke={anillo.color}
                  strokeWidth={grosor}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${circunferencia} ${circunferencia}`}
                  strokeDashoffset={circunferencia * (1 - fraccion)}
                  transform={`rotate(-90 ${centro} ${centro})`}
                />
              )}
            </React.Fragment>
          );
        })}
      </Svg>
      {children ? <View style={styles.centro}>{children}</View> : null}
    </View>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
  centro: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
