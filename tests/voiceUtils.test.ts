import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSpeechRecognitionSupported,
  isMicrophoneSupported,
  isSecureVoiceContext,
  classifyMicrophoneError,
  classifySpeechRecognitionError,
  requestMicrophonePermission,
  VoiceSessionController
} from '../src/utils/voiceUtils.ts';

test('1. Capability Detection: isSpeechRecognitionSupported', () => {
  // Empty window
  assert.equal(isSpeechRecognitionSupported({}), false);
  assert.equal(isSpeechRecognitionSupported(null), false);

  // Standard SpeechRecognition
  assert.equal(isSpeechRecognitionSupported({ SpeechRecognition: class {} }), true);

  // Prefixed webkitSpeechRecognition
  assert.equal(isSpeechRecognitionSupported({ webkitSpeechRecognition: class {} }), true);
});

test('2. Capability Detection: isMicrophoneSupported', () => {
  // Missing navigator or mediaDevices
  assert.equal(isMicrophoneSupported({}), false);
  assert.equal(isMicrophoneSupported({ mediaDevices: {} }), false);

  // Valid mediaDevices with getUserMedia function
  assert.equal(
    isMicrophoneSupported({
      mediaDevices: {
        getUserMedia: async () => {}
      }
    }),
    true
  );
});

test('3. Security Context: isSecureVoiceContext', () => {
  // Insecure context (HTTP)
  assert.equal(isSecureVoiceContext({ isSecureContext: false }), false);

  // Secure context (HTTPS or localhost)
  assert.equal(isSecureVoiceContext({ isSecureContext: true }), true);
  assert.equal(isSecureVoiceContext({}), true);
});

test('4. Microphone Permission: successful permission stops audio tracks immediately', async () => {
  let tracksStoppedCount = 0;
  let constraintsPassed: any = null;

  const mockMediaDevices = {
    getUserMedia: async (constraints: any) => {
      constraintsPassed = constraints;
      return {
        getTracks: () => [
          {
            stop: () => {
              tracksStoppedCount++;
            }
          }
        ]
      };
    }
  };

  const result = await requestMicrophonePermission(mockMediaDevices as any, { isSecureContext: true });

  assert.equal(result.success, true);
  assert.equal(result.error, undefined);
  assert.deepEqual(constraintsPassed, { audio: true });
  // Verify audio track was stopped immediately so recording does not continue in background
  assert.equal(tracksStoppedCount, 1);
});

test('5. Microphone Permission: denied permission (NotAllowedError)', async () => {
  const mockMediaDevices = {
    getUserMedia: async () => {
      const err = new Error('Permission denied');
      err.name = 'NotAllowedError';
      throw err;
    }
  };

  const result = await requestMicrophonePermission(mockMediaDevices as any, { isSecureContext: true });

  assert.equal(result.success, false);
  assert.ok(result.error);
  assert.equal(result.error.type, 'permission_denied');
  assert.equal(result.error.title, 'Microphone Permission Denied');
  assert.ok(result.error.recovery.includes('site settings') || result.error.recovery.includes('lock'));
});

test('6. Microphone Permission: missing microphone device (NotFoundError)', async () => {
  const mockMediaDevices = {
    getUserMedia: async () => {
      const err = new Error('No device found');
      err.name = 'NotFoundError';
      throw err;
    }
  };

  const result = await requestMicrophonePermission(mockMediaDevices as any, { isSecureContext: true });

  assert.equal(result.success, false);
  assert.ok(result.error);
  assert.equal(result.error.type, 'device_not_found');
  assert.equal(result.error.title, 'No Microphone Detected');
  assert.ok(result.error.recovery.includes('connect a microphone'));
});

test('7. Microphone Permission: hardware in use by another app (NotReadableError)', async () => {
  const mockMediaDevices = {
    getUserMedia: async () => {
      const err = new Error('Hardware busy');
      err.name = 'NotReadableError';
      throw err;
    }
  };

  const result = await requestMicrophonePermission(mockMediaDevices as any, { isSecureContext: true });

  assert.equal(result.success, false);
  assert.ok(result.error);
  assert.equal(result.error.type, 'hardware_in_use');
  assert.equal(result.error.title, 'Microphone In Use or Hardware Busy');
  assert.ok(result.error.recovery.toLowerCase().includes('close other applications'));
});

test('8. Speech Recognition Error: distinguishes recognition restriction when mic permission succeeded', () => {
  // CRITICAL REQUIREMENT 4:
  // If microphone permission succeeded, but speech recognition gives 'not-allowed',
  // do NOT falsely claim microphone access was denied. Report speech recognition service restriction!
  const classifiedWhenMicAllowed = classifySpeechRecognitionError('not-allowed', true, 'en-IN');
  assert.equal(classifiedWhenMicAllowed.type, 'speech_service_restricted');
  assert.equal(classifiedWhenMicAllowed.title, 'Speech Recognition Service Restricted');
  assert.ok(classifiedWhenMicAllowed.message.includes('Microphone access is permitted'));

  // If mic permission was never granted/verified:
  const classifiedWhenMicNotVerified = classifySpeechRecognitionError('not-allowed', false, 'en-IN');
  assert.equal(classifiedWhenMicNotVerified.type, 'microphone_denied');
  assert.equal(classifiedWhenMicNotVerified.title, 'Microphone Access Denied');
});

