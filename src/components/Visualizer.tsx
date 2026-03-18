import { useRef, useEffect, useCallback } from 'react';
import type { AudioAnalyzer } from '../audio/analyzer';

interface Props {
  analyzer: AudioAnalyzer | null;
  isPlaying: boolean;
  energy: number;
}

export function Visualizer({ analyzer, isPlaying, energy }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const smoothAmplitude = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;

    // Clear
    ctx.clearRect(0, 0, w, h);

    if (!analyzer || !isPlaying) {
      // Idle state: subtle pulsing rings
      const time = Date.now() / 2000;
      for (let i = 0; i < 3; i++) {
        const radius = 60 + i * 40 + Math.sin(time + i) * 10;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 - i * 0.03})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const fft = analyzer.getFFT();
    const waveform = analyzer.getWaveform();
    const amplitude = analyzer.getAmplitude();
    smoothAmplitude.current += (amplitude - smoothAmplitude.current) * 0.15;

    const baseRadius = Math.min(w, h) * 0.2;
    const maxRadius = Math.min(w, h) * 0.42;
    const energyFactor = energy / 100;

    // Background glow
    const glowRadius = baseRadius + smoothAmplitude.current * 200;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    gradient.addColorStop(0, `rgba(123, 47, 247, ${0.15 + smoothAmplitude.current * 0.3})`);
    gradient.addColorStop(0.5, `rgba(0, 240, 255, ${0.05 + smoothAmplitude.current * 0.15})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Radial FFT visualization
    const bars = fft.length / 2;
    for (let i = 0; i < bars; i++) {
      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
      const value = Math.pow(10, fft[i] / 20); // dB to linear
      const barLength = value * (maxRadius - baseRadius) * 2 * (0.5 + energyFactor * 0.5);

      const x1 = cx + Math.cos(angle) * baseRadius;
      const y1 = cy + Math.sin(angle) * baseRadius;
      const x2 = cx + Math.cos(angle) * (baseRadius + barLength);
      const y2 = cy + Math.sin(angle) * (baseRadius + barLength);

      const hue = 180 + (i / bars) * 60 + energyFactor * 30;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${0.4 + value * 0.6})`;
      ctx.lineWidth = Math.max(1, (w / bars) * 0.6);
      ctx.stroke();
    }

    // Central waveform ring
    ctx.beginPath();
    for (let i = 0; i < waveform.length; i++) {
      const angle = (i / waveform.length) * Math.PI * 2 - Math.PI / 2;
      const r = baseRadius + waveform[i] * 30 * (1 + energyFactor);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.5 + smoothAmplitude.current * 0.5})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner ring glow
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 159, 28, ${0.2 + smoothAmplitude.current * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Orbiting particles
    const time = Date.now() / 1000;
    const particleCount = 6 + Math.floor(energyFactor * 8);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + time * (0.2 + i * 0.05);
      const r = baseRadius * 0.7 + Math.sin(time * 2 + i) * 15 + smoothAmplitude.current * 40;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const size = 1.5 + smoothAmplitude.current * 3;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0
        ? `rgba(0, 240, 255, ${0.4 + smoothAmplitude.current * 0.6})`
        : `rgba(123, 47, 247, ${0.4 + smoothAmplitude.current * 0.6})`;
      ctx.fill();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [analyzer, isPlaying, energy]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
