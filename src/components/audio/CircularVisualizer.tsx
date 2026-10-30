import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Svg, { Line, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { Music } from 'lucide-react-native';
import { AppColors } from '@/constants/colors';

interface CircularVisualizerProps {
  isPlaying: boolean;
  position: number;       // in seconds
  thumbnailUri?: string | null;
  size?: number;          // diameter of whole visualizer
  barCount?: number;      // number of radial bars around circle
}

export const CircularVisualizer: React.FC<CircularVisualizerProps> = ({
  isPlaying,
  position,
  thumbnailUri,
  size = 280,
  barCount = 48,
}) => {
  const center = size / 2;
  const innerRadius = (size / 2) * 0.58; // inner disc radius ~81px for size 280
  const maxBarLength = (size / 2) * 0.36; // max bar height ~50px
  const minBarLength = 4;

  // Real-time animated bar heights
  const [barHeights, setBarHeights] = useState<number[]>(() =>
    Array(barCount).fill(minBarLength)
  );

  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const isPlayingRef = useRef(isPlaying);
  const positionRef = useRef(position);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    let active = true;

    const updateFrequencies = () => {
      if (!active) return;

      if (isPlayingRef.current) {
        phaseRef.current += 0.08;
        const t = positionRef.current * 4.0 + phaseRef.current;

        const nextHeights: number[] = [];
        for (let i = 0; i < barCount; i++) {
          // Normalized angular position around circle: 0 to 1
          const normAngle = i / barCount;
          
          // Mirror frequency bands symmetrically around the circle (like stereo spectrum analyzers)
          const freqIndex = normAngle <= 0.5 ? normAngle * 2 : (1 - normAngle) * 2;

          // Bass harmonics (heaviest at low frequencies)
          const bass = Math.sin(t * 1.5 + freqIndex * Math.PI) * 0.5 + 0.5;
          const bassKick = Math.pow(Math.sin(t * 2.8), 4) * (1 - freqIndex);

          // Mid-range vocal/synth oscillation
          const mids = Math.sin(t * 3.2 + i * 0.6) * 0.5 + 0.5;

          // Treble shimmer (higher speed flutter on upper frequencies)
          const treble = Math.cos(t * 5.5 + i * 1.2) * 0.5 + 0.5;

          // Blend frequencies according to spectrum bin
          let energy = 0;
          if (freqIndex < 0.35) {
            energy = bass * 0.6 + bassKick * 0.4;
          } else if (freqIndex < 0.7) {
            energy = mids * 0.7 + bass * 0.3;
          } else {
            energy = treble * 0.65 + mids * 0.35;
          }

          // Add subtle dynamic randomness for live music realism
          const jitter = (Math.sin(i * 13.37 + t * 4) * 0.15);
          const finalEnergy = Math.max(0.08, Math.min(1.0, energy + jitter));

          const length = minBarLength + finalEnergy * maxBarLength;
          nextHeights.push(length);
        }

        setBarHeights(nextHeights);
      } else {
        // Smoothly decay to resting minBarLength when paused
        setBarHeights(prev => {
          let hasDecayed = false;
          const decayed = prev.map(h => {
            if (h > minBarLength + 0.5) {
              hasDecayed = true;
              return h * 0.88;
            }
            return minBarLength;
          });
          return hasDecayed ? decayed : prev;
        });
      }

      animFrameRef.current = requestAnimationFrame(updateFrequencies);
    };

    animFrameRef.current = requestAnimationFrame(updateFrequencies);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [barCount, maxBarLength, minBarLength]);

  const discDiameter = innerRadius * 2 - 12;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* SVG Radial Frequency Bars */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00F0FF" />
            <Stop offset="50%" stopColor="#38BDF8" />
            <Stop offset="100%" stopColor="#A855F7" />
          </LinearGradient>
          <LinearGradient id="discGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(0, 240, 255, 0.4)" />
            <Stop offset="100%" stopColor="rgba(168, 85, 247, 0.2)" />
          </LinearGradient>
        </Defs>

        {/* Outer subtle glow ring behind bars */}
        <Circle
          cx={center}
          cy={center}
          r={innerRadius - 2}
          stroke="url(#discGlow)"
          strokeWidth={4}
          fill="none"
        />

        {/* 360-degree frequency bars */}
        {barHeights.map((length, i) => {
          const angle = (i / barCount) * 2 * Math.PI - Math.PI / 2; // start from top (12 o'clock)
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          const x1 = center + innerRadius * cos;
          const y1 = center + innerRadius * sin;
          const x2 = center + (innerRadius + length) * cos;
          const y2 = center + (innerRadius + length) * sin;

          // Give higher energy bars more opacity
          const opacity = Math.min(1.0, 0.45 + (length / maxBarLength) * 0.55);

          return (
            <Line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#barGradient)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeOpacity={opacity}
            />
          );
        })}
      </Svg>

      {/* Center Artwork Disc */}
      <View
        style={[
          styles.centerDisc,
          {
            width: discDiameter,
            height: discDiameter,
            borderRadius: discDiameter / 2,
          },
        ]}>
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={[
              styles.discImage,
              {
                width: discDiameter,
                height: discDiameter,
                borderRadius: discDiameter / 2,
              },
            ]}
          />
        ) : (
          <View style={styles.placeholderBox}>
            <Music size={42} color={AppColors.primary} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  centerDisc: {
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    elevation: 12,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  discImage: {
    resizeMode: 'cover',
  },
  placeholderBox: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#1E293B',
  },
});
