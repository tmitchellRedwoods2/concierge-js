/**
 * Messages page
 */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MessagesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState([
    { id: 1, from: "Concierge Team", subject: "Welcome to your new account", content: "Thank you for joining Concierge.com! We're here to help manage your financial life.", timestamp: "2024-01-15 10:30", read: false, priority: "Normal" },
    { id: 2, from: "Investment Advisor", subject: "Portfolio Update", content: "Your portfolio has gained 3.2% this month. Would you like to schedule a review?", timestamp: "2024-01-14 14:20", read: true, priority: "High" },
    { id: 3, from: "Tax Specialist", subject: "Tax Documents Ready", content: "Your 2023 tax documents are ready for review. Please log in to download them.", timestamp: "2024-01-13 09:15", read: true, priority: "Normal" },
  ]);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "Reminder", message: "Insurance payment due in 3 days", timestamp: "2024-01-15 08:00", read: false },
    { id: 2, type: "Alert", message: "Investment threshold reached", timestamp: "2024-01-14 16:30", read: false },
    { id: 3, type: "Update", message: "New feature: AI Agents available", timestamp: "2024-01-13 12:00", read: true },
  ]);
  const [newMessage, setNewMessage] = useState({ to: "", subject: "", content: "" });

  const sendMessage = () => {
    if (newMessage.to && newMessage.subject && newMessage.content) {
      const message = {
        id: messages.length + 1,
        from: session?.user?.name || "You",
        subject: newMessage.subject,
        content: newMessage.content,
        timestamp: new Date().toLocaleString(),
        read: true,
        priority: "Normal"
      };
      setMessages([message, ...messages]);
      setNewMessage({ to: "", subject: "", content: "" });
    }
  };

  const unreadMessages = messages.filter(m => !m.read).length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

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
            <Button variant="ghost" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">
              💬 Messages
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/ai-agents")} className="whitespace-nowrap text-xs px-3 py-2">
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
            💬 Messages & Communication
          </h1>
          <p className="text-gray-600">
            Stay connected with your concierge team
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unread Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {unreadMessages}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {unreadNotifications}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {messages.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Send Message Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
            <CardDescription>Contact your concierge team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="To (e.g., Investment Advisor, Tax Specialist)"
                value={newMessage.to}
                onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
              />
              <Input
                placeholder="Subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
              />
              <textarea
                placeholder="Message content..."
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                className="w-full p-3 border rounded-md h-24 resize-none"
              />
              <Button onClick={sendMessage} className="w-full">
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Your communication with the concierge team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`p-4 border rounded-lg ${!message.read ? 'bg-blue-50 border-blue-200' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{message.from}</h3>
                        {!message.read && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          message.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {message.priority}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{message.subject}</h4>
                      <p className="text-sm text-gray-600 mb-2">{message.content}</p>
                      <p className="text-xs text-gray-500">{message.timestamp}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Reply
                      </Button>
                      {!message.read && (
                        <Button variant="ghost" size="sm">
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>System alerts and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className={`p-4 border rounded-lg ${!notification.read ? 'bg-orange-50 border-orange-200' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          notification.type === 'Alert' ? 'bg-red-100 text-red-800' : 
                          notification.type === 'Reminder' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.type}
                        </span>
                        {!notification.read && <span className="w-2 h-2 bg-orange-600 rounded-full"></span>}
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-500">{notification.timestamp}</p>
                    </div>
                    {!notification.read && (
                      <Button variant="ghost" size="sm">
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
