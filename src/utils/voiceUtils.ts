/**
 * CampusMind Voice Utilities
 * Speech text sanitization, deterministic voice command parsing,
 * and Web Speech API capability detection.
 */

export type VoiceState = 'ready' | 'listening' | 'processing' | 'speaking' | 'error';

export type VoiceLanguage = 'en-IN' | 'ta-IN';

export interface VoiceLanguageOption {
  code: VoiceLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_VOICE_LANGUAGES: VoiceLanguageOption[] = [
  {
    code: 'en-IN',
    label: 'English (India)',
    nativeLabel: 'English (India)',
    flag: '🇮🇳'
  },
  {
    code: 'ta-IN',
    label: 'Tamil (India)',
    nativeLabel: 'தமிழ் (இந்தியா)',
    flag: '🇮🇳'
  }
];

export interface VoiceCommandMatch {
  isCommand: boolean;
  commandType?: 'navigate' | 'stop_speaking' | 'cancel_listening' | 'clear_conversation';
  targetTab?: 'dashboard' | 'chat' | 'voice' | 'study' | 'notices' | 'documents';
  label?: string;
  feedbackText?: string;
}

export type MicrophoneErrorType =
  | 'insecure_context'
  | 'permission_denied'
  | 'device_not_found'
  | 'hardware_in_use'
  | 'unsupported_browser'
  | 'security_policy_blocked'
  | 'unknown_error';

export type RecognitionErrorType =
  | 'speech_service_restricted'
  | 'microphone_denied'
  | 'no_speech'
  | 'audio_capture'
  | 'network'
  | 'language_not_supported'
  | 'bad_grammar'
  | 'aborted'
  | 'unknown';

export interface ClassifiedVoiceError {
  type: MicrophoneErrorType | RecognitionErrorType;
  title: string;
  message: string;
  recovery: string;
  isFatal: boolean;
}

/**
 * Checks if browser supports native SpeechRecognition (standard or webkit prefixed)
 */
export function isSpeechRecognitionSupported(win?: any): boolean {
  const targetWindow = win !== undefined ? win : (typeof window !== 'undefined' ? window : null);
  if (!targetWindow) return false;
  return Boolean(targetWindow.SpeechRecognition || targetWindow.webkitSpeechRecognition);
}

/**
 * Checks if browser supports SpeechSynthesis
 */
export function isSpeechSynthesisSupported(win?: any): boolean {
  const targetWindow = win !== undefined ? win : (typeof window !== 'undefined' ? window : null);
  if (!targetWindow) return false;
  return Boolean(targetWindow.speechSynthesis && typeof targetWindow.SpeechSynthesisUtterance !== 'undefined');
}

/**
 * Checks if browser supports mediaDevices.getUserMedia for microphone recording
 */
export function isMicrophoneSupported(nav?: any): boolean {
  const targetNav = nav !== undefined ? nav : (typeof navigator !== 'undefined' ? navigator : null);
  if (!targetNav) return false;
  return Boolean(targetNav.mediaDevices && typeof targetNav.mediaDevices.getUserMedia === 'function');
}

/**
 * Checks if running in a secure context (HTTPS or localhost) required for audio device access
 */
export function isSecureVoiceContext(win?: any): boolean {
  const targetWindow = win !== undefined ? win : (typeof window !== 'undefined' ? window : null);
  if (!targetWindow) return true; // Default true in non-window/SSR contexts
  // If isSecureContext is explicitly false, it is insecure
  if (targetWindow.isSecureContext === false) return false;
  return true;
}

/**
 * Classifies microphone hardware & getUserMedia errors into clear, actionable error objects
 */
export function classifyMicrophoneError(err: any): ClassifiedVoiceError {
  const errorName = err?.name || '';
  const errorMessage = err?.message || '';

  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    return {
      type: 'permission_denied',
      title: 'Microphone Permission Denied',
      message: 'Access to your microphone was blocked by the browser or system.',
      recovery: 'Click the site settings/lock icon in your browser address bar, set Microphone to "Allow", and try again.',
      isFatal: true
    };
  }

  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return {
      type: 'device_not_found',
      title: 'No Microphone Detected',
      message: 'No audio recording device was found on this system.',
      recovery: 'Please connect a microphone or headset, verify it in system sound settings, or use the text chat input below.',
      isFatal: true
    };
  }

  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    return {
      type: 'hardware_in_use',
      title: 'Microphone In Use or Hardware Busy',
      message: 'The microphone is currently in use by another application or operating system process.',
      recovery: 'Please close other applications using your microphone (such as video calls or recording apps) and try again.',
      isFatal: true
    };
  }

  if (errorName === 'SecurityError') {
    return {
      type: 'security_policy_blocked',
      title: 'Microphone Security Policy Restriction',
      message: 'Microphone access is restricted by your browser security context or iframe permissions policy.',
      recovery: 'Please verify the application is running in a secure HTTPS context with microphone permissions allowed.',
      isFatal: true
    };
  }

  if (errorName === 'NotSupportedError') {
    return {
      type: 'unsupported_browser',
      title: 'Microphone API Unsupported',
      message: 'Microphone recording API (getUserMedia) is not supported in this browser.',
      recovery: 'Please use Google Chrome, Microsoft Edge, or use the text chat input below.',
      isFatal: true
    };
  }

  return {
    type: 'unknown_error',
    title: 'Microphone Access Error',
    message: errorMessage || 'An unexpected error occurred while accessing the microphone.',
    recovery: 'Please check your system microphone permissions or use the text chat input below.',
    isFatal: true
  };
}

