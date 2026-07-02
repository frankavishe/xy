// Client-side half of spec 3.3: captures 2000ms PCM segments via an
// AudioWorklet and ships them to the backend's raw audio WebSocket
// (separate from the GraphQL endpoint — see backend/src/transcription/audio.gateway.ts).
const AUDIO_WS_URL = `ws://${location.hostname}:4001/ws/audio`;

export class AudioTranscriber {
  constructor(roomId, speakerId) {
    this.roomId = roomId;
    this.speakerId = speakerId;
    this.ws = null;
    this.audioContext = null;
    this.workletNode = null;
    this.sourceNode = null;
  }

  async start(mediaStream) {
    this.ws = new WebSocket(AUDIO_WS_URL);

    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule('js/audio-worklet-processor.js');

    this.sourceNode = this.audioContext.createMediaStreamSource(mediaStream);
    this.workletNode = new AudioWorkletNode(this.audioContext, 'chunk-recorder');
    this.workletNode.port.onmessage = (event) => this.sendChunk(event.data);
    this.sourceNode.connect(this.workletNode);
    // Deliberately not connected to .destination — we don't want to hear our own mic.
  }

  sendChunk(float32Samples) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const base64 = encodePcm16Base64(float32Samples);
    this.ws.send(
      JSON.stringify({
        event: 'audio-chunk',
        data: { roomId: this.roomId, speakerId: this.speakerId, data: base64 },
      }),
    );
  }

  stop() {
    this.sourceNode?.disconnect();
    this.workletNode?.disconnect();
    this.audioContext?.close();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
  }
}

function encodePcm16Base64(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0, offset = 0; i < float32Array.length; i++, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  let binary = '';
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
