/**
 * AI-Only Client Dashboard
 * Ultra-minimal dashboard for clients who only interact via AI agents
 * Shows only AI chat interface
 */
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot, ArrowRight, Sparkles } from 'lucide-react';

export default function AIOnlyDashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full">
              <Bot className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {session?.user?.name}!
          </h1>
          <p className="text-gray-600 text-lg">
            Your AI-powered concierge is ready to help
          </p>
        </div>

        {/* Main AI Chat Card */}
        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
            <CardTitle className="text-2xl">Chat with Your AI Concierge</CardTitle>
            <CardDescription className="text-base mt-2">
              I'm here to help with everything - appointments, finances, health, travel, and more.
              Just ask me anything!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push('/messages')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              size="lg"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Start Chatting
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Card className="bg-white/50">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Quick Examples</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• "Schedule a doctor appointment"</li>
                    <li>• "Check my calendar"</li>
                    <li>• "What's my portfolio value?"</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-white/50">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">I Can Help With</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Calendar management</li>
                    <li>• Health & appointments</li>
                    <li>• Financial questions</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800 text-center">
              <strong>AI-Only Mode:</strong> All interactions happen through chat. 
              Your AI agent handles everything automatically in the background.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

