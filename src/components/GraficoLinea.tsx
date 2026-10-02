/**
 * VitalAI - Grafico de linea (estilo Google Fit)
 *
 * Linea suave con area tenue debajo, puntos en cada registro y el ultimo
 * valor resaltado. Se adapta al ancho disponible (onLayout), asi que
 * funciona igual con 2 o con 30 registros.
 */

import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

export interface PuntoGrafico {
  etiqueta: string;
  valor: number;
}

interface GraficoLineaProps {
  puntos: PuntoGrafico[];
  alto?: number;
  color?: string;
  unidad?: string;
}

const MARGEN_X = 12;
const MARGEN_Y = 16;

export default function GraficoLinea({ puntos, alto = 150, color = Colors.marca, unidad = '' }: GraficoLineaProps) {
  const [ancho, setAncho] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setAncho(e.nativeEvent.layout.width);

  const valores = puntos.map((p) => p.valor);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const rango = maximo - minimo || 1;
  const x = (i: number) => (puntos.length === 1 ? ancho / 2 : MARGEN_X + (i * (ancho - 2 * MARGEN_X)) / (puntos.length - 1));
  const y = (v: number) => MARGEN_Y + (1 - (v - minimo) / rango) * (alto - 2 * MARGEN_Y);

  const linea = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.valor)}`).join(' ');
  const area = `${linea} L ${x(puntos.length - 1)} ${alto} L ${x(0)} ${alto} Z`;
  const ultimo = puntos[puntos.length - 1];
  // Con muchos puntos, solo se rotulan algunos para que no se encimen.
  const cadaCuanto = Math.ceil(puntos.length / 6);

  return (
    <View onLayout={onLayout}>
      {ancho > 0 && puntos.length > 0 && (
        <>
          <View style={styles.valorActual}>
            <Text style={styles.valorNumero}>{ultimo.valor}</Text>
            <Text style={styles.valorUnidad}> {unidad}</Text>
          </View>
          <Svg width={ancho} height={alto}>
            <Defs>
              <LinearGradient id="relleno" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.18} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {[0, 0.5, 1].map((f) => (
              <Line key={f} x1={0} x2={ancho} y1={MARGEN_Y + f * (alto - 2 * MARGEN_Y)} y2={MARGEN_Y + f * (alto - 2 * MARGEN_Y)} stroke={Colors.divider} strokeWidth={1} />
            ))}
            {puntos.length > 1 && <Path d={area} fill="url(#relleno)" />}
            {puntos.length > 1 && <Path d={linea} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
            {puntos.map((p, i) => (
              <Circle key={i} cx={x(i)} cy={y(p.valor)} r={i === puntos.length - 1 ? 5 : 3} fill={i === puntos.length - 1 ? color : Colors.surface} stroke={color} strokeWidth={2} />
            ))}
          </Svg>
          <View style={[styles.ejeX, { width: ancho }]}>
            {puntos.map((p, i) => (i % cadaCuanto === 0 || i === puntos.length - 1) && (
              <Text key={i} style={[styles.etiqueta, { left: x(i) - 20 }]}>{p.etiqueta}</Text>
            ))}
          </View>
          <Text style={styles.rango}>Mín. {minimo} · Máx. {maximo} {unidad}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  valorActual: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  valorNumero: { ...Typography.subtitle, color: Colors.textPrimary },
  valorUnidad: { ...Typography.caption, color: Colors.textSecondary },
  ejeX: { height: 20, position: 'relative' },
  etiqueta: { ...Typography.caption, fontSize: 12, color: Colors.textMuted, position: 'absolute', width: 40, textAlign: 'center' },
  rango: { ...Typography.caption, fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
