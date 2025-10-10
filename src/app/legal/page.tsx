/**
 * Legal Services Management page
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
  Scale, 
  FileText, 
  Calendar,
  Building2,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Gavel,
  Trash2,
  Download,
  Lock,
  Shield
} from "lucide-react";

export default function LegalPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State management
  const [cases, setCases] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [lawFirms, setLawFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showAddCase, setShowAddCase] = useState(false);
  const [newCase, setNewCase] = useState({
    caseNumber: "",
    title: "",
    description: "",
    caseType: "PERSONAL_INJURY",
    status: "ACTIVE",
    priority: "MEDIUM",
    startDate: "",
    jurisdiction: "",
    courtName: "",
    estimatedCost: "",
    retainerAmount: "",
    primaryAttorney: "",
    notes: ""
  });

  // Document form state
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [newDocument, setNewDocument] = useState({
    caseId: "",
    title: "",
    description: "",
    documentType: "CONTRACT",
    category: "LEGAL",
    fileName: "",
    fileSize: "0",
    fileType: "application/pdf",
    documentDate: "",
    confidential: false,
    privileged: false,
    accessLevel: "CONFIDENTIAL",
    notes: ""
  });

  // Load data on component mount
  useEffect(() => {
    loadCases();
    loadDocuments();
  }, []);

  const loadCases = async () => {
    try {
      const response = await fetch('/api/legal/cases');
      if (response.ok) {
        const data = await response.json();
        setCases(data.cases || []);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/legal/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const addDocument = async () => {
    if (!newDocument.title || !newDocument.fileName || !newDocument.documentDate) {
      alert('Please fill in Title, File Name, and Document Date');
      return;
    }

    try {
      const documentData = {
        ...newDocument,
        caseId: newDocument.caseId || undefined,
        description: newDocument.description || undefined,
        notes: newDocument.notes || undefined,
        fileSize: parseInt(newDocument.fileSize) || 0
      };
      
      const response = await fetch('/api/legal/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Document added successfully!');
        await loadDocuments();
        setShowAddDocument(false);
        setNewDocument({
          caseId: "",
          title: "",
          description: "",
          documentType: "CONTRACT",
          category: "LEGAL",
          fileName: "",
          fileSize: "0",
          fileType: "application/pdf",
          documentDate: "",
          confidential: false,
          privileged: false,
          accessLevel: "CONFIDENTIAL",
          notes: ""
        });
      } else {
        alert(`Error: ${data.error || 'Failed to add document'}`);
      }
    } catch (error) {
      console.error('Failed to add document:', error);
      alert('Network error. Please try again.');
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`/api/legal/documents?id=${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Document deleted successfully!');
        await loadDocuments();
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Network error. Please try again.');
    }
  };

  const addCase = async () => {
    if (!newCase.title || !newCase.description || !newCase.jurisdiction || !newCase.startDate) {
      alert('Please fill in Title, Description, Jurisdiction, and Start Date');
      return;
    }

    try {
      const caseData = {
        ...newCase,
        estimatedCost: newCase.estimatedCost || 0,
        retainerAmount: newCase.retainerAmount || 0,
        courtName: newCase.courtName || undefined,
        primaryAttorney: newCase.primaryAttorney || undefined,
        notes: newCase.notes || undefined
      };
      
      console.log('Submitting case:', caseData);
      const response = await fetch('/api/legal/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      });

      const data = await response.json();
      console.log('API response:', data);

      if (response.ok) {
        alert('Legal case created successfully!');
        await loadCases();
        setShowAddCase(false);
        setNewCase({
          caseNumber: "",
          title: "",
          description: "",
          caseType: "PERSONAL_INJURY",
          status: "ACTIVE",
          priority: "MEDIUM",
          startDate: "",
          jurisdiction: "",
          courtName: "",
          estimatedCost: "",
          retainerAmount: "",
          primaryAttorney: "",
          notes: ""
        });
      } else {
        alert(`Error: ${data.error || 'Failed to create case'}`);
      }
    } catch (error) {
      console.error('Failed to create case:', error);
      alert('Network error. Please try again.');
    }
  };

  const getCaseTypeIcon = (type: string) => {
    switch (type) {
      case 'PERSONAL_INJURY': return '🏥';
      case 'FAMILY_LAW': return '👨‍👩‍👧‍👦';
      case 'CRIMINAL': return '⚖️';
      case 'BUSINESS': return '🏢';
      case 'REAL_ESTATE': return '🏠';
      case 'ESTATE_PLANNING': return '📜';
      case 'IMMIGRATION': return '🌍';
      case 'EMPLOYMENT': return '💼';
      case 'CONTRACT': return '📋';
      default: return '⚖️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ON_HOLD': return 'bg-orange-100 text-orange-800';
      case 'SETTLED': return 'bg-blue-100 text-blue-800';
      case 'DISMISSED': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Calculate summary statistics
  const activeCases = cases.filter(c => c.status === 'ACTIVE');
  const totalEstimatedCost = cases.reduce((sum, c) => sum + (c.estimatedCost || 0), 0);
  const totalActualCost = cases.reduce((sum, c) => sum + (c.actualCost || 0), 0);
  const upcomingDeadlines = cases.filter(c => 
    c.nextDeadline && new Date(c.nextDeadline) > new Date() && new Date(c.nextDeadline) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

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
                onClick={() => signOut({ callbackUrl: '/' })}
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
            ⚖️ Legal Services Management
          </h1>
          <p className="text-gray-600">
            Manage your legal cases, documents, appointments, and law firm relationships
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Scale className="h-5 w-5 mr-2" />
                Total Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {cases.length}
              </div>
              <p className="text-sm text-gray-500">{activeCases.length} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Estimated Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalEstimatedCost.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Total estimated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {upcomingDeadlines.length}
              </div>
              <p className="text-sm text-gray-500">Next 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {documents.length}
              </div>
              <p className="text-sm text-gray-500">Total documents</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cases" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cases" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Cases
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="firms" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Law Firms
            </TabsTrigger>
          </TabsList>

          {/* Cases Tab */}
          <TabsContent value="cases" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Legal Cases</h2>
                <p className="text-gray-600">Manage your legal cases and track progress</p>
              </div>
              <Button onClick={() => setShowAddCase(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Case
              </Button>
            </div>

            {cases.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Scale className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases yet</h3>
                  <p className="text-gray-500 mb-4">Add your first legal case to get started.</p>
                  <Button onClick={() => setShowAddCase(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Case
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {cases.map((caseItem) => (
                  <Card key={caseItem._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center">
                            <span className="mr-2">{getCaseTypeIcon(caseItem.caseType)}</span>
                            {caseItem.title}
                          </CardTitle>
                          <CardDescription>
                            {caseItem.caseNumber} • {caseItem.jurisdiction}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(caseItem.status)}>
                            {caseItem.status}
                          </Badge>
                          <Badge className={getPriorityColor(caseItem.priority)}>
                            {caseItem.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">{caseItem.description}</p>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Estimated Cost:</span>
                          <span className="font-medium">${caseItem.estimatedCost?.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Start Date:</span>
                          <span className="font-medium">
                            {new Date(caseItem.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {caseItem.nextDeadline && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Next Deadline:</span>
                            <span className="font-medium text-orange-600">
                              {new Date(caseItem.nextDeadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        
                        {caseItem.primaryAttorney && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-gray-600">Attorney: {caseItem.primaryAttorney}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Legal Documents</h2>
                <p className="text-gray-600">Manage your legal documents and files</p>
              </div>
              <Button onClick={() => setShowAddDocument(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>

            {documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
                  <p className="text-gray-500 mb-4">Add your first legal document to get started.</p>
                  <Button onClick={() => setShowAddDocument(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {documents.map((doc) => (
                  <Card key={doc._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            {doc.title}
                          </CardTitle>
                          <CardDescription>
                            {doc.fileName} • {(doc.fileSize / 1024).toFixed(2)} KB
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {doc.documentType.replace(/_/g, ' ')}
                          </Badge>
                          {(doc.confidential || doc.privileged) && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              {doc.privileged ? 'Privileged' : 'Confidential'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {doc.description && (
                          <p className="text-sm text-gray-600">{doc.description}</p>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Document Date:</span>
                          <span className="font-medium">
                            {new Date(doc.documentDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {doc.caseId && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Case:</span>
                            <span className="font-medium">
                              {doc.caseId.title || doc.caseId.caseNumber}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Access Level:</span>
                          <Badge className={
                            doc.accessLevel === 'PUBLIC' ? 'bg-green-100 text-green-800' :
                            doc.accessLevel === 'CONFIDENTIAL' ? 'bg-yellow-100 text-yellow-800' :
                            doc.accessLevel === 'PRIVILEGED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {doc.accessLevel}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2 pt-2 border-t">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteDocument(doc._id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Appointments</h2>
                <p className="text-gray-600">Schedule and manage legal appointments</p>
              </div>
            </div>

            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointment scheduling coming soon</h3>
                <p className="text-gray-500 text-center">
                  Schedule consultations, court hearings, and meetings with your legal team.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Law Firms Tab */}
          <TabsContent value="firms" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Law Firms</h2>
                <p className="text-gray-600">Find and connect with law firms</p>
              </div>
            </div>

            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Law firm directory coming soon</h3>
                <p className="text-gray-500 text-center">
                  Browse law firms, compare services, and find the right legal representation.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Case Modal */}
        {showAddCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Add New Legal Case</CardTitle>
                <CardDescription>Create a new legal case to track</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Case Title *</label>
                    <Input
                      placeholder="Case Title"
                      value={newCase.title}
                      onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Case Number (optional)</label>
                    <Input
                      placeholder="Case Number (auto-generated if blank)"
                      value={newCase.caseNumber}
                      onChange={(e) => setNewCase({ ...newCase, caseNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Case Type</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md"
                    value={newCase.caseType}
                    onChange={(e) => setNewCase({ ...newCase, caseType: e.target.value })}
                  >
                    <option value="PERSONAL_INJURY">Personal Injury</option>
                    <option value="FAMILY_LAW">Family Law</option>
                    <option value="CRIMINAL">Criminal</option>
                    <option value="BUSINESS">Business</option>
                    <option value="REAL_ESTATE">Real Estate</option>
                    <option value="ESTATE_PLANNING">Estate Planning</option>
                    <option value="IMMIGRATION">Immigration</option>
                    <option value="EMPLOYMENT">Employment</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Description *</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-20"
                    placeholder="Describe the case details..."
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date *</label>
                    <Input
                      type="date"
                      value={newCase.startDate}
                      onChange={(e) => setNewCase({ ...newCase, startDate: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Jurisdiction *</label>
                    <Input
                      placeholder="e.g., California Superior Court"
                      value={newCase.jurisdiction}
                      onChange={(e) => setNewCase({ ...newCase, jurisdiction: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Court Name (optional)"
                    value={newCase.courtName}
                    onChange={(e) => setNewCase({ ...newCase, courtName: e.target.value })}
                  />
                  
                  <Input
                    placeholder="Primary Attorney (optional)"
                    value={newCase.primaryAttorney}
                    onChange={(e) => setNewCase({ ...newCase, primaryAttorney: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Estimated Cost"
                    type="number"
                    value={newCase.estimatedCost}
                    onChange={(e) => setNewCase({ ...newCase, estimatedCost: e.target.value })}
                  />
                  
                  <Input
                    placeholder="Retainer Amount"
                    type="number"
                    value={newCase.retainerAmount}
                    onChange={(e) => setNewCase({ ...newCase, retainerAmount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-16"
                    placeholder="Additional notes..."
                    value={newCase.notes}
                    onChange={(e) => setNewCase({ ...newCase, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addCase} className="flex-1">
                    Create Case
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddCase(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Document Modal */}
        {showAddDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Add New Document</CardTitle>
                <CardDescription>Add a legal document to your collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Document Title *</label>
                    <Input
                      placeholder="Document Title"
                      value={newDocument.title}
                      onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">File Name *</label>
                    <Input
                      placeholder="e.g., contract-2024.pdf"
                      value={newDocument.fileName}
                      onChange={(e) => setNewDocument({ ...newDocument, fileName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Document Type</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newDocument.documentType}
                      onChange={(e) => setNewDocument({ ...newDocument, documentType: e.target.value })}
                    >
                      <option value="CONTRACT">Contract</option>
                      <option value="PLEADING">Pleading</option>
                      <option value="MOTION">Motion</option>
                      <option value="DISCOVERY">Discovery</option>
                      <option value="EVIDENCE">Evidence</option>
                      <option value="CORRESPONDENCE">Correspondence</option>
                      <option value="COURT_ORDER">Court Order</option>
                      <option value="SETTLEMENT">Settlement</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newDocument.category}
                      onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                    >
                      <option value="LEGAL">Legal</option>
                      <option value="EVIDENCE">Evidence</option>
                      <option value="CORRESPONDENCE">Correspondence</option>
                      <option value="FINANCIAL">Financial</option>
                      <option value="MEDICAL">Medical</option>
                      <option value="PERSONAL">Personal</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-20"
                    placeholder="Describe the document..."
                    value={newDocument.description}
                    onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Document Date *</label>
                    <Input
                      type="date"
                      value={newDocument.documentDate}
                      onChange={(e) => setNewDocument({ ...newDocument, documentDate: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Related Case (optional)</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newDocument.caseId}
                      onChange={(e) => setNewDocument({ ...newDocument, caseId: e.target.value })}
                    >
                      <option value="">No case association</option>
                      {cases.map((caseItem) => (
                        <option key={caseItem._id} value={caseItem._id}>
                          {caseItem.title} - {caseItem.caseNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">File Size (KB)</label>
                    <Input
                      type="number"
                      placeholder="File size in KB"
                      value={newDocument.fileSize}
                      onChange={(e) => setNewDocument({ ...newDocument, fileSize: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Access Level</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newDocument.accessLevel}
                      onChange={(e) => setNewDocument({ ...newDocument, accessLevel: e.target.value })}
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="CONFIDENTIAL">Confidential</option>
                      <option value="PRIVILEGED">Privileged</option>
                      <option value="RESTRICTED">Restricted</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newDocument.confidential}
                      onChange={(e) => setNewDocument({ ...newDocument, confidential: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Confidential</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newDocument.privileged}
                      onChange={(e) => setNewDocument({ ...newDocument, privileged: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Privileged</span>
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-16"
                    placeholder="Additional notes..."
                    value={newDocument.notes}
                    onChange={(e) => setNewDocument({ ...newDocument, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addDocument} className="flex-1">
                    Add Document
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDocument(false)}>
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