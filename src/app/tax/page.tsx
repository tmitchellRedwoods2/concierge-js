/**
 * Tax page
 */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TaxPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [taxDocuments, setTaxDocuments] = useState([
    { id: 1, name: "W-2 Form", year: "2023", type: "Income", status: "Received", dueDate: "2024-01-31" },
    { id: 2, name: "1099-INT", year: "2023", type: "Interest", status: "Received", dueDate: "2024-01-31" },
    { id: 3, name: "Charitable Donations", year: "2023", type: "Deduction", status: "Pending", dueDate: "2024-04-15" },
  ]);
  const [deductions, setDeductions] = useState([
    { id: 1, category: "Business Expenses", amount: 2500, description: "Office supplies and equipment" },
    { id: 2, category: "Medical Expenses", amount: 1200, description: "Health insurance premiums" },
    { id: 3, category: "Charitable Contributions", amount: 800, description: "Donations to charity" },
  ]);
  const [newDocument, setNewDocument] = useState({ name: "", year: "", type: "", dueDate: "" });

  const addDocument = () => {
    if (newDocument.name && newDocument.year && newDocument.type) {
      const document = {
        id: taxDocuments.length + 1,
        name: newDocument.name,
        year: newDocument.year,
        type: newDocument.type,
        status: "Pending",
        dueDate: newDocument.dueDate
      };
      setTaxDocuments([...taxDocuments, document]);
      setNewDocument({ name: "", year: "", type: "", dueDate: "" });
    }
  };

  const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);

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
            <Button variant="ghost" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">
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
            📊 Tax Planning
          </h1>
          <p className="text-gray-600">
            Manage your tax documents and deductions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {taxDocuments.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalDeductions.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {taxDocuments.filter(d => d.status === 'Pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Document Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Tax Document</CardTitle>
            <CardDescription>Track a new tax document</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Document Name"
                value={newDocument.name}
                onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
              />
              <Input
                placeholder="Tax Year"
                value={newDocument.year}
                onChange={(e) => setNewDocument({ ...newDocument, year: e.target.value })}
              />
              <select
                value={newDocument.type}
                onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                className="p-2 border rounded-md"
              >
                <option value="">Select Type</option>
                <option value="Income">Income</option>
                <option value="Deduction">Deduction</option>
                <option value="Interest">Interest</option>
                <option value="Dividend">Dividend</option>
              </select>
              <Input
                type="date"
                value={newDocument.dueDate}
                onChange={(e) => setNewDocument({ ...newDocument, dueDate: e.target.value })}
              />
              <Button onClick={addDocument} className="w-full md:col-span-1">
                Add Document
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tax Documents List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Tax Documents</CardTitle>
            <CardDescription>Your tax-related documents and forms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taxDocuments.map((doc) => (
                <div key={doc.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{doc.name}</h3>
                    <p className="text-sm text-gray-600">{doc.type} • {doc.year}</p>
                    <p className="text-sm text-gray-500">Due: {doc.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${doc.status === 'Received' ? 'text-green-600' : 'text-orange-600'}`}>
                      {doc.status}
                    </p>
                    <Button variant="outline" size="sm" className="mt-1">
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deductions List */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Deductions</CardTitle>
            <CardDescription>Track your deductible expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deductions.map((deduction) => (
                <div key={deduction.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{deduction.category}</h3>
                    <p className="text-sm text-gray-600">{deduction.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${deduction.amount.toLocaleString()}</p>
                    <Button variant="outline" size="sm" className="mt-1">
                      Edit
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
