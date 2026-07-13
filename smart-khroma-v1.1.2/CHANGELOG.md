# Changelog — Smart Khroma

## [v1.1.2] — 2026-07-13

### Performance — Motor de Áudio
- ScriptProcessors desacoplados: criados/destruídos só durante REC
- WaveShaper Neve oversample 4x → 2x
- fftSize 2048 → 1024 nos 9 analysers
- TruePeak e LUFS throttle: a cada 3 frames (~20fps)

### Freeze — UI
- _drawComposite() só renderiza durante REC
- Buffer reuse via WeakMap — elimina GC pressure
- _encodeWAV 3-5x mais rápido (Uint8Array direto)
- _stopAll() limpa todos os nós do grafo 5.1

### Service Worker
- CACHE_NAME: smart-khroma-v3
- skipWaiting() + clients.claim()
- React, ReactDOM e Babel cacheados offline via unpkg

### Ícones
- icon-192.png, icon-512.png, favicon-32.png, favicon-64.png incluídos

## [v1.0.0] — 2026-07-11

### Lançamento inicial
- Motor 5.1: L R C LFE Ls Rs
- VU meters, Phasescope, Spectrum, Loudness, Chromesthesia
- Gravação WebM + WAV 24-bit BWF/iXML
- Playlist, Batch record/normalize, Gamepad BGP-2016
- Auto-Level Rider, Timecode, 6 temas, PWA
