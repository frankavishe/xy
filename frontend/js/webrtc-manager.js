// Thin OO wrapper around RTCPeerConnection — spec 2.2 application logic layer.

const RTC_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export class WebRTCManager {
  constructor({ onRemoteStream, onIceCandidate, onConnectionStateChange }) {
    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this.localStream = null;

    this.pc.addEventListener('icecandidate', (event) => {
      if (event.candidate) onIceCandidate(event.candidate.toJSON());
    });
    this.pc.addEventListener('track', (event) => {
      onRemoteStream(event.streams[0]);
    });
    this.pc.addEventListener('connectionstatechange', () => {
      onConnectionStateChange?.(this.pc.connectionState);
    });
  }

  async captureLocalMedia(constraints = { audio: true, video: true }) {
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.localStream.getTracks().forEach((track) => this.pc.addTrack(track, this.localStream));
    return this.localStream;
  }

  async createOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async createAnswerFor(remoteOffer) {
    await this.pc.setRemoteDescription(remoteOffer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async acceptAnswer(remoteAnswer) {
    await this.pc.setRemoteDescription(remoteAnswer);
  }

  async addIceCandidate(candidate) {
    try {
      await this.pc.addIceCandidate(candidate);
    } catch (err) {
      console.warn('Failed to add ICE candidate', err);
    }
  }

  setMicEnabled(enabled) {
    this.localStream?.getAudioTracks().forEach((track) => (track.enabled = enabled));
  }

  setCameraEnabled(enabled) {
    this.localStream?.getVideoTracks().forEach((track) => (track.enabled = enabled));
  }

  close() {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.pc.close();
  }
}
