"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import WorkflowDesigner from "@/components/workflows/WorkflowDesigner";
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

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: string;
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  enabled: boolean;
  executionCount: number;
  lastExecuted?: string;
  createdAt: string;
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
  const [executions, setExecutions] = useState<any[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workflows');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    triggerType: 'email',
    approvalRequired: false,
    autoExecute: true
  });
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

  useEffect(() => {
    loadData();
    loadExecutions();
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

  const openDesigner = (workflow?: any) => {
    console.log('Opening designer with workflow:', workflow);
    setEditingWorkflow(workflow);
    setShowDesigner(true);
  };

  const closeDesigner = () => {
    setShowDesigner(false);
    setEditingWorkflow(null);
  };

  const saveWorkflowFromDesigner = async (workflowData: any) => {
    try {
      // Generate a default name if not provided
      const workflowName = workflowData.name || `Workflow ${new Date().toLocaleString()}`;
      const workflowDescription = workflowData.description || 'Workflow created from visual designer';

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
          trigger: 'email', // Default trigger type
          steps: workflowData.nodes || [],
          nodes: workflowData.nodes || [],
          edges: workflowData.edges || [],
          approvalRequired: false,
          autoExecute: false,
          isActive: false
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Workflow saved successfully:', result);
        closeDesigner();
        loadData(); // Reload workflows
      } else {
        const errorData = await response.json();
        console.error('Failed to save workflow:', errorData);
        alert('Failed to save workflow. Please try again.');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow. Please check the console for details.');
    }
  };

  const testWorkflowFromDesigner = (workflowData: any) => {
    console.log('Testing workflow:', workflowData);
    // TODO: Implement workflow testing
  };

  const openEmailModal = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setShowEmailModal(true);
  };

  const executeWorkflow = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId: selectedWorkflowId,
          triggerData: {
            email: recipientEmail,
            content: 'I need to schedule an appointment for tomorrow at 2 PM'
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Workflow executed:', result);
        setShowEmailModal(false);
        setRecipientEmail('');
        loadExecutions(); // Reload executions
        alert('Workflow executed successfully! Email notification sent to ' + recipientEmail);
      } else {
        alert('Failed to execute workflow');
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert('Error executing workflow');
    }
  };

  const loadExecutions = async () => {
    try {
      const response = await fetch('/api/workflows/execute');
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions || []);
      }
    } catch (error) {
      console.error('Error loading executions:', error);
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

  // Automation functions
  const loadAutomationRules = async () => {
    try {
      const response = await fetch('/api/automation/rules');
      const data = await response.json();
      
      if (data.success) {
        setAutomationRules(data.rules);
      }
    } catch (error) {
      console.error('Error fetching automation rules:', error);
    }
  };

  const setupDemoAutomation = async () => {
    try {
      const response = await fetch('/api/automation/setup-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        alert('Demo automation rules created successfully!');
        loadAutomationRules();
      } else {
        const errorMessage = data.details || data.message || data.error || 'Failed to create demo automation rules';
        console.error('Failed to create demo rules:', data);
        alert(`Failed to create demo automation rules: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error setting up demo automation:', error);
      alert(`Error setting up demo automation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setAutomationRules(rules => 
          rules.map(rule => 
            rule.id === ruleId ? { ...rule, enabled } : rule
          )
        );
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAutomationRules(rules => rules.filter(rule => rule.id !== ruleId));
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const executeRule = async (ruleId: string) => {
    try {
      const response = await fetch('/api/automation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      });

      const data = await response.json();

      if (response.ok) {
        // Show detailed execution log
        const log = data.executionLog;
        if (log) {
          const actionSummary = log.actions.map((a: any) => 
            `${a.type}: ${a.status === 'success' ? '✅' : '❌'} ${a.message || ''}`
          ).join('\n');
          
          alert(`Rule executed successfully!\n\nStatus: ${log.status}\nActions:\n${actionSummary}`);
        } else {
          alert('Rule executed successfully!');
        }
        loadAutomationRules(); // Refresh to get updated execution count
        loadExecutionLogs(); // Refresh execution logs
      } else {
        const errorMsg = data.executionLog 
          ? `Failed to execute rule. Status: ${data.executionLog.status}\nActions: ${data.executionLog.actions.map((a: any) => `${a.type}: ${a.status}`).join(', ')}`
          : 'Failed to execute rule';
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Error executing rule:', error);
      alert('Error executing rule');
    }
  };

  const loadExecutionLogs = async () => {
    try {
      const response = await fetch('/api/automation/executions');
      const data = await response.json();
      
      if (data.success) {
        setExecutionLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching execution logs:', error);
    }
  };

  // Load automation rules when component mounts
  useEffect(() => {
    loadAutomationRules();
    loadExecutionLogs();
  }, []);

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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="monitors">Event Monitors</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="automation" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Automation Rules</h2>
            <div className="flex gap-2">
              <Button onClick={() => setupDemoAutomation()} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <Zap className="w-4 h-4" />
                Setup Demo Rules
              </Button>
              <Button onClick={() => setActiveTab('workflows')} variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                Test Workflows
              </Button>
            </div>
          </div>
          
          <div className="grid gap-4">
            {automationRules.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Zap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Automation Rules</h3>
                  <p className="text-gray-600 mb-4">
                    Create automation rules to automatically handle emails, schedule events, and more
                  </p>
                  <Button onClick={() => setupDemoAutomation()}>
                    <Zap className="w-4 h-4 mr-2" />
                    Setup Demo Rules
                  </Button>
                </CardContent>
              </Card>
            ) : (
              automationRules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {rule.name}
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Active' : 'Inactive'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(enabled) => toggleRule(rule.id, enabled)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => executeRule(rule.id)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Trigger:</span>
                        <p className="text-gray-600 capitalize">{rule.trigger.type}</p>
                      </div>
                      <div>
                        <span className="font-medium">Actions:</span>
                        <p className="text-gray-600">{rule.actions.length}</p>
                      </div>
                      <div>
                        <span className="font-medium">Executions:</span>
                        <p className="text-gray-600">{rule.executionCount}</p>
                      </div>
                      <div>
                        <span className="font-medium">Last Run:</span>
                        <p className="text-gray-600">
                          {rule.lastExecuted 
                            ? new Date(rule.lastExecuted).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Execution Logs Section */}
          {executionLogs.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Executions
                </CardTitle>
                <CardDescription>
                  View execution history and action results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {executionLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{log.ruleName}</h4>
                            <Badge 
                              variant={log.status === 'success' ? 'default' : log.status === 'partial' ? 'secondary' : 'destructive'}
                            >
                              {log.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(log.timestamp).toLocaleString()}
                            {log.duration && ` • ${log.duration}ms`}
                          </p>
                        </div>
                      </div>
                      
                      {log.actions && log.actions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium">Actions:</p>
                          {log.actions.map((action: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-sm bg-gray-50 p-2 rounded">
                              <span className={action.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                                {action.status === 'success' ? '✅' : '❌'}
                              </span>
                              <div className="flex-1">
                                <span className="font-medium capitalize">{action.type.replace('_', ' ')}:</span>
                                <span className="ml-2 text-gray-600">{action.message || action.status}</span>
                                {action.details && action.details.to && (
                                  <span className="ml-2 text-xs text-gray-500">→ {action.details.to}</span>
                                )}
                                {action.details && action.details.title && (
                                  <span className="ml-2 text-xs text-gray-500">"{action.details.title}"</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {log.error && (
                        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                          <strong>Error:</strong> {log.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Workflows</h2>
            <div className="flex gap-2">
              <Button onClick={() => openDesigner()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Settings className="w-4 h-4" />
                🎨 Design New Workflow
              </Button>
              <Button onClick={() => {
                const sampleWorkflow = {
                  id: 'current-workflow',
                  name: 'My Email Workflow',
                  nodes: [
                    {
                      id: 'trigger-1',
                      type: 'trigger',
                      position: { x: 100, y: 100 },
                      data: {
                        label: 'Email Trigger',
                        triggerType: 'email',
                        conditions: [{ field: 'content', operator: 'contains', value: 'appointment' }]
                      }
                    },
                    {
                      id: 'ai-1',
                      type: 'ai',
                      position: { x: 300, y: 100 },
                      data: {
                        label: 'AI Processing',
                        prompt: 'Extract appointment details from email',
                        model: 'claude-3-sonnet',
                        temperature: 0.3
                      }
                    },
                    {
                      id: 'api-1',
                      type: 'api',
                      position: { x: 500, y: 100 },
                      data: {
                        label: 'API Call',
                        method: 'POST',
                        url: 'https://api.calendar.com/appointments',
                        headers: {},
                        body: {}
                      }
                    },
                    {
                      id: 'end-1',
                      type: 'end',
                      position: { x: 700, y: 100 },
                      data: {
                        label: 'End',
                        result: 'success'
                      }
                    }
                  ],
                  edges: [
                    { id: 'e1-2', source: 'trigger-1', target: 'ai-1', type: 'default' },
                    { id: 'e2-3', source: 'ai-1', target: 'api-1', type: 'default' },
                    { id: 'e3-4', source: 'api-1', target: 'end-1', type: 'default' }
                  ]
                };
                openDesigner(sampleWorkflow);
              }} variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Edit Current Workflow
              </Button>
              <Button onClick={() => setShowCreateModal(true)} variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Quick Create
              </Button>
            </div>
          </div>

          {/* Onboarding Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-2xl">🎨</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Create Your First AI Workflow</h3>
                  <p className="text-blue-700 mb-4">
                    Use our visual designer to create autonomous AI workflows that respond to emails, voicemails, and other events.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => openDesigner()} className="bg-blue-600 hover:bg-blue-700">
                      Start Designing
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                      Quick Setup
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                        onCheckedChange={async (checked) => {
                          try {
                            const response = await fetch('/api/workflows', {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                id: workflow.id,
                                isActive: checked
                              }),
                            });

                            if (response.ok) {
                              // Update local state
                              setWorkflows(prev => prev.map(w => 
                                w.id === workflow.id ? { ...w, isActive: checked } : w
                              ));
                            }
                          } catch (error) {
                            console.error('Error updating workflow status:', error);
                          }
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
                          {workflow.trigger?.type?.replace('_', ' ').toUpperCase() || 'Email'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Steps</h4>
                        <p className="text-sm text-gray-600">
                          {workflow.steps?.length || workflow.nodes?.length || 0} step{(workflow.steps?.length || workflow.nodes?.length || 0) !== 1 ? 's' : ''}
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
                    
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" size="sm" onClick={() => openEmailModal(workflow.id)}>
                        <Play className="w-4 h-4 mr-2" />
                        Execute
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openDesigner(workflow)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Workflow Executions
              </CardTitle>
              <CardDescription>
                View the execution history and status of your workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No executions yet. Execute a workflow to see results here.
                  </div>
                ) : (
                  executions.map((execution) => (
                    <div key={execution.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{execution.workflowName}</h3>
                          <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                            {execution.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(execution.startTime).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Trigger: {execution.triggerData?.content || 'Email received'}
                      </div>
                      {execution.result && (
                        <div className="text-sm text-green-600">
                          Result: {execution.result.eventId ? `Calendar event ${execution.result.eventId} created` : execution.result.appointmentId ? `Appointment ${execution.result.appointmentId} scheduled` : 'Completed successfully'}
                        </div>
                      )}
                      {execution.calendarEvent && (
                        <div className="text-sm text-blue-600">
                          <a href={execution.calendarEvent.eventUrl} target="_blank" rel="noopener noreferrer" className="underline">
                            View in calendar
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
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

      {/* Email Input Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Enter Recipient Email</CardTitle>
              <CardDescription>
                Email address to receive appointment confirmation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="recipient@example.com"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowEmailModal(false);
                  setRecipientEmail('');
                }}>
                  Cancel
                </Button>
                <Button onClick={executeWorkflow} disabled={!recipientEmail.includes('@')}>
                  Execute Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow Designer Modal */}
      {showDesigner && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="w-full h-full">
            <WorkflowDesigner
              workflow={editingWorkflow}
              onSave={saveWorkflowFromDesigner}
              onTest={testWorkflowFromDesigner}
              onClose={closeDesigner}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
