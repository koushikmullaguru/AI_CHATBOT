import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { Message } from '../types';

interface DiscussionModeProps {
  onSendMessage: (message: string) => void;
}

export function DiscussionMode({ onSendMessage }: DiscussionModeProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your AI discussion partner. Let's have a conversation about any topic you're learning. You can type or use voice input!",
      sender: 'ai',
      timestamp: new Date(),
      suggestedQuestions: [
        'Let\'s discuss photosynthesis',
        'Can we talk about World War II?',
        'Explain Newton\'s laws of motion',
        'Discuss Shakespeare\'s writing style'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check microphone permission on mount
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
        result.onchange = () => {
          setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
        };
      }).catch(() => {
        // If permissions API is not supported, assume prompt
        setMicPermission('prompt');
      });
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // In a real app, you would send this to a speech-to-text API
        // For demo purposes, we'll simulate transcription
        handleVoiceInput('This is a demo transcription of your voice input. In production, this would be actual speech-to-text conversion.');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setMicPermission('granted');

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setMicPermission('denied');
        } else if (error.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else {
          alert('Could not access microphone. Please check your browser settings and try again.');
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleVoiceInput = (transcribedText: string) => {
    handleSendMessage(transcribedText);
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateDiscussionResponse(content);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        sender: 'ai',
        timestamp: new Date(),
        suggestedQuestions: aiResponse.suggestedQuestions,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-speak in discussion mode
      speakText(aiResponse.content);
    }, 1000);
  };

  const generateDiscussionResponse = (userMessage: string): { content: string; suggestedQuestions: string[] } => {
    return {
      content: `That's an interesting point about ${userMessage.slice(0, 50)}... Let me share my thoughts on this.\n\nFrom an educational perspective, this concept connects to several key ideas. The fundamental principle here is about understanding the relationship between different elements.\n\nWhat aspects would you like to explore further? I'm here to discuss this in depth with you.`,
      suggestedQuestions: [
        'Can you explain that differently?',
        'How does this relate to real life?',
        'What are some examples?',
        'Why is this important to learn?'
      ]
    };
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Discussion Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl mb-1">🎙️ Discussion Mode</h3>
          <p className="text-sm text-teal-50">
            Have a natural conversation with AI - Type or speak naturally!
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex gap-4 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                    message.sender === 'user'
                      ? 'bg-teal-500'
                      : 'bg-gradient-to-br from-cyan-500 to-blue-500'
                  }`}
                >
                  {message.sender === 'user' ? '👤' : '🤖'}
                </div>

                <div
                  className={`flex-1 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block max-w-3xl px-5 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-teal-500 text-white'
                        : 'bg-white dark:bg-gray-800 shadow-md dark:text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>

                  {message.sender === 'ai' && message.suggestedQuestions && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Continue the discussion:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestedQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleSendMessage(question)}
                            className="text-sm px-4 py-2 bg-white dark:bg-gray-700 border border-teal-200 dark:border-teal-600 hover:bg-teal-50 dark:hover:bg-gray-600 rounded-lg transition-colors dark:text-white"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Recording Status */}
          {isRecording && (
            <div className="mb-4 flex items-center justify-center gap-3 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span>Recording: {formatTime(recordingTime)}</span>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-3 items-end">
            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputText);
                  }
                }}
                placeholder="Type your message or use voice input..."
                rows={1}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent max-h-32 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Voice Button */}
            {micPermission === 'denied' ? (
              <div className="relative group">
                <button
                  type="button"
                  className="flex-shrink-0 p-3 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                  disabled
                >
                  <MicOff className="w-5 h-5" />
                </button>
                <div className="absolute bottom-full mb-2 right-0 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Microphone access denied. Please enable it in your browser settings.
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-shrink-0 p-3 rounded-lg transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-teal-500 hover:bg-teal-600 text-white'
                }`}
                title={micPermission === 'prompt' ? 'Click to enable microphone' : 'Record voice message'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim()}
              className="flex-shrink-0 p-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>

            {/* Speaker Button */}
            <button
              type="button"
              onClick={isSpeaking ? stopSpeaking : undefined}
              className={`flex-shrink-0 p-3 rounded-lg transition-colors ${
                isSpeaking
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            Click mic to record voice • AI responses are spoken automatically
            {micPermission === 'denied' && (
              <span className="block text-red-500 mt-1">
                ⚠️ Microphone access denied. Enable it in browser settings to use voice input.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}