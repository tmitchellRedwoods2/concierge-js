"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Bot, 
  Mail, 
  Phone, 
  Settings, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Activity,
  Zap,
  Plus
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: string;
    conditions: any[];
  };
  steps: any[];
  approvalRequired: boolean;
  autoExecute: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Monitor {
  id: string;
  userId: string;
  type: string;
  config: any;
  isActive: boolean;
  lastCheck: string;
}

interface Approval {
  id: string;
  workflowId: string;
  eventId: string;
  userId: string;
  status: string;
  startedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export default function WorkflowsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workflows');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    triggerType: 'email',
    approvalRequired: false,
    autoExecute: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load workflows
      const workflowsResponse = await fetch('/api/workflows');
      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData.workflows || []);
      }

      // Load monitors
      const monitorsResponse = await fetch('/api/workflows/monitors');
      if (monitorsResponse.ok) {
        const monitorsData = await monitorsResponse.json();
        setMonitors(monitorsData.monitors || []);
      }

      // Load approvals
      const approvalsResponse = await fetch('/api/workflows/approvals');
      if (approvalsResponse.ok) {
        const approvalsData = await approvalsResponse.json();
        setApprovals(approvalsData.approvals || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEmailMonitoring = async () => {
    try {
      const response = await fetch('/api/workflows/monitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'email',
          config: {
            provider: 'gmail',
            pollInterval: 60000,
            filters: {
              from: ['noreply@healthcare.com', 'appointments@clinic.com']
            }
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Email monitoring started:', data);
        loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error starting email monitoring:', error);
    }
  };

  const startVoicemailMonitoring = async () => {
    try {
      const response = await fetch('/api/workflows/monitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'voicemail',
          config: {
            provider: 'twilio',
            pollInterval: 30000,
            webhookUrl: '/api/webhooks/voicemail'
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Voicemail monitoring started:', data);
        loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error starting voicemail monitoring:', error);
    }
  };

  const createWorkflow = async () => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWorkflow.name,
          description: newWorkflow.description,
          trigger: {
            type: newWorkflow.triggerType,
            conditions: []
          },
          steps: [],
          approvalRequired: newWorkflow.approvalRequired,
          autoExecute: newWorkflow.autoExecute,
          isActive: false
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewWorkflow({
          name: '',
          description: '',
          triggerType: 'email',
          approvalRequired: false,
          autoExecute: true
        });
        loadData(); // Reload workflows
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  const stopMonitoring = async (monitorId: string) => {
    try {
      const response = await fetch(`/api/workflows/monitors?monitorId=${monitorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Monitor stopped');
        loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error stopping monitor:', error);
    }
  };

  const approveWorkflow = async (approvalToken: string, approved: boolean) => {
    try {
      const response = await fetch('/api/workflows/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalToken,
          approved
        }),
      });

      if (response.ok) {
        console.log('Approval processed');
        loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'awaiting_approval':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'awaiting_approval':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Concierge.com</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.username || 'User'}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
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
              📊 Tax
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
              🤖 Workflows
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

      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Autonomous AI Workflows</h1>
          <p className="text-gray-600">
            Configure AI agents to automatically respond to emails, voicemails, and other events
          </p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="monitors">Event Monitors</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Workflows</h2>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Workflow
            </Button>
          </div>
          <div className="grid gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        {workflow.name}
                      </CardTitle>
                      <CardDescription>{workflow.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={workflow.isActive} 
                        onCheckedChange={(checked) => {
                          // Toggle workflow status
                          setWorkflows(prev => prev.map(w => 
                            w.id === workflow.id ? { ...w, isActive: checked } : w
                          ));
                        }}
                      />
                      <Badge variant={workflow.isActive ? "default" : "secondary"}>
                        {workflow.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Trigger</h4>
                        <p className="text-sm text-gray-600">
                          {workflow.trigger.type.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Steps</h4>
                        <p className="text-sm text-gray-600">
                          {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Auto-Execute:</span>
                        <Badge variant={workflow.autoExecute ? "default" : "secondary"}>
                          {workflow.autoExecute ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Approval Required:</span>
                        <Badge variant={workflow.approvalRequired ? "default" : "secondary"}>
                          {workflow.approvalRequired ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Event Monitors
              </CardTitle>
              <CardDescription>
                Monitor emails, voicemails, and other events for AI workflow triggers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Email Monitoring</h3>
                      <p className="text-sm text-gray-600">
                        Monitor emails for appointment requests, prescription refills, etc.
                      </p>
                    </div>
                  </div>
                  <Button onClick={startEmailMonitoring} variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Start Monitoring
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-green-500" />
                    <div>
                      <h3 className="font-medium">Voicemail Monitoring</h3>
                      <p className="text-sm text-gray-600">
                        Monitor voicemails and convert to text for AI processing
                      </p>
                    </div>
                  </div>
                  <Button onClick={startVoicemailMonitoring} variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Start Monitoring
                  </Button>
                </div>
              </div>

              {monitors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Active Monitors</h3>
                  {monitors.map((monitor) => (
                    <div key={monitor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {monitor.type === 'email' ? (
                          <Mail className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Phone className="w-5 h-5 text-green-500" />
                        )}
                        <div>
                          <h4 className="font-medium capitalize">{monitor.type} Monitor</h4>
                          <p className="text-sm text-gray-600">
                            Last check: {new Date(monitor.lastCheck).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={monitor.isActive ? "default" : "secondary"}>
                          {monitor.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button 
                          onClick={() => stopMonitoring(monitor.id)} 
                          variant="outline" 
                          size="sm"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Stop
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Pending Approvals
              </CardTitle>
              <CardDescription>
                Review and approve AI workflow actions that require your confirmation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No pending approvals</p>
                  <p className="text-sm">All AI workflows are running smoothly!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvals.map((approval) => (
                    <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(approval.status)}
                        <div>
                          <h4 className="font-medium">Workflow Execution</h4>
                          <p className="text-sm text-gray-600">
                            Started: {new Date(approval.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(approval.status)}
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => approveWorkflow(approval.id, true)} 
                            variant="default" 
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => approveWorkflow(approval.id, false)} 
                            variant="outline" 
                            size="sm"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Workflow Settings
              </CardTitle>
              <CardDescription>
                Configure global settings for autonomous AI workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-approve Appointments</h3>
                    <p className="text-sm text-gray-600">
                      Automatically approve appointment scheduling requests
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-approve Prescriptions</h3>
                    <p className="text-sm text-gray-600">
                      Automatically approve prescription refill requests
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-approve Claims</h3>
                    <p className="text-sm text-gray-600">
                      Automatically approve insurance claim filings
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Workflow</CardTitle>
              <CardDescription>
                Set up an autonomous AI workflow to respond to events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Workflow Name</label>
                <input
                  type="text"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Auto-schedule appointments"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this workflow does..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trigger Type</label>
                <select
                  value={newWorkflow.triggerType}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, triggerType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="voicemail">Voicemail</option>
                  <option value="webhook">Webhook</option>
                  <option value="schedule">Scheduled</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newWorkflow.approvalRequired}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, approvalRequired: e.target.checked }))}
                    className="mr-2"
                  />
                  Require Approval
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newWorkflow.autoExecute}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, autoExecute: e.target.checked }))}
                    className="mr-2"
                  />
                  Auto Execute
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={createWorkflow} disabled={!newWorkflow.name.trim()}>
                  Create Workflow
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