/**
 * Classifies speech recognition errors, distinguishing recognition service errors from microphone hardware denial
 */
export function classifySpeechRecognitionError(
  errorName: string,
  micPermissionGranted = false,
  selectedLanguage = 'en-IN'
): ClassifiedVoiceError {
  if (errorName === 'not-allowed' || errorName === 'service-not-allowed') {
    if (micPermissionGranted) {
      return {
        type: 'speech_service_restricted',
        title: 'Speech Recognition Service Restricted',
        message: 'Microphone access is permitted, but the browser speech recognition cloud/system service was restricted or denied access.',
        recovery: 'Please check browser speech recognition settings, ensure online speech recognition is permitted, or use the text chat input below.',
        isFatal: true
      };
    }
    return {
      type: 'microphone_denied',
      title: 'Microphone Access Denied',
      message: 'Microphone permission was denied by the browser.',
      recovery: 'Click the site settings/lock icon in your browser address bar, enable Microphone, and try again.',
      isFatal: true
    };
  }

  if (errorName === 'no-speech') {
    return {
      type: 'no_speech',
      title: 'No Speech Detected',
      message: 'No speech was detected before timeout.',
      recovery: 'Please tap the microphone and speak clearly, or type your query in the chat box below.',
      isFatal: false
    };
  }

  if (errorName === 'audio-capture') {
    return {
      type: 'audio_capture',
      title: 'Audio Capture Failed',
      message: 'The browser could not capture any audio input from your microphone.',
      recovery: 'Ensure your microphone is properly connected, unmuted, and selected as your default audio device.',
      isFatal: true
    };
  }

  if (errorName === 'network') {
    return {
      type: 'network',
      title: 'Speech Recognition Network Error',
      message: 'Unable to reach the speech recognition service over the network.',
      recovery: 'Speech recognition requires an active internet connection. Please verify your connection or use the text chat below.',
      isFatal: true
    };
  }

  if (errorName === 'language-not-supported') {
    return {
      type: 'language_not_supported',
      title: 'Language Not Supported',
      message: `The selected language (${selectedLanguage}) is not supported for speech recognition by this browser.`,
      recovery: 'Please switch languages using the dropdown or use the text chat input below.',
      isFatal: false
    };
  }

  if (errorName === 'aborted') {
    return {
      type: 'aborted',
      title: 'Speech Recognition Aborted',
      message: 'Speech recognition session was cancelled.',
      recovery: 'Tap the microphone when you are ready to speak.',
      isFatal: false
    };
  }

  if (errorName === 'bad-grammar') {
    return {
      type: 'bad_grammar',
      title: 'Speech Recognition Grammar Error',
      message: 'The speech recognition engine reported a grammar error.',
      recovery: 'Please try speaking your question again or use text chat.',
      isFatal: false
    };
  }

  return {
    type: 'unknown',
    title: 'Speech Recognition Notice',
    message: `Speech recognition notice (${errorName || 'unknown'}).`,
    recovery: 'Please try again or use the text chat input below.',
    isFatal: false
  };
}