test('9. Speech Recognition Error: handles network, no-speech, and audio-capture separately', () => {
  const noSpeech = classifySpeechRecognitionError('no-speech', true);
  assert.equal(noSpeech.type, 'no_speech');
  assert.equal(noSpeech.isFatal, false);

  const networkErr = classifySpeechRecognitionError('network', true);
  assert.equal(networkErr.type, 'network');
  assert.equal(networkErr.isFatal, true);
  assert.ok(networkErr.recovery.includes('internet connection'));

  const audioCaptureErr = classifySpeechRecognitionError('audio-capture', true);
  assert.equal(audioCaptureErr.type, 'audio_capture');
  assert.equal(audioCaptureErr.isFatal, true);

  const langNotSupported = classifySpeechRecognitionError('language-not-supported', true, 'ta-IN');
  assert.equal(langNotSupported.type, 'language_not_supported');
  assert.ok(langNotSupported.message.includes('ta-IN'));

  const aborted = classifySpeechRecognitionError('aborted', true);
  assert.equal(aborted.type, 'aborted');
  assert.equal(aborted.isFatal, false);
});

test('10. VoiceSessionController: prevents overlapping sessions and handles repeated rapid clicks', async () => {
  let startCount = 0;
  let abortCount = 0;

  class MockSpeechRecognition {
    lang = 'en-IN';
    continuous = false;
    interimResults = true;
    maxAlternatives = 1;
    onstart: any = null;
    onresult: any = null;
    onerror: any = null;
    onend: any = null;

    start() {
      startCount++;
      setTimeout(() => {
        if (this.onstart) this.onstart();
      }, 50);
    }

    abort() {
      abortCount++;
      if (this.onend) this.onend();
    }
  }

  const mockMediaDevices = {
    getUserMedia: async () => ({
      getTracks: () => [{ stop: () => {} }]
    })
  };

  const controller = new VoiceSessionController(
    {
      onStart: () => {},
      onInterim: () => {},
      onFinal: () => {},
      onError: () => {},
      onEnd: () => {},
      getLanguage: () => 'en-IN'
    },
    () => MockSpeechRecognition,
    mockMediaDevices,
    { isSecureContext: true }
  );

  // 1st click: starts listening
  const firstClickPromise = controller.toggleListening();

  // 2nd rapid click immediately while 1st click is still starting/requesting permission:
  const secondClickResult = await controller.toggleListening();
  assert.equal(secondClickResult, 'ignored', 'Repeated click while starting must be debounced/ignored');

  const firstClickResult = await firstClickPromise;
  assert.equal(firstClickResult, 'started');
  assert.equal(startCount, 1);

  // Wait for onstart callback to fire
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(controller.getIsActive(), true);

  // 3rd click while active: must cleanly stop the session
  const stopClickResult = await controller.toggleListening();
  assert.equal(stopClickResult, 'stopped');
  assert.equal(controller.getIsActive(), false);
  assert.equal(abortCount, 1);
});

test('11. VoiceSessionController: handles unsupported speech recognition gracefully', async () => {
  let reportedError: any = null;

  const controller = new VoiceSessionController(
    {
      onStart: () => {},
      onInterim: () => {},
      onFinal: () => {},
      onError: (err) => {
        reportedError = err;
      },
      onEnd: () => {},
      getLanguage: () => 'en-IN'
    },
    () => null, // No SpeechRecognition available
    {},
    { isSecureContext: true }
  );

  const res = await controller.toggleListening();
  assert.equal(res, 'error');
  assert.ok(reportedError);
  assert.equal(reportedError.type, 'unsupported_browser');
  assert.ok(reportedError.recovery.includes('Google Chrome'));
});

test('12. VoiceSessionController: cleans up existing session before starting a new one', async () => {
  let abortedOld = false;

  class MockSpeechRecognition {
    onstart: any = null;
    onend: any = null;
    start() {
      if (this.onstart) setTimeout(this.onstart, 10);
    }
    abort() {
      abortedOld = true;
    }
  }

  const mockMediaDevices = {
    getUserMedia: async () => ({
      getTracks: () => [{ stop: () => {} }]
    })
  };

  const controller = new VoiceSessionController(
    {
      onStart: () => {},
      onInterim: () => {},
      onFinal: () => {},
      onError: () => {},
      onEnd: () => {},
      getLanguage: () => 'en-IN'
    },
    () => MockSpeechRecognition,
    mockMediaDevices,
    { isSecureContext: true }
  );

  await controller.toggleListening();
  await new Promise((r) => setTimeout(r, 20));

  // Manually calling stop clears instance
  controller.stop();
  assert.equal(abortedOld, true);
  assert.equal(controller.getIsActive(), false);
});
