/**
 * Legal page
 */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LegalPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cases, setCases] = useState([
    { id: 1, title: "Estate Planning", attorney: "Smith & Associates", status: "In Progress", priority: "High", nextMeeting: "2024-02-15" },
    { id: 2, title: "Business Contract Review", attorney: "Johnson Legal", status: "Completed", priority: "Medium", nextMeeting: "2024-01-30" },
    { id: 3, title: "Real Estate Transaction", attorney: "Davis Law Firm", status: "Pending", priority: "Low", nextMeeting: "2024-03-01" },
  ]);
  const [documents, setDocuments] = useState([
    { id: 1, name: "Will and Testament", type: "Estate", date: "2024-01-10", status: "Signed" },
    { id: 2, name: "Business Partnership Agreement", type: "Contract", date: "2024-01-15", status: "Draft" },
    { id: 3, name: "Property Deed", type: "Real Estate", date: "2024-01-20", status: "Pending Review" },
  ]);
  const [newCase, setNewCase] = useState({ title: "", attorney: "", priority: "", nextMeeting: "" });

  const addCase = () => {
    if (newCase.title && newCase.attorney && newCase.priority) {
      const caseItem = {
        id: cases.length + 1,
        title: newCase.title,
        attorney: newCase.attorney,
        status: "Pending",
        priority: newCase.priority,
        nextMeeting: newCase.nextMeeting
      };
      setCases([...cases, caseItem]);
      setNewCase({ title: "", attorney: "", priority: "", nextMeeting: "" });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

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
            <Button variant="ghost" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">
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
            ⚖️ Legal Services
          </h1>
          <p className="text-gray-600">
            Manage your legal cases and documents
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {cases.filter(c => c.status === 'In Progress').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {documents.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {cases.filter(c => c.nextMeeting && new Date(c.nextMeeting) > new Date()).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Case Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Legal Case</CardTitle>
            <CardDescription>Track a new legal matter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Case Title"
                value={newCase.title}
                onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
              />
              <Input
                placeholder="Attorney/Law Firm"
                value={newCase.attorney}
                onChange={(e) => setNewCase({ ...newCase, attorney: e.target.value })}
              />
              <select
                value={newCase.priority}
                onChange={(e) => setNewCase({ ...newCase, priority: e.target.value })}
                className="p-2 border rounded-md"
              >
                <option value="">Select Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <Input
                type="date"
                value={newCase.nextMeeting}
                onChange={(e) => setNewCase({ ...newCase, nextMeeting: e.target.value })}
              />
              <Button onClick={addCase} className="w-full md:col-span-1">
                Add Case
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Legal Cases</CardTitle>
            <CardDescription>Your active and completed legal matters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <div key={caseItem.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{caseItem.title}</h3>
                    <p className="text-sm text-gray-600">{caseItem.attorney}</p>
                    <p className="text-sm text-gray-500">Next Meeting: {caseItem.nextMeeting}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(caseItem.priority)}`}>
                      {caseItem.priority}
                    </span>
                    <p className={`text-sm mt-1 ${caseItem.status === 'Completed' ? 'text-green-600' : caseItem.status === 'In Progress' ? 'text-blue-600' : 'text-orange-600'}`}>
                      {caseItem.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Documents</CardTitle>
            <CardDescription>Your legal documents and contracts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{doc.name}</h3>
                    <p className="text-sm text-gray-600">{doc.type} • {doc.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${doc.status === 'Signed' ? 'text-green-600' : doc.status === 'Draft' ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {doc.status}
                    </p>
                    <Button variant="outline" size="sm" className="mt-1">
                      View
                    </Button>
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
