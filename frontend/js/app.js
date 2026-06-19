import { gqlRequest, GraphQLSubscriptionClient } from './graphql-client.js';
import { WebRTCManager } from './webrtc-manager.js';
import { AudioTranscriber } from './audio-transcriber.js';

const MUTATION_INITIATE = `mutation { initiateSecureSession { roomId hash expiresAt ttlSeconds } }`;
const MUTATION_VALIDATE = `mutation Validate($hash: String!) { validateSessionHash(hash: $hash) { success roomId message } }`;
const MUTATION_SIGNAL = `mutation Signal($roomId: ID!, $payload: String!) { sendSignalingPayload(roomId: $roomId, payload: $payload) }`;
const MUTATION_TERMINATE = `mutation Terminate($roomId: ID!) { terminateSession(roomId: $roomId) }`;
const QUERY_PDF_STATUS = `query PdfStatus($roomId: ID!) { pollPdfStatus(roomId: $roomId) { status downloadUrl wordCount durationSeconds } }`;
const SUB_CONNECTED = `subscription Connected($roomId: ID!) { sessionEventConnected(roomId: $roomId) { roomId status connectedAt } }`;
const SUB_SIGNALING = `subscription Signaling($roomId: ID!) { signalingStream(roomId: $roomId) { roomId payload } }`;
const SUB_TRANSCRIPT = `subscription Transcript($roomId: ID!) { transcriptDelta(roomId: $roomId) { speakerId timestamp textSegment isFinal } }`;

const gqlClient = new GraphQLSubscriptionClient(`ws://${location.host}/graphql`);

const dom = {
  createRoomBtn: document.getElementById('createRoomBtn'),
  hashDisplay: document.getElementById('hashDisplay'),
  hashText: document.getElementById('hashText'),
  copyHashBtn: document.getElementById('copyHashBtn'),
  ttlCountdown: document.getElementById('ttlCountdown'),
  pulseLoader: document.querySelector('.pulse-loader'),
  hashInput: document.getElementById('hashInput'),
  joinBtn: document.getElementById('joinBtn'),
  joinError: document.getElementById('joinError'),
  remoteVideo: document.getElementById('remoteVideo'),
  localVideo: document.getElementById('localVideo'),
  toggleMicBtn: document.getElementById('toggleMicBtn'),
  toggleCamBtn: document.getElementById('toggleCamBtn'),
  endSessionBtn: document.getElementById('endSessionBtn'),
  callStatus: document.getElementById('callStatus'),
  transcriptLog: document.getElementById('transcriptLog'),
  pdfPendingText: document.getElementById('pdfPendingText'),
  downloadPdfBtn: document.getElementById('downloadPdfBtn'),
  restartBtn: document.getElementById('restartBtn'),
  transcriptTemplate: document.getElementById('transcript-line-template'),
};

const state = {
  role: null, // 'Caller' | 'Receiver'
  roomId: null,
  webrtc: null,
  audioTranscriber: null,
  unsubscribers: [],
  ttlInterval: null,
  micEnabled: true,
  camEnabled: true,
  ended: false,
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((el) => {
    el.hidden = el.id !== id;
  });
}

function formatHashForDisplay(hash) {
  return hash.match(/.{1,4}/g).join('-');
}

// ---------- Screen 1: Originator ----------

dom.createRoomBtn.addEventListener('click', async () => {
  dom.createRoomBtn.disabled = true;
  try {
    const data = await gqlRequest(MUTATION_INITIATE);
    const { roomId, hash, expiresAt } = data.initiateSecureSession;
    state.role = 'Caller';
    state.roomId = roomId;
    dom.hashText.textContent = formatHashForDisplay(hash);
    dom.hashDisplay.hidden = false;
    startTtlCountdown(expiresAt);
    subscribeToConnectionEvent(roomId);
  } catch (err) {
    console.error(err);
    dom.createRoomBtn.disabled = false;
    alert(`Failed to create a secure room: ${err.message}`);
  }
});

dom.copyHashBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(dom.hashText.textContent);
  const original = dom.copyHashBtn.textContent;
  dom.copyHashBtn.textContent = 'Copied!';
  setTimeout(() => (dom.copyHashBtn.textContent = original), 1500);
});

