import { useEffect, useRef, useCallback } from 'react';
import { useStore } from './store/useStore';
import { getEngine } from './audio/engine';
import { AudioRecorder } from './audio/recorder';
import { Visualizer } from './components/Visualizer';
import { TransportBar } from './components/TransportBar';
import { EnergySlider } from './components/EnergySlider';
import { MoodSelector } from './components/MoodSelector';
import { GridCell } from './components/GridCell';
import { AdvancedPanel } from './components/AdvancedPanel';
import { RecordingIndicator } from './components/RecordingIndicator';
import { SnapshotManager } from './components/SnapshotManager';
import { GRID_CELLS, GRID_ROWS } from './audio/grid-instruments';
import type { VisualizerMod } from './types';

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
      // Initialize all enabled grid cells
      for (const cell of GRID_CELLS) {
        if (store.grid[cell.id]?.enabled) {
          engine.setGridCellEnabled(cell.id, true);
          engine.setGridCellVolume(cell.id, store.grid[cell.id].volume);
        }
      }
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
      AudioRecorder.downloadBlob(blob, `petalwave-session-${Date.now()}.webm`);
    }
  }, [store]);

  const handleGridToggle = useCallback((id: string, enabled: boolean) => {
    store.setGridCellEnabled(id, enabled);
    if (store.hasStarted) {
      engineRef.current.setGridCellEnabled(id, enabled);
      if (enabled) {
        engineRef.current.setGridCellVolume(id, store.grid[id]?.volume ?? 0.7);
      }
    }
  }, [store]);

  const handleGridVolume = useCallback((id: string, volume: number) => {
    store.setGridCellVolume(id, volume);
    engineRef.current.setGridCellVolume(id, volume);
  }, [store]);

  const handleVisualizerInteraction = useCallback((mod: VisualizerMod) => {
    engineRef.current.setVisualizerMod(mod);
  }, []);

  const handleLoadSnapshot = useCallback((snapshot: Parameters<typeof store.loadSnapshot>[0]) => {
    store.loadSnapshot(snapshot);
    // Engine will sync via effects
  }, [store]);

  const analyzer = store.hasStarted ? engineRef.current.getAnalyzer() : null;

  // Landing screen
  if (!store.hasStarted && !store.isPlaying) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-space-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-rose-500/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-wider text-glow-cyan text-cyan">
            PETALWAVE
          </h1>
          <h2 className="font-display text-sm sm:text-lg font-light tracking-[0.3em] text-white/35 -mt-4">
            GENERATIVE MUSIC GARDEN
          </h2>

          <p className="text-white/25 text-xs max-w-md text-center leading-relaxed px-4">
            An interactive generative music instrument. Shape evolving soundscapes
            by dragging the flower petals and toggling instruments in the grid.
          </p>

          <button
            onClick={handlePlay}
            className="mt-4 px-10 py-3.5 rounded-full font-display text-sm tracking-widest uppercase
              bg-violet/10 border border-violet/30 text-violet
              hover:bg-violet/20 hover:border-violet/50
              transition-all duration-500 glow-violet
              active:scale-95"
          >
            Bloom
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
          Petalwave
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

      {/* Main content - scrollable */}
      <div className="flex-1 flex flex-col items-center gap-3 p-3 overflow-y-auto min-h-0">
        {/* Visualizer */}
        <div className="w-full max-w-md aspect-square max-h-[35vh] relative shrink-0">
          <Visualizer
            analyzer={analyzer}
            isPlaying={store.isPlaying}
            energy={store.energy}
            onInteraction={handleVisualizerInteraction}
          />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-white/20 pointer-events-none">
            click &amp; drag petals to shape sound
          </div>
        </div>

        {/* Primary controls */}
        <div className="flex flex-col items-center gap-3 w-full max-w-2xl">
          {/* Energy */}
          <EnergySlider value={store.energy} onChange={store.setEnergy} />

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

          {/* 6x6 Instrument Grid */}
          <div className="w-full">
            <div className="text-[9px] uppercase tracking-widest text-white/25 text-center mb-2">
              Instrument Grid
            </div>
            <div className="grid grid-rows-6 gap-1.5">
              {GRID_ROWS.map((rowLabel, rowIdx) => (
                <div key={rowLabel} className="flex items-center gap-1.5">
                  <span className="text-[8px] uppercase tracking-wider text-white/20 w-12 text-right shrink-0">
                    {rowLabel}
                  </span>
                  <div className="grid grid-cols-6 gap-1 flex-1">
                    {GRID_CELLS.filter(c => c.row === rowIdx).map(cell => (
                      <GridCell
                        key={cell.id}
                        config={cell}
                        enabled={store.grid[cell.id]?.enabled ?? false}
                        volume={store.grid[cell.id]?.volume ?? 0.7}
                        onToggle={(enabled) => handleGridToggle(cell.id, enabled)}
                        onVolumeChange={(vol) => handleGridVolume(cell.id, vol)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
