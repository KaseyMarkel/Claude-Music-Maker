import { useEffect, useRef, useCallback } from 'react';
import { useStore } from './store/useStore';
import { getEngine } from './audio/engine';
import { AudioRecorder } from './audio/recorder';
import { Visualizer } from './components/Visualizer';
import { TransportBar } from './components/TransportBar';
import { EnergySlider } from './components/EnergySlider';
import { MoodSelector } from './components/MoodSelector';
import { LayerCard } from './components/LayerCard';
import { AdvancedPanel } from './components/AdvancedPanel';
import { RecordingIndicator } from './components/RecordingIndicator';
import { SnapshotManager } from './components/SnapshotManager';
import type { LayerName } from './types';

const LAYER_NAMES: LayerName[] = ['pad', 'arpeggio', 'bass', 'rhythm', 'texture', 'lead'];

function App() {
  const store = useStore();
  const engineRef = useRef(getEngine());
  const recordingInterval = useRef<number>(0);
  const recordingStart = useRef<number>(0);

  // Sync store changes to engine
  useEffect(() => {
    engineRef.current.setEnergy(store.energy);
  }, [store.energy]);

  useEffect(() => {
    engineRef.current.setHarmonicComplexity(store.harmonicComplexity);
  }, [store.harmonicComplexity]);

  useEffect(() => {
    engineRef.current.setTempo(store.tempo);
  }, [store.tempo]);

  useEffect(() => {
    engineRef.current.setMood(store.mood);
  }, [store.mood]);

  // Sync advanced settings
  useEffect(() => {
    const { arpRate, arpPattern, reverb, delayFeedback, scale, rootNote, progressionMode } = store.advanced;
    engineRef.current.setArpRate(arpRate);
    engineRef.current.setArpPattern(arpPattern);
    engineRef.current.setReverbAmount(reverb);
    engineRef.current.setDelayFeedback(delayFeedback);
    engineRef.current.setScale(scale);
    engineRef.current.setRootNote(rootNote);
    engineRef.current.setProgression(progressionMode);
  }, [store.advanced]);

  const handlePlay = useCallback(async () => {
    const engine = engineRef.current;
    if (!store.hasStarted) {
      await engine.init();
      store.setHasStarted(true);
    }
    engine.start();
    store.setPlaying(true);
  }, [store]);

  const handleStop = useCallback(() => {
    engineRef.current.stop();
    store.setPlaying(false);
    if (store.isRecording) {
      handleStopRecording();
    }
  }, [store]);

  const handleRecord = useCallback(async () => {
    await engineRef.current.startRecording();
    store.setRecording(true);
    recordingStart.current = Date.now();
    recordingInterval.current = window.setInterval(() => {
      store.setRecordingTime((Date.now() - recordingStart.current) / 1000);
    }, 100);
  }, [store]);

  const handleStopRecording = useCallback(async () => {
    clearInterval(recordingInterval.current);
    const blob = await engineRef.current.stopRecording();
    store.setRecording(false);
    store.setRecordingTime(0);
    if (blob.size > 0) {
      AudioRecorder.downloadBlob(blob, `generative-session-${Date.now()}.webm`);
    }
  }, [store]);

  const handleLayerToggle = useCallback((layer: LayerName, enabled: boolean) => {
    store.setLayerEnabled(layer, enabled);
    engineRef.current.setLayerEnabled(layer, enabled);
  }, [store]);

  const handleLayerVolume = useCallback((layer: LayerName, volume: number) => {
    store.setLayerVolume(layer, volume);
    engineRef.current.setLayerVolume(layer, volume);
  }, [store]);

  const handleLoadSnapshot = useCallback((snapshot: Parameters<typeof store.loadSnapshot>[0]) => {
    store.loadSnapshot(snapshot);
    // Engine will sync via effects
  }, [store]);

  const analyzer = store.hasStarted ? engineRef.current.getAnalyzer() : null;

  // Landing screen
  if (!store.hasStarted && !store.isPlaying) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-space-black relative overflow-hidden">
        {/* Background nebula effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-wider text-glow-cyan text-cyan">
            GENERATIVE
          </h1>
          <h2 className="font-display text-lg sm:text-2xl font-light tracking-[0.3em] text-white/40 -mt-4">
            MUSIC STUDIO
          </h2>

          <p className="text-white/25 text-xs max-w-md text-center leading-relaxed">
            An interactive generative music instrument. Create evolving electronic
            soundscapes with harmonically rich, emotionally resonant audio.
          </p>

          <button
            onClick={handlePlay}
            className="mt-4 px-8 py-3 rounded-full font-display text-sm tracking-widest uppercase
              bg-cyan/10 border border-cyan/30 text-cyan
              hover:bg-cyan/20 hover:border-cyan/50
              transition-all duration-500 glow-cyan
              active:scale-95"
          >
            Begin
          </button>

          <span className="text-[9px] text-white/15 mt-2">Best experienced with headphones</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-space-black relative overflow-hidden">
      <RecordingIndicator isRecording={store.isRecording} />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] shrink-0">
        <h1 className="font-display text-xs tracking-[0.25em] text-white/30 uppercase">
          Generative Studio
        </h1>
        <div className="flex items-center gap-3">
          <SnapshotManager
            onSave={() => store.getSnapshot()}
            onLoad={handleLoadSnapshot}
          />
          <TransportBar
            isPlaying={store.isPlaying}
            isRecording={store.isRecording}
            recordingTime={store.recordingTime}
            onPlay={handlePlay}
            onStop={handleStop}
            onRecord={handleRecord}
            onStopRecord={handleStopRecording}
          />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 overflow-y-auto min-h-0">
        {/* Visualizer */}
        <div className="w-full max-w-lg aspect-square max-h-[40vh] relative">
          <Visualizer
            analyzer={analyzer}
            isPlaying={store.isPlaying}
            energy={store.energy}
          />
        </div>

        {/* Primary controls */}
        <div className="flex flex-col items-center gap-4 w-full max-w-lg">
          {/* Energy */}
          <EnergySlider
            value={store.energy}
            onChange={store.setEnergy}
          />

          {/* Complexity + Tempo row */}
          <div className="flex items-center gap-6 w-full max-w-xs">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest text-white/30">Complexity</span>
                <span className="text-[10px] text-violet font-mono">{store.harmonicComplexity}%</span>
              </div>
              <input
                type="range" min={0} max={100}
                value={store.harmonicComplexity}
                onChange={e => store.setHarmonicComplexity(Number(e.target.value))}
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest text-white/30">Tempo</span>
                <span className="text-[10px] text-amber font-mono">{store.tempo}</span>
              </div>
              <input
                type="range" min={80} max={160}
                value={store.tempo}
                onChange={e => store.setTempo(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Mood */}
          <MoodSelector selected={store.mood} onChange={store.setMood} />

          {/* Layer cards */}
          <div className="flex flex-wrap justify-center gap-2">
            {LAYER_NAMES.map(name => (
              <LayerCard
                key={name}
                name={name}
                enabled={store.layers[name].enabled}
                volume={store.layers[name].volume}
                onToggle={(enabled) => handleLayerToggle(name, enabled)}
                onVolumeChange={(vol) => handleLayerVolume(name, vol)}
              />
            ))}
          </div>

          {/* Advanced */}
          <AdvancedPanel
            settings={store.advanced}
            onChange={store.setAdvanced}
            isOpen={store.showAdvanced}
            onToggle={() => store.setShowAdvanced(!store.showAdvanced)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
