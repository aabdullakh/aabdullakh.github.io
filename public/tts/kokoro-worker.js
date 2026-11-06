// Text-to-speech worker for the "Listen" button on blog posts.
//
// Runs Kokoro-82M (Apache-2.0, https://huggingface.co/hexgrad/Kokoro-82M) in
// the visitor's browser through kokoro-js. Nothing is sent to a server: the
// model (~90 MB, 8-bit) is downloaded once from Hugging Face, cached by the
// browser, and every sentence is synthesized locally.
//
// It lives in a Web Worker so generating audio never freezes the page.
// Protocol (main thread -> worker):
//   { type: 'load' }                          start downloading the model
//   { type: 'gen', session, index, text, voice, speed }   synthesize one chunk
//   { type: 'cancel', session }               drop queued chunks from older sessions
// Worker -> main thread:
//   { type: 'progress', loaded, total }       model download progress (bytes)
//   { type: 'ready' }                         model loaded
//   { type: 'audio', session, index, audio, rate }  Float32Array samples
//   { type: 'error', session?, message }

import { KokoroTTS } from 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

let modelPromise = null;

function loadModel() {
  if (!modelPromise) {
    modelPromise = KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: 'q8', // ~90 MB; quality is close to the full 326 MB model
      device: 'wasm', // works in every modern browser
      progress_callback: (p) => {
        if (p.status === 'progress' && typeof p.file === 'string' && p.file.endsWith('.onnx')) {
          self.postMessage({ type: 'progress', loaded: p.loaded, total: p.total });
        }
      },
    }).then(
      (tts) => {
        self.postMessage({ type: 'ready' });
        return tts;
      },
      (err) => {
        modelPromise = null; // allow a retry
        throw err;
      },
    );
  }
  return modelPromise;
}

// Chunks are generated one at a time, in the order they were requested.
// The main thread asks for a whole post at once, so when the reader stops or
// changes voice, everything still queued from the old session is skipped.
let queue = Promise.resolve();
let latestSession = 0;

self.onmessage = (event) => {
  const msg = event.data;

  if (msg.type === 'load') {
    loadModel().catch((err) => self.postMessage({ type: 'error', message: String(err?.message || err) }));
    return;
  }

  if (msg.type === 'cancel') {
    latestSession = Math.max(latestSession, msg.session);
    return;
  }

  if (msg.type === 'gen') {
    latestSession = Math.max(latestSession, msg.session);
    queue = queue.then(async () => {
      if (msg.session < latestSession) return; // stopped or restarted: skip
      try {
        const tts = await loadModel();
        if (msg.session < latestSession) return;
        const out = await tts.generate(msg.text, { voice: msg.voice, speed: msg.speed });
        const samples = new Float32Array(out.audio); // own copy, so it can be transferred
        self.postMessage(
          { type: 'audio', session: msg.session, index: msg.index, audio: samples, rate: out.sampling_rate },
          [samples.buffer],
        );
      } catch (err) {
        self.postMessage({ type: 'error', session: msg.session, message: String(err?.message || err) });
      }
    });
  }
};