function startTtlCountdown(expiresAt) {
  clearInterval(state.ttlInterval);
  state.ttlInterval = setInterval(() => {
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      clearInterval(state.ttlInterval);
      dom.ttlCountdown.textContent = '0:00';
      dom.pulseLoader.textContent = 'Key expired — refresh to generate a new one.';
      return;
    }
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const mm = Math.floor(totalSeconds / 60);
    const ss = String(totalSeconds % 60).padStart(2, '0');
    dom.ttlCountdown.textContent = `${mm}:${ss}`;
  }, 250);
}

function subscribeToConnectionEvent(roomId) {
  gqlClient
    .subscribe(SUB_CONNECTED, { roomId }, {
      onNext: (data) => {
        if (data?.sessionEventConnected) {
          clearInterval(state.ttlInterval);
          beginCallAsCaller(roomId);
        }
      },
      onError: console.error,
    })
    .then((unsub) => state.unsubscribers.push(unsub));
}

// ---------- Screen 1: Receiver ----------

dom.hashInput.addEventListener('input', () => {
  const normalized = dom.hashInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  dom.hashInput.dataset.normalized = normalized;
  dom.joinBtn.disabled = normalized.length !== 12;
  dom.joinError.hidden = true;
});

dom.joinBtn.addEventListener('click', async () => {
  dom.joinBtn.disabled = true;
  dom.joinError.hidden = true;
  try {
    const hash = dom.hashInput.dataset.normalized;
    const data = await gqlRequest(MUTATION_VALIDATE, { hash });
    const result = data.validateSessionHash;
    if (!result.success) {
      dom.joinError.textContent = result.message;
      dom.joinError.hidden = false;
      dom.joinBtn.disabled = false;
      return;
    }
    state.role = 'Receiver';
    state.roomId = result.roomId;
    beginCallAsReceiver(result.roomId);
  } catch (err) {
    dom.joinError.textContent = err.message;
    dom.joinError.hidden = false;
    dom.joinBtn.disabled = false;
  }
});

// ---------- Screen 2: Call setup (shared) ----------

async function setupWebRTCAndMedia(roomId) {
  state.webrtc = new WebRTCManager({
    onRemoteStream: (stream) => {
      dom.remoteVideo.srcObject = stream;
    },
    onIceCandidate: (candidate) => sendSignaling(roomId, { from: state.role, kind: 'ice', data: candidate }),
    onConnectionStateChange: (connectionState) => {
      dom.callStatus.textContent = connectionState;
      const peerHungUp = ['disconnected', 'failed', 'closed'].includes(connectionState);
      if (peerHungUp && !state.ended) endSession();
    },
  });

  const localStream = await state.webrtc.captureLocalMedia();
  dom.localVideo.srcObject = localStream;

  state.audioTranscriber = new AudioTranscriber(roomId, state.role);
  await state.audioTranscriber.start(localStream);
}

function sendSignaling(roomId, payloadObject) {
  gqlRequest(MUTATION_SIGNAL, { roomId, payload: JSON.stringify(payloadObject) }).catch(console.error);
}

function subscribeToSignaling(roomId) {
  gqlClient
    .subscribe(SUB_SIGNALING, { roomId }, {
      onNext: async (data) => {
        const raw = data?.signalingStream?.payload;
        if (!raw) return;
        const message = JSON.parse(raw);
        if (message.from === state.role) return; // ignore our own echoed message

        if (message.kind === 'offer') {
          const answer = await state.webrtc.createAnswerFor(message.data);
          sendSignaling(roomId, { from: state.role, kind: 'answer', data: answer });
        } else if (message.kind === 'answer') {
          await state.webrtc.acceptAnswer(message.data);
        } else if (message.kind === 'ice') {
          await state.webrtc.addIceCandidate(message.data);
        }
      },
      onError: console.error,
    })
    .then((unsub) => state.unsubscribers.push(unsub));
}

function subscribeToTranscript(roomId) {
  gqlClient
    .subscribe(SUB_TRANSCRIPT, { roomId }, {
      onNext: (data) => {
        if (data?.transcriptDelta) appendTranscriptLine(data.transcriptDelta);
      },
      onError: console.error,
    })
    .then((unsub) => state.unsubscribers.push(unsub));
}

