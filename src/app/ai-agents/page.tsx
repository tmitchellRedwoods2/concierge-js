'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AI_AGENTS } from '@/lib/openai';

export default function AIAgentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
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
    if (mounted) {
      loadStats();
    }
  }, [mounted]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/chat/sessions?agentType=all');
      const data = await res.json();
      
      // Count messages by agent type
      const agentStats: any = {};
      data.sessions?.forEach((session: any) => {
        if (!agentStats[session.agentType]) {
          agentStats[session.agentType] = 0;
        }
        agentStats[session.agentType] += session.messageCount;
      });
      
      setStats(agentStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const startChatWithAgent = (agentType: string) => {
    router.push(`/messages?agent=${agentType}`);
  };

  if (status === 'loading' || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 items-center justify-center bg-white p-2 rounded-lg shadow-sm">
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
            variant="ghost"
            size="sm"
            className="text-xs px-3 py-2"
            onClick={() => router.push('/messages')}
          >
            💬 Messages
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-xs px-3 py-2"
          >
            🤖 AI Agents
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

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🤖 AI Agents</h1>
          <p className="text-gray-600">
            Specialized AI assistants to help you with different aspects of your life
          </p>
        </div>

        {/* AI Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(AI_AGENTS).map(([key, agent]) => (
            <Card key={key} className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center mb-4">
                <div className="text-5xl mb-3">{agent.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {agent.systemPrompt.split('\n')[0].replace('You are a', 'I am a').replace('You are an', 'I am an')}
                  </p>
                </div>

                <div className="text-center">
                  {stats[key] > 0 && (
                    <p className="text-sm text-gray-600 mb-3">
                      💬 {stats[key]} messages exchanged
                    </p>
                  )}
                  <Button
                    onClick={() => startChatWithAgent(key)}
                    className="w-full"
                  >
                    Start Conversation
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Instant Responses</h3>
            <p className="text-sm text-gray-600">
              Get immediate answers and guidance powered by advanced AI technology
            </p>
          </Card>

          <Card className="p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Specialized Expertise</h3>
            <p className="text-sm text-gray-600">
              Each agent is trained with specific knowledge in their domain
            </p>
          </Card>

          <Card className="p-6">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Private & Secure</h3>
            <p className="text-sm text-gray-600">
              Your conversations are encrypted and only visible to you
            </p>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mt-12 p-6">
          <h2 className="text-2xl font-bold mb-4">How AI Agents Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">Choose an Agent</h4>
              <p className="text-sm text-gray-600">
                Select the AI assistant that matches your needs
              </p>
            </div>
            <div>
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">Ask Questions</h4>
              <p className="text-sm text-gray-600">
                Type your questions or describe what you need help with
              </p>
            </div>
            <div>
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">Get Expert Advice</h4>
              <p className="text-sm text-gray-600">
                Receive personalized recommendations and guidance
              </p>
            </div>
            <div>
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-blue-600">4</span>
              </div>
              <h4 className="font-semibold mb-2">Take Action</h4>
              <p className="text-sm text-gray-600">
                Implement suggestions and track your progress
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
