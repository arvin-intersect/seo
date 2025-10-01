"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface RadarChartProps {
  data: {
    label: string;
    score: number;
    maxScore?: number;
  }[];
  size?: number;
}

export default function RadarChart({ data, size = 300 }: RadarChartProps) {
  const [isAnimated, setIsAnimated] = useState(false);
  const center = size / 2;
  const radius = (size / 2) - 60; // Increased padding for labels
  const angleStep = (Math.PI * 2) / data.length;
  
  useEffect(() => {
    setIsAnimated(true);
  }, []);
  
  const getPoint = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };
  
  const polygonPoints = data
    .map((item, i) => {
      const point = getPoint(isAnimated ? item.score : 0, i);
      return `${point.x},${point.y}`;
    })
    .join(' ');
  
  const gridLevels = [20, 40, 60, 80, 100];
  
  return (
    <div className="relative">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <linearGradient id="radar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary-200)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--primary-100)" stopOpacity="0.3" />
          </linearGradient>
          <filter id="radar-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {gridLevels.map((level) => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={(level / 100) * radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        
        {data.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          );
        })}
        
        <motion.polygon
          points={polygonPoints}
          fill="url(#radar-gradient)"
          stroke="var(--primary-200)"
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          filter="url(#radar-glow)"
        />
        
        {data.map((item, i) => {
          const point = getPoint(item.score, i);
          return (
            <motion.circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="var(--primary-200)"
              stroke="white"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: isAnimated ? 1 : 0 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.3 }}
            />
          );
        })}
        
        {data.map((item, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelRadius = radius + 40;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          
          let textAnchor: "start" | "middle" | "end" = "middle";
          let dy = 0;
          
          if (x < center - 20) textAnchor = "end";
          else if (x > center + 20) textAnchor = "start";
          
          if (y < center - 20) dy = -5;
          else if (y > center + 20) dy = 5;
          
          return (
            <motion.g key={i}>
              <motion.text
                x={x}
                y={y + dy}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-xs fill-black-alpha-80 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 + i * 0.05 }}
                style={{ pointerEvents: 'none' }}
              >
                {item.label}
              </motion.text>
              <motion.text
                x={x}
                y={y + dy + 12}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-[10px] fill-primary-200 font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 + i * 0.05 }}
                style={{ pointerEvents: 'none' }}
              >
                {item.score}%
              </motion.text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}