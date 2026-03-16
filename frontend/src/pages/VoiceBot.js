import { GraphicEq, Mic, MicOff, SettingsVoice } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { chatbotAPI } from '../services/api';

const RECORDER_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm'];
const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', browserLang: 'en-US' },
  { code: 'hi', label: 'Hindi', browserLang: 'hi-IN' },
  { code: 'te', label: 'Telugu', browserLang: 'te-IN' },
  { code: 'es', label: 'Spanish', browserLang: 'es-ES' },
  { code: 'fr', label: 'French', browserLang: 'fr-FR' },
  { code: 'de', label: 'German', browserLang: 'de-DE' },
];

const DEFAULT_VAD_SETTINGS = {
  maxRecordingSeconds: 20,
  speechThreshold: 0.012,
  silenceMs: 1200,
  minSpeechMs: 500,
};

function pickRecorderMimeType() {
  return RECORDER_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || '';
}

function rmsFromTimeDomain(dataArray) {
  let sum = 0;
  for (let index = 0; index < dataArray.length; index += 1) {
    const normalized = (dataArray[index] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / dataArray.length);
}

const VoiceBot = () => {
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [latencies, setLatencies] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState('en');
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [detectedLevel, setDetectedLevel] = useState(0);
  const [vadSettings, setVadSettings] = useState(DEFAULT_VAD_SETTINGS);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const analyserDataRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const silenceStartedAtRef = useRef(null);
  const utteranceStartedAtRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isSessionActiveRef = useRef(false);
  const discardCurrentRecordingRef = useRef(false);
  const smoothedLevelRef = useRef(0);
  const idleGreetingTimerRef = useRef(null);
  const lastActivityAtRef = useRef(Date.now());
  const audioRef = useRef(null);
  const sessionIdRef = useRef('');

  const selectedLanguage = useMemo(
    () => LANGUAGE_OPTIONS.find((item) => item.code === selectedLanguageCode) || LANGUAGE_OPTIONS[0],
    [selectedLanguageCode]
  );

  const filteredVoices = useMemo(() => {
    const browserPrefix = selectedLanguage.browserLang.split('-')[0].toLowerCase();
    const matches = voices.filter((voice) => voice.lang.toLowerCase().startsWith(browserPrefix));
    return matches.length > 0 ? matches : voices;
  }, [voices, selectedLanguage]);

  const hasMatchingVoice = useMemo(() => {
    const browserPrefix = selectedLanguage.browserLang.split('-')[0].toLowerCase();
    return voices.some((voice) => voice.lang.toLowerCase().startsWith(browserPrefix));
  }, [voices, selectedLanguage]);

  useEffect(() => {
    void initializeVoicebot();
    loadVoices();
    window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices);

    return () => {
      stopSession();
      window.speechSynthesis?.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, []);

  useEffect(() => {
    if (!filteredVoices.some((voice) => voice.voiceURI === selectedVoiceURI)) {
      setSelectedVoiceURI(filteredVoices[0]?.voiceURI || '');
    }
  }, [filteredVoices, selectedVoiceURI]);

  function loadVoices() {
    const availableVoices = window.speechSynthesis?.getVoices?.() || [];
    setVoices(availableVoices);
  }

  async function initializeVoicebot() {
    try {
      const response = await chatbotAPI.getVoiceConfig();
      const config = response.data || {};
      setVadSettings({
        maxRecordingSeconds: config.maxRecordingSeconds || DEFAULT_VAD_SETTINGS.maxRecordingSeconds,
        speechThreshold: config.vadSpeechThreshold || DEFAULT_VAD_SETTINGS.speechThreshold,
        silenceMs: config.vadSilenceMs || DEFAULT_VAD_SETTINGS.silenceMs,
        minSpeechMs: config.vadMinSpeechMs || DEFAULT_VAD_SETTINGS.minSpeechMs,
      });
    } catch (caughtError) {
      setVadSettings(DEFAULT_VAD_SETTINGS);
    }
  }

  async function startSession() {
    setError('');

    try {
      const response = await chatbotAPI.createVoiceSession();
      const freshSessionId = response.data.session_id;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      analyserDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      sourceRef.current = source;
      silenceStartedAtRef.current = null;
      utteranceStartedAtRef.current = null;
      discardCurrentRecordingRef.current = false;
      isSessionActiveRef.current = true;
      sessionIdRef.current = freshSessionId;
      lastActivityAtRef.current = Date.now();
      setSessionId(freshSessionId);
      setIsSessionActive(true);
      setIsProcessing(false);
      setMessages([]);
      setTranscript('');
      setAssistantResponse('');
      setLatencies(null);
      setStatus('Listening');
      monitorVoiceActivity();
      scheduleIdleGreeting(freshSessionId);
    } catch (caughtError) {
      setError(caughtError?.message || 'Could not start the voice session.');
      stopSession();
    }
  }

  function clearIdleGreetingTimer() {
    if (idleGreetingTimerRef.current) {
      clearTimeout(idleGreetingTimerRef.current);
      idleGreetingTimerRef.current = null;
    }
  }

  function stopSession() {
    isSessionActiveRef.current = false;
    discardCurrentRecordingRef.current = true;
    setIsSessionActive(false);
    sessionIdRef.current = '';
    setSessionId('');
    setStatus('Stopped');
    setIsProcessing(false);
    isProcessingRef.current = false;
    clearIdleGreetingTimer();

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    analyserRef.current = null;
    analyserDataRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    silenceStartedAtRef.current = null;
    utteranceStartedAtRef.current = null;
    smoothedLevelRef.current = 0;
    setDetectedLevel(0);
    window.speechSynthesis?.cancel();
  }

  function scheduleIdleGreeting(activeSessionId) {
    clearIdleGreetingTimer();
    idleGreetingTimerRef.current = setTimeout(async () => {
      if (!isSessionActiveRef.current || isProcessingRef.current) {
        scheduleIdleGreeting(activeSessionId);
        return;
      }

      const idleForMs = Date.now() - lastActivityAtRef.current;
      if (idleForMs < 120000) {
        scheduleIdleGreeting(activeSessionId);
        return;
      }

      try {
        const response = await chatbotAPI.getVoiceIdleGreeting(activeSessionId);
        const data = response.data || {};
        lastActivityAtRef.current = Date.now();
        setAssistantResponse(data.assistant_text || '');
        setMessages((current) => [
          ...current,
          { role: 'assistant', text: data.assistant_text || 'How can I help?', timestamp: new Date().toLocaleTimeString() },
        ]);
        await speakAssistantReply(data.assistant_text || '', data.assistant_audio_base64, data.assistant_audio_format);
      } catch (caughtError) {
        // Ignore occasional idle greeting failures and keep listening.
      }

      scheduleIdleGreeting(activeSessionId);
    }, 135000);
  }

  function monitorVoiceActivity() {
    const analyser = analyserRef.current;
    const data = analyserDataRef.current;
    if (!analyser || !data || !isSessionActiveRef.current) {
      return;
    }

    analyser.getByteTimeDomainData(data);
    const rawLevel = rmsFromTimeDomain(data);
    smoothedLevelRef.current = smoothedLevelRef.current * 0.82 + rawLevel * 0.18;
    const level = smoothedLevelRef.current;
    setDetectedLevel(level);

    const now = performance.now();
    const isSpeaking = level >= vadSettings.speechThreshold;
    const recorder = mediaRecorderRef.current;

    if (isSpeaking && !recorder && !isProcessingRef.current) {
      window.speechSynthesis?.cancel();
      startUtteranceRecording();
      utteranceStartedAtRef.current = now;
      silenceStartedAtRef.current = null;
      setStatus('Listening');
    } else if (recorder) {
      if (isSpeaking) {
        silenceStartedAtRef.current = null;
      } else if (!silenceStartedAtRef.current) {
        silenceStartedAtRef.current = now;
      } else {
        const silenceDuration = now - silenceStartedAtRef.current;
        const utteranceDuration = now - (utteranceStartedAtRef.current || now);
        if (silenceDuration >= vadSettings.silenceMs && utteranceDuration >= vadSettings.minSpeechMs) {
          stopUtteranceRecording();
        }
      }

      if (utteranceStartedAtRef.current && now - utteranceStartedAtRef.current >= vadSettings.maxRecordingSeconds * 1000) {
        stopUtteranceRecording();
      }
    }

    rafRef.current = requestAnimationFrame(monitorVoiceActivity);
  }

  function startUtteranceRecording() {
    if (!streamRef.current || mediaRecorderRef.current) {
      return;
    }

    chunksRef.current = [];
    const mimeType = pickRecorderMimeType();
    const recorder = mimeType
      ? new MediaRecorder(streamRef.current, { mimeType })
      : new MediaRecorder(streamRef.current);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const shouldDiscard = discardCurrentRecordingRef.current;
      const utteranceDuration = performance.now() - (utteranceStartedAtRef.current || performance.now());
      mediaRecorderRef.current = null;
      utteranceStartedAtRef.current = null;
      silenceStartedAtRef.current = null;

      if (shouldDiscard || utteranceDuration < vadSettings.minSpeechMs) {
        chunksRef.current = [];
        discardCurrentRecordingRef.current = false;
        return;
      }

      void uploadRecording();
    };

    recorder.start(200);
    mediaRecorderRef.current = recorder;
  }

  function stopUtteranceRecording() {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }
    mediaRecorderRef.current.stop();
    setStatus('Processing');
  }

  async function uploadRecording() {
    if (!sessionIdRef.current || chunksRef.current.length === 0) {
      return;
    }

    setIsProcessing(true);
    isProcessingRef.current = true;
    setStatus('Thinking');

    try {
      const startedAt = performance.now();
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      chunksRef.current = [];

      const response = await chatbotAPI.sendVoiceTurn(sessionIdRef.current, audioBlob, {
        inputLanguage: selectedLanguage.code,
        responseLanguage: selectedLanguage.label,
      });

      const data = response.data || {};
      const finishedAt = performance.now();
      lastActivityAtRef.current = Date.now();

      setTranscript(data.user_text || '');
      setAssistantResponse(data.assistant_text || '');
      setMessages((current) => [
        ...current,
        { role: 'user', text: data.user_text || 'Could not transcribe', timestamp: new Date().toLocaleTimeString() },
        { role: 'assistant', text: data.assistant_text || 'No reply received', timestamp: new Date().toLocaleTimeString() },
      ]);
      setLatencies({
        stt: data.stt_latency_ms || Math.round((finishedAt - startedAt) / 2),
        llm: data.llm_latency_ms || Math.round((finishedAt - startedAt) / 2),
      });

      await speakAssistantReply(data.assistant_text || '', data.assistant_audio_base64, data.assistant_audio_format);
      if (isSessionActiveRef.current) {
        setStatus('Listening');
      }
    } catch (caughtError) {
      setError(caughtError?.response?.data?.detail || caughtError?.message || 'Voice turn failed.');
      setStatus('Listening');
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }

  async function speakAssistantReply(text, audioBase64, audioFormat) {
    if (!text && !audioBase64) {
      return;
    }

    setStatus('Speaking');

    const usedBrowserVoice = await speakWithBrowser(text);
    if (usedBrowserVoice) {
      return;
    }

    if (audioBase64) {
      await playBackendAudio(audioBase64, audioFormat);
    }
  }

  function speakWithBrowser(text) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || !text) {
        resolve(false);
        return;
      }

      const voice = voices.find((item) => item.voiceURI === selectedVoiceURI);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage.browserLang;
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      window.speechSynthesis.speak(utterance);
    });
  }

  function playBackendAudio(audioBase64, audioFormat) {
    return new Promise((resolve) => {
      try {
        const mimeType = audioFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav';
        const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
        audioRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      } catch (caughtError) {
        resolve();
      }
    });
  }

  const getStatusColor = () => {
    if (status === 'Listening') return '#10b981';
    if (status === 'Processing' || status === 'Thinking') return '#f59e0b';
    if (status === 'Speaking') return '#06b6d4';
    return '#64748b';
  };

  return (
    <Box sx={{ minHeight: '100%', pb: 4 }}>
      <Box sx={{ mb: 4, pt: 1 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #0f766e 0%, #1d4ed8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Voice Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The main voicebot now uses the `sps_transcribe` style flow: start once, speak naturally, pause, and hear the reply.
        </Typography>
      </Box>

      <Stack spacing={3}>
        <Card
          sx={{
            p: { xs: 2.5, md: 3.5 },
            background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(29, 78, 216, 0.08) 100%)',
            border: '1px solid rgba(15, 118, 110, 0.16)',
          }}
        >
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems={{ xs: 'stretch', lg: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <SettingsVoice sx={{ color: getStatusColor() }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Live Voice Session
                </Typography>
                <Chip
                  label={status}
                  sx={{
                    bgcolor: `${getStatusColor()}18`,
                    color: getStatusColor(),
                    fontWeight: 700,
                  }}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id="voice-language-label">Response Language</InputLabel>
                  <Select
                    labelId="voice-language-label"
                    value={selectedLanguageCode}
                    label="Response Language"
                    onChange={(event) => setSelectedLanguageCode(event.target.value)}
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <MenuItem key={option.code} value={option.code}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="voice-browser-label">Browser Voice</InputLabel>
                  <Select
                    labelId="voice-browser-label"
                    value={selectedVoiceURI}
                    label="Browser Voice"
                    onChange={(event) => setSelectedVoiceURI(event.target.value)}
                  >
                    {filteredVoices.map((voice) => (
                      <MenuItem key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Mic />}
                  disabled={isSessionActive}
                  onClick={() => void startSession()}
                  sx={{
                    minWidth: 180,
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                  }}
                >
                  Start Session
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  color="error"
                  startIcon={<MicOff />}
                  disabled={!isSessionActive}
                  onClick={stopSession}
                >
                  Stop Session
                </Button>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Chip label={`Session: ${sessionId || 'not started'}`} variant="outlined" />
                <Chip label={`Mic level: ${detectedLevel.toFixed(3)}`} variant="outlined" />
                <Chip label={`Pause detect: ${vadSettings.silenceMs} ms`} variant="outlined" />
              </Stack>

              {!hasMatchingVoice && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No browser voice matched {selectedLanguage.label} on this device. The assistant may fall back to another installed voice.
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}
            </Box>

            <Box
              sx={{
                width: { xs: '100%', lg: 320 },
                minHeight: 280,
                borderRadius: 5,
                p: 3,
                color: 'white',
                background: `radial-gradient(circle at top, ${getStatusColor()} 0%, #0f172a 58%, #020617 100%)`,
                boxShadow: `0 24px 60px ${getStatusColor()}35`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <GraphicEq sx={{ fontSize: 88 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center' }}>
                {status}
              </Typography>
              <Box sx={{ width: '100%' }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(detectedLevel * 6000, 100)}
                  sx={{
                    height: 10,
                    borderRadius: 999,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#ffffff',
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.82, textAlign: 'center' }}>
                Speak naturally. When you pause, the current utterance is sent automatically.
              </Typography>
            </Box>
          </Stack>
        </Card>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          <Paper sx={{ flex: 1.5, p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Conversation
            </Typography>
            <Stack spacing={1.5} sx={{ maxHeight: 520, overflowY: 'auto' }}>
              {messages.length === 0 && (
                <Typography color="text.secondary">
                  Start a session and speak. Each pause becomes one turn, just like the `sps_transcribe` voicebot.
                </Typography>
              )}
              {messages.map((message, index) => (
                <Paper
                  key={`${message.role}-${index}`}
                  sx={{
                    p: 2,
                    ml: message.role === 'assistant' ? 0 : { xs: 0, md: 6 },
                    mr: message.role === 'assistant' ? { xs: 0, md: 6 } : 0,
                    color: message.role === 'assistant' ? '#0f172a' : 'white',
                    background:
                      message.role === 'assistant'
                        ? 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)'
                        : 'linear-gradient(135deg, #0f766e 0%, #0f172a 100%)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {message.role === 'assistant' ? 'Assistant' : 'You'}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {message.timestamp}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">{message.text}</Typography>
                </Paper>
              ))}
            </Stack>
          </Paper>

          <Stack spacing={3} sx={{ flex: 1 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Current Turn
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    You said
                  </Typography>
                  <Typography variant="body2">{transcript || 'Waiting for speech...'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Assistant reply
                  </Typography>
                  <Typography variant="body2">{assistantResponse || 'The next reply will appear here.'}</Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Voice Pipeline
              </Typography>
              <Stack spacing={1.25}>
                <Typography variant="body2">STT latency: {latencies ? `${latencies.stt} ms` : '-'}</Typography>
                <Typography variant="body2">LLM latency: {latencies ? `${latencies.llm} ms` : '-'}</Typography>
                <Typography variant="body2">Speech threshold: {vadSettings.speechThreshold}</Typography>
                <Typography variant="body2">Minimum speech: {vadSettings.minSpeechMs} ms</Typography>
                <Typography variant="body2">Max utterance: {vadSettings.maxRecordingSeconds}s</Typography>
                <Typography variant="body2">
                  Output voice: {selectedVoiceURI ? 'browser speech synthesis' : 'browser default or backend audio'}
                </Typography>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #ecfeff 100%)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                How It Works
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">1. Start the session once.</Typography>
                <Typography variant="body2">2. Speak normally without pressing and holding a mic button.</Typography>
                <Typography variant="body2">3. When you pause, the utterance is sent automatically.</Typography>
                <Typography variant="body2">4. The assistant responds and speaks back in the selected browser voice when available.</Typography>
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default VoiceBot;
