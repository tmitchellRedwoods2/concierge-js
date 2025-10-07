/**
 * AI Agents page
 */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AIAgentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [agents, setAgents] = useState([
    { id: 1, name: "Financial Advisor AI", type: "Investment", status: "Active", lastActive: "2024-01-15 14:30", tasks: 12, description: "Helps with investment decisions and portfolio optimization" },
    { id: 2, name: "Expense Tracker AI", type: "Finance", status: "Active", lastActive: "2024-01-15 10:15", tasks: 8, description: "Monitors spending patterns and suggests budget optimizations" },
    { id: 3, name: "Health Coach AI", type: "Health", status: "Inactive", lastActive: "2024-01-14 16:45", tasks: 5, description: "Provides health insights and wellness recommendations" },
  ]);
  const [conversations, setConversations] = useState([
    { id: 1, agent: "Financial Advisor AI", message: "Your portfolio has gained 3.2% this month. Consider rebalancing your tech stocks.", timestamp: "2024-01-15 14:30", type: "suggestion" },
    { id: 2, agent: "Expense Tracker AI", message: "You've spent 15% more on dining this month. Would you like budget recommendations?", timestamp: "2024-01-15 10:15", type: "alert" },
    { id: 3, agent: "Health Coach AI", message: "Your step count is below target. Try taking a 10-minute walk.", timestamp: "2024-01-14 16:45", type: "reminder" },
  ]);
  const [newQuery, setNewQuery] = useState("");

  const sendQuery = () => {
    if (newQuery.trim()) {
      const conversation = {
        id: conversations.length + 1,
        agent: "General AI Assistant",
        message: `Query: "${newQuery}" - I'm analyzing your request and will provide personalized recommendations based on your financial profile.`,
        timestamp: new Date().toLocaleString(),
        type: "response"
      };
      setConversations([conversation, ...conversations]);
      setNewQuery("");
    }
  };

  const activeAgents = agents.filter(agent => agent.status === 'Active').length;
  const totalTasks = agents.reduce((sum, agent) => sum + agent.tasks, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">🏆 Concierge.com</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name}
              </span>
              <Button
                onClick={() => router.push("/")}
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
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="whitespace-nowrap text-xs px-3 py-2">
              🏠 Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/expenses")} className="whitespace-nowrap text-xs px-3 py-2">
              💰 Expenses
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/investments")} className="whitespace-nowrap text-xs px-3 py-2">
              📈 Investments
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/health")} className="whitespace-nowrap text-xs px-3 py-2">
              🏥 Health
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/insurance")} className="whitespace-nowrap text-xs px-3 py-2">
              🛡️ Insurance
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/legal")} className="whitespace-nowrap text-xs px-3 py-2">
              ⚖️ Legal
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/tax")} className="whitespace-nowrap text-xs px-3 py-2">
              📊 Tax
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/travel")} className="whitespace-nowrap text-xs px-3 py-2">
              ✈️ Travel
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/messages")} className="whitespace-nowrap text-xs px-3 py-2">
              💬 Messages
            </Button>
            <Button variant="ghost" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">
              🤖 AI Agents
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="whitespace-nowrap text-xs px-3 py-2">
              ⚙️ Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 AI Agents
          </h1>
          <p className="text-gray-600">
            Your intelligent assistants for financial and life management
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {activeAgents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalTasks}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {conversations.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Query Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ask Your AI Assistant</CardTitle>
            <CardDescription>Get personalized recommendations and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Ask about investments, expenses, health, or any financial question..."
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendQuery()}
                />
                <Button onClick={sendQuery} disabled={!newQuery.trim()}>
                  Ask AI
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setNewQuery("How can I optimize my investment portfolio?")}>
                  Investment Help
                </Button>
                <Button variant="outline" size="sm" onClick={() => setNewQuery("What are my biggest expense categories?")}>
                  Expense Analysis
                </Button>
                <Button variant="outline" size="sm" onClick={() => setNewQuery("How can I improve my health metrics?")}>
                  Health Tips
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Agents List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your AI Agents</CardTitle>
            <CardDescription>Specialized AI assistants for different aspects of your life</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{agent.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agent.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.status}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {agent.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{agent.description}</p>
                    <p className="text-sm text-gray-500">Last active: {agent.lastActive} • {agent.tasks} tasks completed</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>AI Conversations</CardTitle>
            <CardDescription>Recent interactions with your AI agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{conversation.agent}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        conversation.type === 'suggestion' ? 'bg-blue-100 text-blue-800' :
                        conversation.type === 'alert' ? 'bg-red-100 text-red-800' :
                        conversation.type === 'reminder' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {conversation.type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-700">{conversation.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
