'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AI_AGENTS } from '@/lib/openai';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatSession {
  _id: string;
  sessionId: string;
  title: string;
  agentType: string;
  lastMessageAt: string;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<keyof typeof AI_AGENTS>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    loadSessions();
  }, [selectedAgent]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const res = await fetch(`/api/chat/sessions?agentType=${selectedAgent}`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    const userMessage = inputMessage;
    setInputMessage('');

    // Optimistically add user message
    const tempMessage: Message = {
      _id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSessionId,
          agentType: selectedAgent,
        }),
      });

      const data = await res.json();

      if (!currentSessionId) {
        setCurrentSessionId(data.sessionId);
        loadSessions();
      }

    // Replace temp message with real ones
    if (data.userMessage && data.assistantMessage) {
      setMessages((prev) => [
        ...prev.filter((m) => m._id !== tempMessage._id),
        data.userMessage,
        data.assistantMessage,
      ]);
    } else {
      console.error('Invalid response from API:', data);
      setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
    }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('rate limit')) {
        alert('AI service is temporarily unavailable due to usage limits. Please try again in a few minutes.');
      } else {
        alert('Failed to send message. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch('/api/chat/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      loadSessions();
      if (currentSessionId === sessionId) {
        startNewChat();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  if (status === 'loading' || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="w-full px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">🏆 Concierge.com</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name}
              </span>
              <Button
                onClick={() => {
                  // Use dynamic import to avoid SSR issues
                  import('next-auth/react').then(({ signOut }) => {
                    signOut({ callbackUrl: '/' });
                  });
                }}
                variant="outline"
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Tabs */}
      <div className="bg-gray-50 border-b">
        <div className="w-full px-4">
          <div className="flex overflow-x-auto gap-1 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-3 py-2"
            onClick={() => router.push('/dashboard')}
          >
            🏠 Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-3 py-2"
            onClick={() => router.push('/expenses')}
          >
            💰 Expenses
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-3 py-2"
            onClick={() => router.push('/investments')}
          >
            📈 Investments
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-3 py-2"
            onClick={() => router.push('/health')}
          >
            🏥 Health
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-3 py-2"
            onClick={() => router.push('/insurance')}
          >
            🛡️ Insurance
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-3 py-2"
            onClick={() => router.push('/legal')}
          >
            ⚖️ Legal
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-3 py-2"
            onClick={() => router.push('/tax')}
          >
            💵 Tax
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-3 py-2"
            onClick={() => router.push('/travel')}
          >
            ✈️ Travel
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-xs px-3 py-2"
          >
            💬 Messages
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-3 py-2"
            onClick={() => router.push('/settings')}
          >
            ⚙️ Settings
          </Button>
        </div>
        </div>
      </div>

      {/* AI Advisor Selector Bar */}
      <div className="bg-gray-800 border-b">
        <div className="w-full px-4 py-2">
          <div className="flex overflow-x-auto gap-2">
            {Object.entries(AI_AGENTS).map(([key, agent]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedAgent(key as keyof typeof AI_AGENTS);
                  startNewChat();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  selectedAgent === key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                <span className="text-sm">{agent.icon}</span>
                <span className="text-xs font-medium">{agent.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <Card className="h-full p-3">
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold mb-1">💬 Messages</h2>
                  <p className="text-xs text-gray-600 mb-2">
                    Chat with AI assistants
                  </p>
                </div>

                {/* Current Agent Display */}
                <div className="bg-blue-50 p-2 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{AI_AGENTS[selectedAgent].icon}</span>
                    <span className="font-medium text-sm">{AI_AGENTS[selectedAgent].name}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-tight">
                    {AI_AGENTS[selectedAgent].systemPrompt.split('\n')[0]}
                  </p>
                </div>

                <Button onClick={startNewChat} className="w-full" size="sm">
                  + New Chat
                </Button>

                {/* Chat History */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Recent Chats</h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div
                          key={session.sessionId}
                          className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                            currentSessionId === session.sessionId ? 'bg-gray-100' : ''
                          }`}
                        >
                          <div
                            onClick={() => setCurrentSessionId(session.sessionId)}
                            className="flex-1"
                          >
                            <p className="text-sm font-medium truncate">{session.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.lastMessageAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.sessionId);
                            }}
                            className="text-red-500 hover:text-red-700 p-1 h-auto"
                          >
                            🗑️
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-9">
            <Card className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">
                  {AI_AGENTS[selectedAgent].icon} {AI_AGENTS[selectedAgent].name}
                </h2>
                <p className="text-sm text-gray-600">
                  Ask me anything about {selectedAgent === 'general' ? 'the platform' : selectedAgent}
                </p>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <p className="text-4xl mb-4">{AI_AGENTS[selectedAgent].icon}</p>
                      <p className="text-lg font-medium">
                        Start a conversation with {AI_AGENTS[selectedAgent].name}
                      </p>
                      <p className="text-sm mt-2">
                        Type a message below to get started
                      </p>
                    </div>
                  ) : (
                    messages.filter(msg => msg && msg.role && msg.content).map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Typing...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