/**
 * Requests microphone permission via getUserMedia and immediately releases tracks
 * to avoid holding audio recording hardware open.
 */
export async function requestMicrophonePermission(
  customMediaDevices?: { getUserMedia: (constraints: any) => Promise<any> },
  customWin?: any
): Promise<{ success: boolean; error?: ClassifiedVoiceError }> {
  // Check secure context first
  if (!isSecureVoiceContext(customWin)) {
    return {
      success: false,
      error: {
        type: 'insecure_context',
        title: 'Secure Context Required',
        message: 'Microphone and speech recognition require a secure HTTPS connection.',
        recovery: 'Please access the application over HTTPS or localhost, or use the text chat below.',
        isFatal: true
      }
    };
  }

  const md = customMediaDevices || (typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined);
  if (!md || typeof md.getUserMedia !== 'function') {
    return {
      success: false,
      error: classifyMicrophoneError({ name: 'NotSupportedError' })
    };
  }

  try {
    const stream = await md.getUserMedia({ audio: true });
    // Immediately stop all audio tracks to prevent ongoing recording or holding the hardware
    if (stream && stream.getTracks) {
      stream.getTracks().forEach((track: any) => {
        try {
          track.stop();
        } catch {}
      });
    }
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: classifyMicrophoneError(err)
    };
  }
}

export interface VoiceSessionControllerOptions {
  onStart: () => void;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: ClassifiedVoiceError) => void;
  onEnd: () => void;
  getLanguage: () => VoiceLanguage;
}

/**
 * VoiceSessionController:
 * Manages clean lifecycle of speech recognition sessions, enforces sequential sessions,
 * debounces repeated rapid clicks, and coordinates microphone verification.
 */
export class VoiceSessionController {
  private recognition: any = null;
  private isStarting = false;
  private isActive = false;
  private micPermissionVerified = false;
  private options: VoiceSessionControllerOptions;
  private customSpeechRecognitionFactory?: () => any;
  private customMediaDevices?: any;
  private customWin?: any;

  constructor(
    options: VoiceSessionControllerOptions,
    customSpeechRecognitionFactory?: () => any,
    customMediaDevices?: any,
    customWin?: any
  ) {
    this.options = options;
    this.customSpeechRecognitionFactory = customSpeechRecognitionFactory;
    this.customMediaDevices = customMediaDevices;
    this.customWin = customWin;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getIsStarting(): boolean {
    return this.isStarting;
  }

  public getHasMicPermissionVerified(): boolean {
    return this.micPermissionVerified;
  }

  public setMicPermissionVerified(verified: boolean) {
    this.micPermissionVerified = verified;
  }

  public stop(): void {
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    this.isActive = false;
    this.isStarting = false;
  }

  public async toggleListening(): Promise<'started' | 'stopped' | 'ignored' | 'error'> {
    // 1. If currently listening, clicking the mic stops listening
    if (this.isActive) {
      this.stop();
      this.options.onEnd();
      return 'stopped';
    }

    // 2. Prevent race conditions / repeated rapid clicks while starting
    if (this.isStarting) {
      return 'ignored';
    }

    this.isStarting = true;

    // 3. Check secure context
    if (!isSecureVoiceContext(this.customWin)) {
      this.isStarting = false;
      this.options.onError({
        type: 'insecure_context',
        title: 'Secure Context Required',
        message: 'Microphone and speech recognition require a secure HTTPS connection.',
        recovery: 'Please reload or access this application over HTTPS or localhost, or use the text chat below.',
        isFatal: true
      });
      return 'error';
    }

    // 4. Check Speech Recognition browser support
    const SpeechRecognitionClass =
      this.customSpeechRecognitionFactory
        ? this.customSpeechRecognitionFactory()
        : typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionClass) {
      this.isStarting = false;
      this.options.onError({
        type: 'unsupported_browser',
        title: 'Speech Recognition Unsupported',
        message: 'Speech recognition is not supported in this browser.',
        recovery: 'Please use Google Chrome, Microsoft Edge, or use the text chat input below.',
        isFatal: true
      });
      return 'error';
    }

    // 5. Verify microphone permission if not yet verified
    if (!this.micPermissionVerified) {
      const micResult = await requestMicrophonePermission(this.customMediaDevices, this.customWin);
      if (!micResult.success && micResult.error) {
        this.isStarting = false;
        this.options.onError(micResult.error);
        return 'error';
      }
      this.micPermissionVerified = true;
    }

    // 6. Stop any stale or previous recognition instance
    this.stop();

    // 7. Instantiate and configure new recognition instance
    try {
      const recognition = new SpeechRecognitionClass();
      this.recognition = recognition;
      recognition.lang = this.options.getLanguage();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        this.isActive = true;
        this.isStarting = false;
        this.options.onStart();
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentFinal) {
          this.options.onFinal(currentFinal);
        } else if (currentInterim) {
          this.options.onInterim(currentInterim);
        }
      };

