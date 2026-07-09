// Client-side half of spec 3.3: captures 2000ms PCM segments via an
// AudioWorklet and ships them to the backend's raw audio WebSocket
const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const AUDIO_WS_URL = `${wsProtocol}//${location.host}/ws/audio`;

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

    // Attempt to resume the AudioContext immediately
    try {
      await this.audioContext.resume();
    } catch (err) {
      console.warn('Failed to resume AudioContext immediately:', err);
    }

    // Register a fallback listener to resume on user gesture if it remains suspended
    const resumeOnGesture = async () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          console.log('AudioContext successfully resumed via user gesture.');
        } catch (err) {
          console.error('Failed to resume AudioContext on gesture:', err);
        }
      }
      if (!this.audioContext || this.audioContext.state !== 'suspended') {
        document.removeEventListener('click', resumeOnGesture);
        document.removeEventListener('keydown', resumeOnGesture);
      }
    };
    document.addEventListener('click', resumeOnGesture);
    document.addEventListener('keydown', resumeOnGesture);

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
        data: {
          roomId: this.roomId,
          speakerId: this.speakerId,
          data: base64,
          sampleRate: this.audioContext.sampleRate,
        },
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
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0xffff;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
