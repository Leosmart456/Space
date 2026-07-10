import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

interface PriceChartProps {
  width: number;
  height: number;
  positive?: boolean;
  data?: number[];
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

function generatePriceData(count: number): number[] {
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const rand = seededRandom(seed);
  const values: number[] = [100];
  for (let i = 1; i < count; i++) {
    const change = (rand() - 0.44) * 3;
    values.push(Math.max(85, Math.min(120, values[i - 1] + change)));
  }
  return values;
}

export function PriceChart({ width, height, positive = true, data: dataProp }: PriceChartProps) {
  const colors = useColors();
  const fallback = useMemo(() => generatePriceData(60), []);
  const data = dataProp && dataProp.length > 1 ? dataProp : fallback;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = { top: 8, bottom: 8, left: 0, right: 0 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((v, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + (1 - (v - min) / range) * chartH,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const fillPath =
    linePath +
    ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const lineColor = positive ? colors.primary : colors.destructive;
  const gradientId = "chartGrad";

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={fillPath} fill={`url(#${gradientId})`} />
        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Endpoint dot */}
        <Line
          x1={points[points.length - 1].x}
          y1={points[points.length - 1].y - 3}
          x2={points[points.length - 1].x}
          y2={points[points.length - 1].y + 3}
          stroke={lineColor}
          strokeWidth={0}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