      recognition.onerror = (event: any) => {
        this.isActive = false;
        this.isStarting = false;
        const classified = classifySpeechRecognitionError(
          event.error,
          this.micPermissionVerified,
          this.options.getLanguage()
        );
        this.options.onError(classified);
      };

      recognition.onend = () => {
        this.isActive = false;
        this.isStarting = false;
        this.options.onEnd();
      };

      recognition.start();
      return 'started';
    } catch (startErr: any) {
      this.isActive = false;
      this.isStarting = false;
      const classified = classifySpeechRecognitionError(
        startErr?.error || startErr?.name || 'start-failure',
        this.micPermissionVerified,
        this.options.getLanguage()
      );
      this.options.onError(classified);
      return 'error';
    }
  }
}

/**
 * Sanitizes written AI answer into natural, fluent text suitable for Text-to-Speech:
 * - Strips Markdown headers, asterisks, tables, bullets, and code blocks
 * - Strips lengthy raw URLs (http:// or https://)
 * - Converts markdown links [Label](url) -> "Label"
/**
 * Converts LaTeX mathematical expressions into natural spoken speech descriptions
 */
export function convertLatexToSpokenText(formula: string): string {
  if (!formula) return '';
  let s = formula.trim();

  // Specific common derivatives
  s = s.replace(/\\frac\{d\}\{dx\}\(?([^\)]+)\)?/g, 'derivative of $1 with respect to x');
  s = s.replace(/\\frac\{d([a-zA-Z])\}\{d([a-zA-Z])\}/g, 'derivative of $1 with respect to $2');
  s = s.replace(/\\frac\{\\partial\s*([a-zA-Z])\}\{\\partial\s*([a-zA-Z])\}/g, 'partial derivative of $1 with respect to $2');

  // Fractions: \frac{a}{b} -> a over b
  s = s.replace(/\\(?:d)?frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1 over $2');
  s = s.replace(/\\(?:d)?frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1 over $2');

  // Square roots: \sqrt{x} -> square root of x
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, '$1-th root of $2');
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, 'square root of $1');

  // Summation: \sum_{i=1}^{n} -> sum from i=1 to n of
  s = s.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, 'sum from $1 to $2 of ');
  s = s.replace(/\\sum/g, 'sum of ');

  // Integrals: \int_{a}^{b} -> integral from a to b of
  s = s.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, 'integral from $1 to $2 of ');
  s = s.replace(/\\int/g, 'integral of ');

  // Limits: \lim_{x\to 0} -> limit as x approaches 0 of
  s = s.replace(/\\lim_\{([^}]+)\}/g, 'limit as $1 of ');

  // Trigonometric & standard functions (must precede Greek letters to prevent compound commands like \sin\theta from breaking)
  s = s.replace(/\\sin(?![a-zA-Z])/g, ' sine ');
  s = s.replace(/\\cos(?![a-zA-Z])/g, ' cosine ');
  s = s.replace(/\\tan(?![a-zA-Z])/g, ' tangent ');
  s = s.replace(/\\arcsin(?![a-zA-Z])/g, ' arcsine ');
  s = s.replace(/\\arccos(?![a-zA-Z])/g, ' arccosine ');
  s = s.replace(/\\arctan(?![a-zA-Z])/g, ' arctangent ');
  s = s.replace(/\\log(?![a-zA-Z])/g, ' log ');
  s = s.replace(/\\ln(?![a-zA-Z])/g, ' natural log ');
  s = s.replace(/\\det(?![a-zA-Z])/g, ' determinant of ');

  // Greek letters (using (?![a-zA-Z]) so \theta_1 matches before subscript)
  s = s.replace(/\\alpha(?![a-zA-Z])/g, ' alpha ');
  s = s.replace(/\\beta(?![a-zA-Z])/g, ' beta ');
  s = s.replace(/\\theta(?![a-zA-Z])/g, ' theta ');
  s = s.replace(/\\lambda(?![a-zA-Z])/g, ' lambda ');
  s = s.replace(/\\pi(?![a-zA-Z])/g, ' pi ');
  s = s.replace(/\\Delta(?![a-zA-Z])/g, ' delta ');
  s = s.replace(/\\Sigma(?![a-zA-Z])/g, ' sigma ');
  s = s.replace(/\\gamma(?![a-zA-Z])/g, ' gamma ');
  s = s.replace(/\\omega(?![a-zA-Z])/g, ' omega ');
  s = s.replace(/\\phi(?![a-zA-Z])/g, ' phi ');
  s = s.replace(/\\mu(?![a-zA-Z])/g, ' mu ');
  s = s.replace(/\\epsilon(?![a-zA-Z])/g, ' epsilon ');

  // Mathematical relational & operational symbols
  s = s.replace(/\\le(?![a-zA-Z])|\\leq(?![a-zA-Z])/g, ' less than or equal to ');
  s = s.replace(/\\ge(?![a-zA-Z])|\\geq(?![a-zA-Z])/g, ' greater than or equal to ');
  s = s.replace(/\\neq(?![a-zA-Z])/g, ' not equal to ');
  s = s.replace(/\\approx(?![a-zA-Z])/g, ' approximately equals ');
  s = s.replace(/\\times(?![a-zA-Z])/g, ' times ');
  s = s.replace(/\\cdot(?![a-zA-Z])/g, ' times ');
  s = s.replace(/\\pm(?![a-zA-Z])/g, ' plus or minus ');
  s = s.replace(/\\to(?![a-zA-Z])/g, ' approaches ');
  s = s.replace(/\\infty(?![a-zA-Z])/g, ' infinity ');

  // Powers: x^2 -> x squared, x^3 -> x cubed, x^{n} -> x to the power of n
  s = s.replace(/([a-zA-Z0-9\)])\^2\b/g, '$1 squared ');
  s = s.replace(/([a-zA-Z0-9\)])\^3\b/g, '$1 cubed ');
  s = s.replace(/\^\{([^}]+)\}/g, ' to the power of $1 ');
  s = s.replace(/\^([a-zA-Z0-9])/g, ' to the power of $1 ');

  // Subscripts: x_1 -> x sub 1, n_1 -> n sub 1
  s = s.replace(/_\{([^}]+)\}/g, ' sub $1 ');
  s = s.replace(/_([a-zA-Z0-9])/g, ' sub $1 ');

  // Remove matrices / environment delimiters
  s = s.replace(/\\begin\{[^{}]+\}|\\end\{[^{}]+\}/g, ' ');
  s = s.replace(/\\\\/g, ', ');
  s = s.replace(/&/g, ' ');

  // Remove residual LaTeX command backslashes and braces
  s = s.replace(/\\[a-zA-Z]+/g, ' ');
  s = s.replace(/[{}]/g, '');

  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitizes chat response text for clean, natural speech synthesis:
 * - Converts LaTeX math formulas into spoken words
 * - Removes markdown formatting (*, #, _, `, etc.)
 * - Strips code blocks and raw URLs
 * - Replaces technical acronyms with clear spoken phrases
 */
export function sanitizeTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove code blocks ```...```
  cleaned = cleaned.replace(/```[\s\S]*?```/g, 'Code snippet omitted.');

  // 1b. Convert LaTeX math formulas into natural spoken descriptions
  // Display math $$...$$ and \[...\]
  cleaned = cleaned.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => ` ${convertLatexToSpokenText(math)} `);
  cleaned = cleaned.replace(/\\\[([\s\S]+?)\\\]/g, (_, math) => ` ${convertLatexToSpokenText(math)} `);

  // Inline math \(...\) and $...$ (preserving currency like $50)
  cleaned = cleaned.replace(/\\\(([\s\S]+?)\\\)/g, (_, math) => ` ${convertLatexToSpokenText(math)} `);
  cleaned = cleaned.replace(/(?<!\\)\$(?!\s|\d)(.+?)(?<!\s|\\)\$/g, (_, math) => ` ${convertLatexToSpokenText(math)} `);

  // 2. Remove inline code `...`
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // 3. Convert markdown links [Label](URL) -> Label
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // 4. Remove raw URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, '');

  // 5. Clean citation footers like "Source: [Title]" or "**Source**: Title"
  cleaned = cleaned.replace(/\*{0,2}Source\*{0,2}:\s*([^\n\r]+)/gi, (_, source) => {
    const cleanSource = source.replace(/\[|\]/g, '').trim();
    return cleanSource ? `According to official notice: ${cleanSource}.` : '';
  });

  // 6. Remove markdown formatting (*, **, _, __, #, ##, ###, >, ~)
  cleaned = cleaned.replace(/#{1,6}\s+/g, '');
  cleaned = cleaned.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');
  cleaned = cleaned.replace(/_{1,3}([^_]+)_{1,3}/g, '$1');
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');
  cleaned = cleaned.replace(/^>\s+/gm, '');

  // 7. Clean bullet points & numbered lists to natural spoken pauses
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, ' ');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, ' ');

  // 8. Improve pronunciation for college acronyms
  cleaned = cleaned.replace(/\bSIST\b/g, 'SIST');
  cleaned = cleaned.replace(/\bCOE\b/g, 'Controller of Examinations');
  cleaned = cleaned.replace(/\bCAE\b/g, 'Continuous Assessment Exam');
  cleaned = cleaned.replace(/\bESE\b/g, 'End Semester Exam');
  cleaned = cleaned.replace(/\bCGPA\b/g, 'C G P A');
  cleaned = cleaned.replace(/\bSGPA\b/g, 'S G P A');
  cleaned = cleaned.replace(/\bRA\b/g, 'Reappear');
  cleaned = cleaned.replace(/\bUG\b/g, 'Undergraduate');
  cleaned = cleaned.replace(/\bPG\b/g, 'Postgraduate');

  // 9. Normalize multiple whitespaces, newlines, and punctuation
  cleaned = cleaned.replace(/\s*\n+\s*/g, '. ');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/\.{2,}/g, '.');

  return cleaned.trim();
}