async function beginCallAsCaller(roomId) {
  showScreen('screen-call');
  await setupWebRTCAndMedia(roomId);
  subscribeToSignaling(roomId);
  subscribeToTranscript(roomId);
  const offer = await state.webrtc.createOffer();
  sendSignaling(roomId, { from: 'Caller', kind: 'offer', data: offer });
}

async function beginCallAsReceiver(roomId) {
  showScreen('screen-call');
  await setupWebRTCAndMedia(roomId);
  subscribeToSignaling(roomId);
  subscribeToTranscript(roomId);
}

// ---------- Screen 2: Live transcript rendering ----------

const interimNodes = new Map();

function appendTranscriptLine({ speakerId, timestamp, textSegment, isFinal }) {
  const existingInterim = interimNodes.get(speakerId);

  if (!isFinal) {
    if (existingInterim) {
      existingInterim.querySelector('.transcript-text').textContent = textSegment;
    } else {
      const node = renderTranscriptNode(speakerId, timestamp, textSegment, true);
      dom.transcriptLog.appendChild(node);
      interimNodes.set(speakerId, node);
    }
  } else {
    if (existingInterim) {
      existingInterim.remove();
      interimNodes.delete(speakerId);
    }
    dom.transcriptLog.appendChild(renderTranscriptNode(speakerId, timestamp, textSegment, false));
  }
  dom.transcriptLog.scrollTop = dom.transcriptLog.scrollHeight;
}

function renderTranscriptNode(speakerId, timestamp, text, interim) {
  const node = dom.transcriptTemplate.content.firstElementChild.cloneNode(true);
  node.classList.add(speakerId === 'Caller' ? 'speaker-caller' : 'speaker-receiver');
  if (interim) node.classList.add('interim');
  node.querySelector('.transcript-time').textContent = new Date(timestamp).toLocaleTimeString();
  node.querySelector('.transcript-speaker').textContent = `${speakerId}:`;
  node.querySelector('.transcript-text').textContent = text;
  return node;
}

// ---------- Screen 2: Controls ----------

dom.toggleMicBtn.addEventListener('click', () => {
  state.micEnabled = !state.micEnabled;
  state.webrtc?.setMicEnabled(state.micEnabled);
  dom.toggleMicBtn.classList.toggle('muted', !state.micEnabled);
});

dom.toggleCamBtn.addEventListener('click', () => {
  state.camEnabled = !state.camEnabled;
  state.webrtc?.setCameraEnabled(state.camEnabled);
  dom.toggleCamBtn.classList.toggle('muted', !state.camEnabled);
});

dom.endSessionBtn.addEventListener('click', () => endSession());
dom.restartBtn.addEventListener('click', () => window.location.reload());

// ---------- Screen 3: Termination + PDF ----------

async function endSession() {
  if (state.ended) return;
  state.ended = true;

  const roomId = state.roomId;
  state.unsubscribers.forEach((unsub) => unsub());
  state.unsubscribers = [];
  state.webrtc?.close();
  state.audioTranscriber?.stop();

  showScreen('screen-end');
  dom.pdfPendingText.hidden = false;
  dom.downloadPdfBtn.hidden = true;

  try {
    await gqlRequest(MUTATION_TERMINATE, { roomId });
  } catch (err) {
    console.error(err);
  }
  pollPdfStatus(roomId);
}

async function pollPdfStatus(roomId) {
  try {
    const data = await gqlRequest(QUERY_PDF_STATUS, { roomId });
    const result = data.pollPdfStatus;
    if (result.status === 'READY') {
      dom.pdfPendingText.hidden = true;
      dom.downloadPdfBtn.hidden = false;
      dom.downloadPdfBtn.href = result.downloadUrl;
      return;
    }
    if (result.status === 'PENDING') {
      setTimeout(() => pollPdfStatus(roomId), 800);
    } else {
      dom.pdfPendingText.textContent = 'This transcript is no longer available.';
    }
  } catch (err) {
    dom.pdfPendingText.textContent = `Could not retrieve transcript: ${err.message}`;
  }
}
