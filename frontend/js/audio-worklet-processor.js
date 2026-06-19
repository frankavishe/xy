// Runs on the audio rendering thread. Buffers raw PCM frames and flushes a
// merged Float32Array roughly every 2000ms — spec 3.3 "Architectural Choice
// for AI Integration".
class ChunkRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffers = [];
    this.sampleCount = 0;
    this.chunkSampleTarget = sampleRate * 2; // 2000ms
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) {
      this.buffers.push(new Float32Array(channel));
      this.sampleCount += channel.length;

      if (this.sampleCount >= this.chunkSampleTarget) {
        const merged = new Float32Array(this.sampleCount);
        let offset = 0;
        for (const buf of this.buffers) {
          merged.set(buf, offset);
          offset += buf.length;
        }
        this.port.postMessage(merged);
        this.buffers = [];
        this.sampleCount = 0;
      }
    }
    return true;
  }
}

registerProcessor('chunk-recorder', ChunkRecorderProcessor);