/**
 * Deterministic Voice Command Parser:
 * Matches safe, useful voice commands like:
 * - "Open Notice Finder" -> navigates to Notice Finder
 * - "Open Study Assistant" -> navigates to Study Assistant
 * - "Open Knowledge Base" -> navigates to Knowledge Base
 * - "Stop speaking" -> stops TTS
 * - "Cancel listening" -> cancels speech recognition
 */
export function parseVoiceCommand(rawTranscript: string): VoiceCommandMatch {
  if (!rawTranscript) return { isCommand: false };

  const norm = rawTranscript.toLowerCase().trim().replace(/[.,!?;:]/g, '');

  // 1. Navigation: Notice Finder
  if (
    norm === 'open notice finder' ||
    norm === 'go to notice finder' ||
    norm === 'open notices' ||
    norm === 'go to notices' ||
    norm === 'show notices' ||
    norm === 'open notice' ||
    norm === 'notice finder'
  ) {
    return {
      isCommand: true,
      commandType: 'navigate',
      targetTab: 'notices',
      label: 'Open Notice Finder',
      feedbackText: 'Opening Sathyabama Notice Finder...'
    };
  }

  // 2. Navigation: Study Assistant
  if (
    norm === 'open study assistant' ||
    norm === 'go to study assistant' ||
    norm === 'open study' ||
    norm === 'go to study' ||
    norm === 'study assistant' ||
    norm === 'study tools' ||
    norm === 'open notes'
  ) {
    return {
      isCommand: true,
      commandType: 'navigate',
      targetTab: 'study',
      label: 'Open Study Assistant',
      feedbackText: 'Opening Study Assistant and Notes Summarizer...'
    };
  }

  // 3. Navigation: Knowledge Base / Documents
  if (
    norm === 'open knowledge base' ||
    norm === 'go to knowledge base' ||
    norm === 'open documents' ||
    norm === 'go to documents' ||
    norm === 'show documents' ||
    norm === 'knowledge base' ||
    norm === 'document library'
  ) {
    return {
      isCommand: true,
      commandType: 'navigate',
      targetTab: 'documents',
      label: 'Open Knowledge Base',
      feedbackText: 'Opening University Knowledge Base...'
    };
  }

  // 4. Navigation: Dashboard / Home
  if (
    norm === 'open dashboard' ||
    norm === 'go to dashboard' ||
    norm === 'open home' ||
    norm === 'go home' ||
    norm === 'dashboard'
  ) {
    return {
      isCommand: true,
      commandType: 'navigate',
      targetTab: 'dashboard',
      label: 'Open Dashboard',
      feedbackText: 'Navigating to Dashboard...'
    };
  }

  // 5. Navigation: Campus AI Chat
  if (
    norm === 'open chat' ||
    norm === 'go to chat' ||
    norm === 'open ai chat' ||
    norm === 'open chatbot'
  ) {
    return {
      isCommand: true,
      commandType: 'navigate',
      targetTab: 'chat',
      label: 'Open Campus AI Chat',
      feedbackText: 'Switching to Campus AI Chat...'
    };
  }

  // 6. Stop Speaking
  if (
    norm === 'stop speaking' ||
    norm === 'stop talking' ||
    norm === 'stop audio' ||
    norm === 'stop voice' ||
    norm === 'silence' ||
    norm === 'quiet' ||
    norm === 'mute'
  ) {
    return {
      isCommand: true,
      commandType: 'stop_speaking',
      label: 'Stop Speaking',
      feedbackText: 'Audio playback stopped.'
    };
  }

  // 7. Cancel Listening
  if (
    norm === 'cancel listening' ||
    norm === 'stop listening' ||
    norm === 'cancel voice' ||
    norm === 'cancel'
  ) {
    return {
      isCommand: true,
      commandType: 'cancel_listening',
      label: 'Cancel Listening',
      feedbackText: 'Voice recognition cancelled.'
    };
  }

  // 8. Clear conversation
  if (
    norm === 'clear conversation' ||
    norm === 'clear chat' ||
    norm === 'clear history' ||
    norm === 'reset chat'
  ) {
    return {
      isCommand: true,
      commandType: 'clear_conversation',
      label: 'Clear Conversation',
      feedbackText: 'Conversation cleared.'
    };
  }

  return { isCommand: false };
}

