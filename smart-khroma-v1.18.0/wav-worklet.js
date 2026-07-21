// Smart Khroma — captura de WAV 6ch via AudioWorklet
// Estúdio Plá · 2026
//
// Substitui os 6 ScriptProcessorNode (depreciados, despacham callback na
// THREAD PRINCIPAL a cada buffer) por AudioWorkletNode, que roda na thread
// de áudio dedicada — tira esse trabalho de cima da thread principal o
// tempo todo que o áudio está tocando, não só durante REC. Junta amostras
// em blocos do mesmo tamanho de antes (4096) antes de mandar pro lado de
// cá, pra manter a mesma taxa de mensagens (~10.7Hz) de antes.
class WavCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const chunkSamples = (options.processorOptions && options.processorOptions.chunkSamples) || 4096;
    this.chunkSamples = chunkSamples;
    this.buf = new Float32Array(chunkSamples);
    this.pos = 0;
  }
  process(inputs) {
    const input = inputs[0];
    if (input && input[0] && input[0].length) {
      const data = input[0];
      let i = 0;
      while (i < data.length) {
        const room = this.chunkSamples - this.pos;
        const take = Math.min(room, data.length - i);
        this.buf.set(data.subarray(i, i + take), this.pos);
        this.pos += take;
        i += take;
        if (this.pos >= this.chunkSamples) {
          this.port.postMessage(this.buf.slice(0, this.pos));
          this.pos = 0;
        }
      }
    }
    return true; // manter vivo enquanto o nó existir
  }
}
registerProcessor('wav-capture-processor', WavCaptureProcessor);
