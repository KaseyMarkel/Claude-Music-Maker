import { useRef, useEffect, useCallback } from 'react';
import type { AudioAnalyzer } from '../audio/analyzer';
import type { VisualizerMod } from '../types';

interface Props {
  analyzer: AudioAnalyzer | null;
  isPlaying: boolean;
  energy: number;
  onInteraction?: (mod: VisualizerMod) => void;
}

const NUM_PETALS = 12;
const DEFORM_DECAY = 0.994;

export function Visualizer({ analyzer, isPlaying, energy, onInteraction }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const smoothAmplitude = useRef(0);
  const deformation = useRef<number[]>(new Array(NUM_PETALS).fill(0));
  const isDragging = useRef(false);
  const rotation = useRef(0);
  const bassSmooth = useRef(0);

  // Mouse/touch interaction
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerInteraction(e);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    handlePointerInteraction(e);
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  function handlePointerInteraction(e: React.PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const mx = e.clientX - rect.left - cx;
    const my = e.clientY - rect.top - cy;

    // Polar coordinates
    let angle = Math.atan2(my, mx);
    if (angle < 0) angle += Math.PI * 2;

    // Subtract current rotation to find which petal
    let adjustedAngle = angle - rotation.current;
    while (adjustedAngle < 0) adjustedAngle += Math.PI * 2;
    while (adjustedAngle >= Math.PI * 2) adjustedAngle -= Math.PI * 2;

    const petalIndex = Math.floor((adjustedAngle / (Math.PI * 2)) * NUM_PETALS) % NUM_PETALS;
    const dist = Math.sqrt(mx * mx + my * my);
    const maxDist = Math.min(cx, cy) * 0.9;
    const normalizedDist = Math.min(1, dist / maxDist);

    // Set deformation: pull outward based on distance from center
    const deformAmount = normalizedDist * 1.5 - 0.3;
    deformation.current[petalIndex] = Math.max(-0.5, Math.min(1.5, deformAmount));

    // Also affect adjacent petals (smooth the deformation)
    const prev = (petalIndex - 1 + NUM_PETALS) % NUM_PETALS;
    const next = (petalIndex + 1) % NUM_PETALS;
    deformation.current[prev] = deformation.current[prev] * 0.5 + deformAmount * 0.5;
    deformation.current[next] = deformation.current[next] * 0.5 + deformAmount * 0.5;

    // Compute audio feedback
    if (onInteraction) {
      const avg = deformation.current.reduce((a, b) => a + b, 0) / NUM_PETALS;
      const maxDeform = Math.max(...deformation.current);
      const variance = deformation.current.reduce((s, d) => s + (d - avg) ** 2, 0) / NUM_PETALS;
      onInteraction({
        filterMod: avg * 0.6,
        reverbMod: Math.min(1, variance * 2),
        energyMod: maxDeform * 0.2,
      });
    }
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Decay deformation slowly
    for (let i = 0; i < NUM_PETALS; i++) {
      deformation.current[i] *= DEFORM_DECAY;
      if (Math.abs(deformation.current[i]) < 0.001) deformation.current[i] = 0;
    }

    const energyFactor = energy / 100;
    const time = Date.now() / 1000;

    // Slowly rotate
    rotation.current += 0.003 + energyFactor * 0.005;

    let fft: Float32Array | null = null;
    let waveform: Float32Array | null = null;
    let amplitude = 0;
    let bassEnergy = 0;

    if (analyzer && isPlaying) {
      fft = analyzer.getFFT();
      waveform = analyzer.getWaveform();
      amplitude = analyzer.getAmplitude();
      // Bass energy: average of low FFT bins
      if (fft) {
        let bassSum = 0;
        const bassBins = Math.floor(fft.length * 0.1);
        for (let i = 0; i < bassBins; i++) {
          bassSum += Math.pow(10, fft[i] / 20);
        }
        bassEnergy = bassSum / bassBins;
      }
    }

    smoothAmplitude.current += (amplitude - smoothAmplitude.current) * 0.15;
    bassSmooth.current += (bassEnergy - bassSmooth.current) * 0.1;

    const baseRadius = Math.min(w, h) * 0.15;
    const maxRadius = Math.min(w, h) * 0.42;
    const amp = smoothAmplitude.current;

    // ---- Background glow ----
    const glowR = baseRadius * 2 + amp * 200 + bassSmooth.current * 150;
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    bgGrad.addColorStop(0, `rgba(123, 47, 247, ${0.08 + amp * 0.2})`);
    bgGrad.addColorStop(0.4, `rgba(0, 240, 255, ${0.03 + amp * 0.1})`);
    bgGrad.addColorStop(0.7, `rgba(244, 63, 94, ${0.02 + energyFactor * 0.05})`);
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ---- Draw petals ----
    const petalAngle = (Math.PI * 2) / NUM_PETALS;

    for (let i = 0; i < NUM_PETALS; i++) {
      const angle = i * petalAngle + rotation.current;

      // Get FFT data for this petal's frequency range
      let fftValue = 0.3;
      if (fft) {
        const binsPerPetal = Math.floor(fft.length / 2 / NUM_PETALS);
        let sum = 0;
        for (let b = 0; b < binsPerPetal; b++) {
          sum += Math.pow(10, fft[i * binsPerPetal + b] / 20);
        }
        fftValue = sum / binsPerPetal;
      }

      const deform = deformation.current[i];

      // Petal length driven by FFT + energy + deformation
      const petalLen = baseRadius + (fftValue * (maxRadius - baseRadius) * 1.5 * (0.4 + energyFactor * 0.6))
        + deform * maxRadius * 0.5
        + amp * 30;

      // Petal width
      const petalWidth = petalAngle * 0.4 * (0.7 + fftValue * 0.5 + deform * 0.3);

      // Color: cycle hue around the wheel, with energy shifting toward warm
      const baseHue = (i / NUM_PETALS) * 360 + time * 15 + energyFactor * 40;
      const saturation = 70 + fftValue * 30;
      const lightness = 40 + fftValue * 25 + amp * 15;
      const alpha = 0.45 + fftValue * 0.3 + deform * 0.15;

      // Draw petal as bezier curve
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Petal shape using bezier curves
      const tipX = petalLen;
      const tipY = 0;
      const cpDist = petalLen * 0.6;
      const cpWidth = Math.tan(petalWidth) * cpDist;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        cpDist * 0.3, -cpWidth * 1.2,
        cpDist, -cpWidth * 0.8,
        tipX, tipY
      );
      ctx.bezierCurveTo(
        cpDist, cpWidth * 0.8,
        cpDist * 0.3, cpWidth * 1.2,
        0, 0
      );

      // Gradient fill along petal length
      const petalGrad = ctx.createLinearGradient(0, 0, tipX, 0);
      petalGrad.addColorStop(0, `hsla(${baseHue}, ${saturation}%, ${lightness}%, ${alpha * 0.3})`);
      petalGrad.addColorStop(0.5, `hsla(${baseHue + 20}, ${saturation}%, ${lightness + 10}%, ${alpha})`);
      petalGrad.addColorStop(1, `hsla(${baseHue + 40}, ${saturation - 10}%, ${lightness + 5}%, ${alpha * 0.6})`);

      ctx.fillStyle = petalGrad;
      ctx.fill();

      // Petal outline glow
      ctx.strokeStyle = `hsla(${baseHue + 10}, 90%, ${lightness + 15}%, ${alpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // Mirror petal (kaleidoscope effect)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.scale(1, -1);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        cpDist * 0.3, -cpWidth * 0.8,
        cpDist, -cpWidth * 0.5,
        tipX * 0.85, tipY
      );
      ctx.bezierCurveTo(
        cpDist, cpWidth * 0.5,
        cpDist * 0.3, cpWidth * 0.8,
        0, 0
      );

      const mirrorGrad = ctx.createLinearGradient(0, 0, tipX * 0.85, 0);
      mirrorGrad.addColorStop(0, `hsla(${baseHue + 180}, ${saturation - 10}%, ${lightness - 5}%, ${alpha * 0.15})`);
      mirrorGrad.addColorStop(0.6, `hsla(${baseHue + 200}, ${saturation - 10}%, ${lightness}%, ${alpha * 0.25})`);
      mirrorGrad.addColorStop(1, `hsla(${baseHue + 210}, ${saturation - 15}%, ${lightness - 5}%, ${alpha * 0.1})`);
      ctx.fillStyle = mirrorGrad;
      ctx.fill();

      ctx.restore();
    }

    // ---- Central waveform ring ----
    if (waveform && isPlaying) {
      ctx.beginPath();
      for (let i = 0; i < waveform.length; i++) {
        const a = (i / waveform.length) * Math.PI * 2 - Math.PI / 2;
        const r = baseRadius * 0.6 + waveform[i] * 20 * (1 + energyFactor);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + amp * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ---- Center stamen ----
    const stamenR = baseRadius * 0.25 + amp * 15 + bassSmooth.current * 20;
    const stamenGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, stamenR);
    stamenGrad.addColorStop(0, `rgba(255, 255, 255, ${0.3 + amp * 0.4})`);
    stamenGrad.addColorStop(0.5, `rgba(255, 200, 100, ${0.15 + amp * 0.3})`);
    stamenGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, stamenR, 0, Math.PI * 2);
    ctx.fillStyle = stamenGrad;
    ctx.fill();

    // ---- Orbiting pollen particles ----
    const particleCount = 8 + Math.floor(energyFactor * 12);
    for (let i = 0; i < particleCount; i++) {
      const pAngle = (i / particleCount) * Math.PI * 2 + time * (0.3 + i * 0.04);
      const pR = baseRadius * 0.9 + Math.sin(time * 1.5 + i * 0.7) * 20 + amp * 40;
      const px = cx + Math.cos(pAngle) * pR;
      const py = cy + Math.sin(pAngle) * pR;
      const pSize = 1 + amp * 2.5;
      const pHue = (i / particleCount) * 360 + time * 30;

      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${pHue}, 80%, 70%, ${0.3 + amp * 0.5})`;
      ctx.fill();
    }

    // ---- Idle state overlay ----
    if (!isPlaying || !analyzer) {
      for (let i = 0; i < 3; i++) {
        const r = 50 + i * 35 + Math.sin(time + i) * 8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(123, 47, 247, ${0.12 - i * 0.03})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, [analyzer, isPlaying, energy, onInteraction]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      style={{ display: 'block', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