/**
 * Finds the best installed SpeechSynthesisVoice for requested language
 */
export function findBestVoice(
  voices: SpeechSynthesisVoice[],
  lang: VoiceLanguage
): {
  voice: SpeechSynthesisVoice | null;
  hasVoiceForLanguage: boolean;
  statusNote?: string;
} {
  if (!voices || voices.length === 0) {
    return {
      voice: null,
      hasVoiceForLanguage: false,
      statusNote: 'No text-to-speech voices available in this browser.'
    };
  }

  if (lang === 'ta-IN') {
    // Look for Tamil voice (ta-IN, ta, or 'tamil' in name)
    const tamilVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('ta') ||
        v.name.toLowerCase().includes('tamil') ||
        v.name.toLowerCase().includes('தமிழ்')
    );

    if (tamilVoice) {
      return {
        voice: tamilVoice,
        hasVoiceForLanguage: true,
        statusNote: `Tamil voice selected: ${tamilVoice.name}`
      };
    }

    return {
      voice: null,
      hasVoiceForLanguage: false,
      statusNote:
        'Tamil speech recognition is supported. However, no Tamil speech synthesis voice is installed in your browser/OS. The response will be displayed on screen in text.'
    };
  }

  // English (India)
  const enInVoice = voices.find(
    (v) =>
      v.lang.toLowerCase() === 'en-in' ||
      v.lang.toLowerCase().replace(/_/g, '-') === 'en-in' ||
      (v.lang.toLowerCase().startsWith('en') && v.name.toLowerCase().includes('india'))
  );

  if (enInVoice) {
    return {
      voice: enInVoice,
      hasVoiceForLanguage: true,
      statusNote: `Indian English voice: ${enInVoice.name}`
    };
  }

  // Fallback to any natural English voice (Google US/UK, Samantha, etc.)
  const englishFallback = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
  if (englishFallback) {
    return {
      voice: englishFallback,
      hasVoiceForLanguage: true,
      statusNote: `English voice: ${englishFallback.name}`
    };
  }

  return {
    voice: voices[0] || null,
    hasVoiceForLanguage: true,
    statusNote: `Default system voice: ${voices[0]?.name || 'Standard'}`
  };
}
