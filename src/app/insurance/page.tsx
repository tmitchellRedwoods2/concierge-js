/**
 * Insurance Management page
 */
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  FileText, 
  DollarSign, 
  Calendar,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2
} from "lucide-react";

export default function InsurancePage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State management
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showAddClaim, setShowAddClaim] = useState(false);
  const [newClaim, setNewClaim] = useState({
    policyId: "",
    claimNumber: "",
    dateOfIncident: "",
    description: "",
    status: "SUBMITTED",
    amountClaimed: "",
    amountApproved: "",
    notes: ""
  });
  const [newPolicy, setNewPolicy] = useState({
    providerId: "",
    policyNumber: "",
    policyType: "AUTO",
    policyName: "",
    description: "",
    coverageAmount: "",
    deductible: "",
    premiumAmount: "",
    premiumFrequency: "ANNUAL",
    effectiveDate: "",
    expirationDate: "",
    agentName: "",
    agentPhone: "",
    agentEmail: "",
    notes: ""
  });

  // Load data on component mount
  useEffect(() => {
    loadPolicies();
    loadProviders();
    loadClaims();
  }, []);

  const loadPolicies = async () => {
    try {
      const response = await fetch('/api/insurance/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.policies || []);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/insurance/providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClaims = async () => {
    try {
      const response = await fetch('/api/insurance/claims');
      if (response.ok) {
        const data = await response.json();
        setClaims(data.claims || []);
      }
    } catch (error) {
      console.error('Failed to load claims:', error);
    }
  };

  const addPolicy = async () => {
    if (!newPolicy.policyNumber || !newPolicy.policyName || !newPolicy.coverageAmount) {
      alert('Please fill in Policy Number, Policy Name, and Coverage Amount');
      return;
    }

    if (!newPolicy.effectiveDate || !newPolicy.expirationDate) {
      alert('Please fill in Effective Date and Expiration Date');
      return;
    }

    try {
      // Clean up the data before sending
      const policyData = {
        ...newPolicy,
        providerId: newPolicy.providerId && newPolicy.providerId.trim() !== '' ? newPolicy.providerId : undefined,
        description: newPolicy.description || undefined,
        agentName: newPolicy.agentName || undefined,
        agentPhone: newPolicy.agentPhone || undefined,
        agentEmail: newPolicy.agentEmail || undefined,
        notes: newPolicy.notes || undefined
      };
      
      console.log('Submitting policy:', policyData);
      const response = await fetch('/api/insurance/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policyData),
      });

      const data = await response.json();
      console.log('API response:', data);

      if (response.ok) {
        alert('Policy added successfully!');
        await loadPolicies();
        setShowAddPolicy(false);
        setNewPolicy({
          providerId: "",
          policyNumber: "",
          policyType: "AUTO",
          policyName: "",
          description: "",
          coverageAmount: "",
          deductible: "",
          premiumAmount: "",
          premiumFrequency: "ANNUAL",
          effectiveDate: "",
          expirationDate: "",
          agentName: "",
          agentPhone: "",
          agentEmail: "",
          notes: ""
        });
      } else {
        alert(`Error: ${data.error || 'Failed to add policy'}`);
      }
    } catch (error) {
      console.error('Failed to add policy:', error);
      alert('Network error. Please try again.');
    }
  };

  const addClaim = async () => {
    if (!newClaim.policyId || !newClaim.dateOfIncident || !newClaim.description) {
      alert('Please fill in Policy, Date of Incident, and Description');
      return;
    }

    try {
      const claimData = {
        ...newClaim,
        policyId: newClaim.policyId && newClaim.policyId.trim() !== '' ? newClaim.policyId : undefined,
        amountClaimed: newClaim.amountClaimed || 0,
        amountApproved: newClaim.amountApproved || 0,
        notes: newClaim.notes || undefined
      };
      
      console.log('Submitting claim:', claimData);
      const response = await fetch('/api/insurance/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimData),
      });

      const data = await response.json();
      console.log('API response:', data);

      if (response.ok) {
        alert('Claim filed successfully!');
        await loadClaims();
        setShowAddClaim(false);
        setNewClaim({
          policyId: "",
          claimNumber: "",
          dateOfIncident: "",
          description: "",
          status: "SUBMITTED",
          amountClaimed: "",
          amountApproved: "",
          notes: ""
        });
      } else {
        alert(`Error: ${data.error || 'Failed to file claim'}`);
      }
    } catch (error) {
      console.error('Failed to file claim:', error);
      alert('Network error. Please try again.');
    }
  };

  const getPolicyTypeIcon = (type: string) => {
    switch (type) {
      case 'AUTO': return '🚗';
      case 'HOME': return '🏠';
      case 'HEALTH': return '🏥';
      case 'LIFE': return '👤';
      case 'DISABILITY': return '♿';
      case 'RENTERS': return '🏢';
      case 'UMBRELLA': return '☂️';
      case 'BUSINESS': return '🏢';
      default: return '🛡️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getClaimStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'DENIED': return 'bg-red-100 text-red-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate summary statistics
  const activePolicies = policies.filter(p => p.status === 'ACTIVE');
  const totalCoverage = activePolicies.reduce((sum, p) => sum + (p.coverageAmount || 0), 0);
  const totalPremiums = activePolicies.reduce((sum, p) => {
    const annualPremium = p.premiumFrequency === 'MONTHLY' ? (p.premiumAmount || 0) * 12 :
                         p.premiumFrequency === 'QUARTERLY' ? (p.premiumAmount || 0) * 4 :
                         p.premiumFrequency === 'SEMI_ANNUAL' ? (p.premiumAmount || 0) * 2 :
                         (p.premiumAmount || 0);
    return sum + annualPremium;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                onClick={() => signOut()}
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
            Manage your insurance policies, track claims, and monitor coverage
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Total Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {policies.length}
              </div>
              <p className="text-sm text-gray-500">{activePolicies.length} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Total Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalCoverage.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Coverage amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Annual Premiums
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${totalPremiums.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Per year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Active Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {claims.filter(c => c.status === 'PENDING' || c.status === 'UNDER_REVIEW').length}
              </div>
              <p className="text-sm text-gray-500">In progress</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="policies" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Policies
            </TabsTrigger>
            <TabsTrigger value="claims" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Claims
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Insurance Policies</h2>
                <p className="text-gray-600">Manage your insurance coverage</p>
              </div>
              <Button onClick={() => setShowAddPolicy(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Policy
              </Button>
            </div>

            {policies.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No policies yet</h3>
                  <p className="text-gray-500 mb-4">Add your first insurance policy to get started.</p>
                  <Button onClick={() => setShowAddPolicy(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Policy
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {policies.map((policy) => (
                  <Card key={policy._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center">
                            <span className="mr-2">{getPolicyTypeIcon(policy.policyType)}</span>
                            {policy.policyName}
                          </CardTitle>
                          <CardDescription>
                            {policy.providerId?.name || 'Unknown Provider'} • {policy.policyNumber}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(policy.status)}>
                          {policy.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Coverage:</span>
                          <span className="font-medium">${policy.coverageAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Deductible:</span>
                          <span className="font-medium">${policy.deductible?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Premium:</span>
                          <span className="font-medium">
                            ${policy.premiumAmount?.toLocaleString()}/{policy.premiumFrequency?.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Expires:</span>
                          <span className="font-medium">
                            {new Date(policy.expirationDate).toLocaleDateString()}
                          </span>
                        </div>
                        {policy.agentName && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-gray-600">Agent: {policy.agentName}</p>
                            {policy.agentPhone && <p className="text-sm text-gray-600">{policy.agentPhone}</p>}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Insurance Claims</h2>
                <p className="text-gray-600">Track your insurance claims</p>
              </div>
              <Button onClick={() => setShowAddClaim(true)}>
                <Plus className="h-4 w-4 mr-2" />
                File Claim
              </Button>
            </div>

            {claims.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No claims yet</h3>
                  <p className="text-gray-500 mb-4">File your first insurance claim to get started.</p>
                  <Button onClick={() => setShowAddClaim(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    File First Claim
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {claims.map((claim) => (
                  <Card key={claim._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            {claim.claimNumber}
                          </CardTitle>
                          <CardDescription>
                            {claim.policyId?.policyName || 'Unknown Policy'} • {new Date(claim.dateOfIncident).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge className={getClaimStatusColor(claim.status)}>
                          {claim.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600">Description:</span>
                          <p className="text-sm mt-1">{claim.description}</p>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Amount Claimed:</span>
                          <span className="font-medium">${claim.amountClaimed?.toLocaleString()}</span>
                        </div>
                        {claim.amountApproved > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Amount Approved:</span>
                            <span className="font-medium text-green-600">${claim.amountApproved?.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Date Filed:</span>
                          <span className="font-medium">
                            {new Date(claim.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {claim.notes && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-gray-600">Notes: {claim.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Insurance Providers</h2>
                <p className="text-gray-600">Browse insurance companies and get quotes</p>
              </div>
            </div>

            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Provider directory coming soon</h3>
                <p className="text-gray-500 text-center">
                  Compare insurance providers, get quotes, and find the best coverage.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Coverage Analytics</h2>
                <p className="text-gray-600">Analyze your insurance coverage and identify gaps</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Coverage Breakdown</CardTitle>
                  <CardDescription>Your insurance coverage by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['AUTO', 'HOME', 'HEALTH', 'LIFE'].map((type) => {
                      const typePolicies = policies.filter(p => p.policyType === type);
                      const typeCoverage = typePolicies.reduce((sum, p) => sum + (p.coverageAmount || 0), 0);
                      return (
                        <div key={type} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="mr-2">{getPolicyTypeIcon(type)}</span>
                            <span className="capitalize">{type.toLowerCase()}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${typeCoverage.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{typePolicies.length} policies</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Coverage Recommendations</CardTitle>
                  <CardDescription>Suggested improvements to your coverage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="font-semibold text-blue-900">Consider Umbrella Insurance</h4>
                      </div>
                      <p className="text-sm text-blue-800 mt-1">
                        Additional liability coverage beyond your existing policies.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="font-semibold text-green-900">Good Coverage</h4>
                      </div>
                      <p className="text-sm text-green-800 mt-1">
                        Your current policies provide solid protection.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Claim Modal */}
        {showAddClaim && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>File New Insurance Claim</CardTitle>
                <CardDescription>Submit a new insurance claim</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Policy</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md"
                    value={newClaim.policyId}
                    onChange={(e) => setNewClaim({ ...newClaim, policyId: e.target.value })}
                  >
                    <option value="">Select a policy</option>
                    {policies.map((policy) => (
                      <option key={policy._id} value={policy._id}>
                        {policy.policyName} - {policy.policyNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Claim Number (optional)"
                    value={newClaim.claimNumber}
                    onChange={(e) => setNewClaim({ ...newClaim, claimNumber: e.target.value })}
                  />
                  
                  <div>
                    <label className="text-sm font-medium">Date of Incident</label>
                    <Input
                      type="date"
                      value={newClaim.dateOfIncident}
                      onChange={(e) => setNewClaim({ ...newClaim, dateOfIncident: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-20"
                    placeholder="Describe what happened..."
                    value={newClaim.description}
                    onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Amount Claimed"
                    type="number"
                    value={newClaim.amountClaimed}
                    onChange={(e) => setNewClaim({ ...newClaim, amountClaimed: e.target.value })}
                  />
                  
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newClaim.status}
                      onChange={(e) => setNewClaim({ ...newClaim, status: e.target.value })}
                    >
                      <option value="SUBMITTED">Submitted</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="DENIED">Denied</option>
                      <option value="PAID">Paid</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>

                <Input
                  placeholder="Amount Approved (optional)"
                  type="number"
                  value={newClaim.amountApproved}
                  onChange={(e) => setNewClaim({ ...newClaim, amountApproved: e.target.value })}
                />

                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-16"
                    placeholder="Additional notes..."
                    value={newClaim.notes}
                    onChange={(e) => setNewClaim({ ...newClaim, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addClaim} className="flex-1">
                    File Claim
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddClaim(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Policy Modal */}
        {showAddPolicy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Add New Insurance Policy</CardTitle>
                <CardDescription>Track a new insurance policy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Policy Type</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newPolicy.policyType}
                      onChange={(e) => setNewPolicy({ ...newPolicy, policyType: e.target.value })}
                    >
                      <option value="AUTO">Auto Insurance</option>
                      <option value="HOME">Home Insurance</option>
                      <option value="HEALTH">Health Insurance</option>
                      <option value="LIFE">Life Insurance</option>
                      <option value="DISABILITY">Disability Insurance</option>
                      <option value="RENTERS">Renters Insurance</option>
                      <option value="UMBRELLA">Umbrella Insurance</option>
                      <option value="BUSINESS">Business Insurance</option>
                    </select>
                  </div>
                  
                  <Input
                    placeholder="Policy Number"
                    value={newPolicy.policyNumber}
                    onChange={(e) => setNewPolicy({ ...newPolicy, policyNumber: e.target.value })}
                  />
                </div>

                <Input
                  placeholder="Policy Name"
                  value={newPolicy.policyName}
                  onChange={(e) => setNewPolicy({ ...newPolicy, policyName: e.target.value })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Coverage Amount"
                    type="number"
                    value={newPolicy.coverageAmount}
                    onChange={(e) => setNewPolicy({ ...newPolicy, coverageAmount: e.target.value })}
                  />
                  
                  <Input
                    placeholder="Deductible"
                    type="number"
                    value={newPolicy.deductible}
                    onChange={(e) => setNewPolicy({ ...newPolicy, deductible: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Premium Amount"
                    type="number"
                    value={newPolicy.premiumAmount}
                    onChange={(e) => setNewPolicy({ ...newPolicy, premiumAmount: e.target.value })}
                  />
                  
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newPolicy.premiumFrequency}
                    onChange={(e) => setNewPolicy({ ...newPolicy, premiumFrequency: e.target.value })}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="SEMI_ANNUAL">Semi-Annual</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Effective Date</label>
                    <Input
                      type="date"
                      value={newPolicy.effectiveDate}
                      onChange={(e) => setNewPolicy({ ...newPolicy, effectiveDate: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Expiration Date</label>
                    <Input
                      type="date"
                      value={newPolicy.expirationDate}
                      onChange={(e) => setNewPolicy({ ...newPolicy, expirationDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Agent Name"
                    value={newPolicy.agentName}
                    onChange={(e) => setNewPolicy({ ...newPolicy, agentName: e.target.value })}
                  />
                  
                  <Input
                    placeholder="Agent Phone"
                    value={newPolicy.agentPhone}
                    onChange={(e) => setNewPolicy({ ...newPolicy, agentPhone: e.target.value })}
                  />
                  
                  <Input
                    placeholder="Agent Email"
                    type="email"
                    value={newPolicy.agentEmail}
                    onChange={(e) => setNewPolicy({ ...newPolicy, agentEmail: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addPolicy} className="flex-1">
                    Add Policy
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddPolicy(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}