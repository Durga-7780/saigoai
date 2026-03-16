/**
 * AI Chatbot Page
 * Interactive AI assistant for employee queries + hands-free voicebot mode.
 */
import { GraphicEq, Person, Refresh, Send, SmartToy, VolumeUp } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { chatbotAPI } from '../services/api';

const RECORDING_WINDOW_MS = 6000;

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: "Hi, I'm Saigo Assist. I can help you with attendance, leave, and app usage.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceSessionId, setVoiceSessionId] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [voiceState, setVoiceState] = useState('idle'); // idle | listening | thinking | speaking

  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordStopTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const audioRef = useRef(null);

  const voiceOpenRef = useRef(false);
  const voiceSessionIdRef = useRef('');
  const voiceStateRef = useRef('idle');
  const activeListeningRef = useRef(false);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    fetchSuggestions();
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    voiceOpenRef.current = voiceOpen;
    voiceSessionIdRef.current = voiceSessionId;
  }, [voiceOpen, voiceSessionId]);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSuggestions = async () => {
    try {
      const response = await chatbotAPI.getSuggestions();
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleSend = async (query = input) => {
    if (!query.trim()) return;

    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotAPI.ask({ query });
      const botMessage = {
        role: 'bot',
        content: response.data.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stopMediaCapture = () => {
    if (recordStopTimerRef.current) {
      clearTimeout(recordStopTimerRef.current);
      recordStopTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const stopAllVoiceOutput = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const closeVoicebot = () => {
    activeListeningRef.current = false;
    setVoiceOpen(false);
    setVoiceState('idle');
    setVoiceSessionId('');
    setVoiceError('');
    stopMediaCapture();
    stopAllVoiceOutput();
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const speakFallbackText = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !text) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

  const playAssistantAudio = async (audioBase64, assistantText, audioFormat = 'wav') => {
    setVoiceState('speaking');
    try {
      if (audioBase64) {
        await new Promise((resolve, reject) => {
          const mime = audioFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav';
          const audio = new Audio(`data:${mime};base64,${audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error('audio playback failed'));
          audio.play().catch(reject);
        });
      } else {
        await speakFallbackText(assistantText);
      }
    } catch (error) {
      await speakFallbackText(assistantText);
    } finally {
      setVoiceState('idle');
    }
  };

  const startChunkRecorder = async () => {
    if (!activeListeningRef.current || !voiceOpenRef.current || !voiceSessionIdRef.current) return;

    try {
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const chunks = [];
      const recorder = new MediaRecorder(mediaStreamRef.current);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = async () => {
        if (!activeListeningRef.current || !voiceOpenRef.current || !voiceSessionIdRef.current) return;
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        if (audioBlob.size < 3000) {
          setVoiceState('listening');
          startChunkRecorder();
          return;
        }

        setVoiceState('thinking');
        try {
          const response = await chatbotAPI.sendVoiceTurn(voiceSessionIdRef.current, audioBlob);
          const data = response.data || {};
          lastActivityRef.current = Date.now();
          await playAssistantAudio(
            data.assistant_audio_base64,
            data.assistant_text || '',
            data.assistant_audio_format || 'wav'
          );
        } catch (error) {
          setVoiceError(error?.response?.data?.detail || 'Voice processing failed.');
          setVoiceState('idle');
        }

        if (activeListeningRef.current && voiceOpenRef.current && voiceSessionIdRef.current) {
          setVoiceState('listening');
          startChunkRecorder();
        }
      };

      recorder.start();
      setVoiceState('listening');
      recordStopTimerRef.current = setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, RECORDING_WINDOW_MS);
    } catch (error) {
      setVoiceError('Microphone access denied or unavailable.');
      setVoiceState('idle');
    }
  };

  const scheduleIdleGreeting = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    const waitMs = 120000 + Math.floor(Math.random() * 60000);
    idleTimerRef.current = setTimeout(async () => {
      const idleMs = Date.now() - lastActivityRef.current;
      const canGreet =
        voiceOpenRef.current &&
        voiceSessionIdRef.current &&
        activeListeningRef.current &&
        (voiceStateRef.current === 'idle' || voiceStateRef.current === 'listening') &&
        idleMs >= 120000;

      if (!canGreet) {
        scheduleIdleGreeting();
        return;
      }

      try {
        const response = await chatbotAPI.getVoiceIdleGreeting(voiceSessionIdRef.current);
        const data = response.data || {};
        lastActivityRef.current = Date.now();
        await playAssistantAudio(
          data.assistant_audio_base64,
          data.assistant_text || '',
          data.assistant_audio_format || 'wav'
        );
      } catch (error) {
        // no-op
      }
      scheduleIdleGreeting();
    }, waitMs);
  };

  const openVoicebot = async () => {
    setVoiceOpen(true);
    setVoiceError('');
    setVoiceState('idle');
    lastActivityRef.current = Date.now();
    try {
      const response = await chatbotAPI.createVoiceSession();
      const sessionId = response.data.session_id;
      setVoiceSessionId(sessionId);
      activeListeningRef.current = true;
      setVoiceState('listening');
      await startChunkRecorder();
      scheduleIdleGreeting();
    } catch (error) {
      setVoiceError('Failed to start voice session.');
      setVoiceState('idle');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  const getVoiceLabel = () => {
    if (voiceState === 'listening') return 'Listening... Speak naturally (continuous mode)';
    if (voiceState === 'thinking') return 'Thinking...';
    if (voiceState === 'speaking') return 'Speaking...';
    return 'Preparing voice assistant...';
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            AI Assistant
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ask me anything about attendance, leaves, policies, and more
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={openVoicebot}
          startIcon={<GraphicEq />}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1.4,
            background: 'linear-gradient(135deg, #0f766e 0%, #155e75 100%)',
          }}
        >
          Voice Bot
        </Button>
      </Box>

      <Card
        sx={{
          height: 'calc(100vh - 280px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 2,
              }}
            >
              {message.role === 'bot' && (
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <SmartToy />
                </Avatar>
              )}
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: message.role === 'user' ? 'primary.main' : 'white',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                  borderRadius: 3,
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Paper>
              {message.role === 'user' && (
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <Person />
                </Avatar>
              )}
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <SmartToy />
              </Avatar>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="body1">Thinking...</Typography>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {(suggestions || []).length > 0 && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Quick suggestions:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <Button
              variant="contained"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              sx={{
                minWidth: 56,
                height: 56,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <Send />
            </Button>
            <IconButton
              onClick={fetchSuggestions}
              sx={{
                minWidth: 56,
                height: 56,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Refresh />
            </IconButton>
          </Box>
        </Box>
      </Card>

      <Dialog open={voiceOpen} onClose={closeVoicebot} fullWidth maxWidth="md">
        <Box
          sx={{
            p: { xs: 2, sm: 4 },
            minHeight: 430,
            background: 'radial-gradient(circle at 20% 20%, #0f172a 0%, #1e293b 45%, #0b1120 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            '@keyframes ringPulse': {
              '0%': { transform: 'scale(0.95)', opacity: 0.9 },
              '50%': { transform: 'scale(1.05)', opacity: 1 },
              '100%': { transform: 'scale(0.95)', opacity: 0.9 },
            },
            '@keyframes wave': {
              '0%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.45)' },
              '70%': { boxShadow: '0 0 0 26px rgba(34,197,94,0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0)' },
            },
            '@keyframes speaking': {
              '0%': { transform: 'scale(1)' },
              '25%': { transform: 'scale(1.07)' },
              '50%': { transform: 'scale(0.96)' },
              '75%': { transform: 'scale(1.06)' },
              '100%': { transform: 'scale(1)' },
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Voice Assistant
            </Typography>
            <Button onClick={closeVoicebot} variant="outlined" sx={{ color: 'white', borderColor: 'white' }}>
              Close
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Box
              sx={{
                width: 210,
                height: 210,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  voiceState === 'listening'
                    ? 'radial-gradient(circle, #22c55e 0%, #15803d 70%)'
                    : voiceState === 'thinking'
                    ? 'radial-gradient(circle, #f59e0b 0%, #b45309 70%)'
                    : voiceState === 'speaking'
                    ? 'radial-gradient(circle, #38bdf8 0%, #0369a1 70%)'
                    : 'radial-gradient(circle, #94a3b8 0%, #334155 70%)',
                animation:
                  voiceState === 'listening'
                    ? 'ringPulse 1.2s ease-in-out infinite, wave 1.8s linear infinite'
                    : voiceState === 'speaking'
                    ? 'speaking 1s ease-in-out infinite'
                    : 'ringPulse 2.2s ease-in-out infinite',
                transition: 'all 0.3s ease',
              }}
            >
              <VolumeUp sx={{ fontSize: 64, color: 'white' }} />
            </Box>
          </Box>

          <Typography variant="h6" sx={{ textAlign: 'center', opacity: 0.95 }}>
            {getVoiceLabel()}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.75 }}>
            Continuous listening is active. Click Close to stop.
          </Typography>

          {voiceError && (
            <Paper sx={{ p: 1.5, bgcolor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)' }}>
              <Typography variant="body2">{voiceError}</Typography>
            </Paper>
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default Chatbot;
