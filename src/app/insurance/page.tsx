/**
 * Insurance page
 */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InsurancePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [policies, setPolicies] = useState([
    { id: 1, type: "Auto Insurance", provider: "State Farm", policyNumber: "SF-123456", premium: 120, dueDate: "2024-02-15", status: "Active" },
    { id: 2, type: "Home Insurance", provider: "Allstate", policyNumber: "AL-789012", premium: 85, dueDate: "2024-03-01", status: "Active" },
    { id: 3, type: "Health Insurance", provider: "Blue Cross", policyNumber: "BC-345678", premium: 450, dueDate: "2024-01-30", status: "Active" },
  ]);
  const [claims, setClaims] = useState([
    { id: 1, policy: "Auto Insurance", claimNumber: "CL-001", amount: 2500, status: "Approved", date: "2024-01-10" },
    { id: 2, policy: "Home Insurance", claimNumber: "CL-002", amount: 1200, status: "Pending", date: "2024-01-15" },
  ]);
  const [newPolicy, setNewPolicy] = useState({ type: "", provider: "", policyNumber: "", premium: "", dueDate: "" });

  const addPolicy = () => {
    if (newPolicy.type && newPolicy.provider && newPolicy.policyNumber && newPolicy.premium) {
      const policy = {
        id: policies.length + 1,
        type: newPolicy.type,
        provider: newPolicy.provider,
        policyNumber: newPolicy.policyNumber,
        premium: parseFloat(newPolicy.premium),
        dueDate: newPolicy.dueDate,
        status: "Active"
      };
      setPolicies([...policies, policy]);
      setNewPolicy({ type: "", provider: "", policyNumber: "", premium: "", dueDate: "" });
    }
  };

  const totalPremium = policies.reduce((sum, policy) => sum + policy.premium, 0);

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
            <Button variant="ghost" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">
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
            🛡️ Insurance Management
          </h1>
          <p className="text-gray-600">
            Manage your insurance policies and claims
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {policies.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalPremium}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {claims.filter(c => c.status === 'Pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Policy Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Policy</CardTitle>
            <CardDescription>Track a new insurance policy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Policy Type"
                value={newPolicy.type}
                onChange={(e) => setNewPolicy({ ...newPolicy, type: e.target.value })}
              />
              <Input
                placeholder="Provider"
                value={newPolicy.provider}
                onChange={(e) => setNewPolicy({ ...newPolicy, provider: e.target.value })}
              />
              <Input
                placeholder="Policy Number"
                value={newPolicy.policyNumber}
                onChange={(e) => setNewPolicy({ ...newPolicy, policyNumber: e.target.value })}
              />
              <Input
                placeholder="Monthly Premium"
                type="number"
                value={newPolicy.premium}
                onChange={(e) => setNewPolicy({ ...newPolicy, premium: e.target.value })}
              />
              <Input
                type="date"
                value={newPolicy.dueDate}
                onChange={(e) => setNewPolicy({ ...newPolicy, dueDate: e.target.value })}
              />
              <Button onClick={addPolicy} className="w-full md:col-span-1">
                Add Policy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Policies List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Insurance Policies</CardTitle>
            <CardDescription>Your active insurance policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {policies.map((policy) => (
                <div key={policy.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{policy.type}</h3>
                    <p className="text-sm text-gray-600">{policy.provider} • {policy.policyNumber}</p>
                    <p className="text-sm text-gray-500">Due: {policy.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">${policy.premium}/month</p>
                    <p className={`text-sm ${policy.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                      {policy.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Claims List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Claims</CardTitle>
            <CardDescription>Your insurance claims history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{claim.policy}</h3>
                    <p className="text-sm text-gray-600">Claim #{claim.claimNumber}</p>
                    <p className="text-sm text-gray-500">{claim.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${claim.amount}</p>
                    <p className={`text-sm ${claim.status === 'Approved' ? 'text-green-600' : 'text-orange-600'}`}>
                      {claim.status}
                    </p>
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
