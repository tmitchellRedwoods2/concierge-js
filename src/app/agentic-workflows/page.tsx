/**
 * Agentic Workflows Page
 * View-only interface for hands-off users to see active agentic workflows
 * and their execution history
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/auth/route-guard';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Zap,
  Calendar,
  Mail,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AgenticWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: string;
    conditions?: any[];
  };
  isAgentic: boolean;
  targetAccessMode: string[];
  autoApprove: boolean;
  executionPriority: number;
  maxRetries: number;
  retryDelayMs: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  startTime: string;
  endTime?: string;
  durationMs?: number | null;
  steps: Array<{
    id: string;
    type: string;
    status: string;
    result?: any;
  }>;
  triggerData: any;
  result?: {
    appointmentId?: string;
    status?: string;
    eventUrl?: string;
    error?: string;
  };
  calendarEvent?: {
    eventId: string;
    eventUrl: string;
  } | null;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AgenticWorkflowsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [workflows, setWorkflows] = useState<AgenticWorkflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [executionStats, setExecutionStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    running: 0,
    timeout: 0,
  });

  useEffect(() => {
    if (session?.user) {
      loadWorkflows();
      loadExecutions();
    }
  }, [session]);

  useEffect(() => {
    if (selectedWorkflowId) {
      loadWorkflowExecutions(selectedWorkflowId);
    }
  }, [selectedWorkflowId]);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/agentic-workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      } else {
        console.error('Failed to load workflows');
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      const response = await fetch('/api/agentic-workflows/executions?limit=20');
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions || []);
        setExecutionStats(data.stats || executionStats);
      }
    } catch (error) {
      console.error('Error loading executions:', error);
    }
  };

  const loadWorkflowExecutions = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/agentic-workflows/${workflowId}`);
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions || []);
        setExecutionStats(data.stats || executionStats);
      }
    } catch (error) {
      console.error('Error loading workflow executions:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'timeout':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <Clock className="h-3 w-3 mr-1" />
            Timeout
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'schedule':
        return <Calendar className="h-4 w-4" />;
      case 'calendar_event':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const formatDuration = (ms: number | null | undefined) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading agentic workflows...</div>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission="view:agentic-workflows">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="h-8 w-8" />
            Agentic Workflows
          </h1>
          <p className="text-gray-600 mt-2">
            View-only access to your active automated workflows. These workflows
            run automatically in the background without requiring your input.
          </p>
        </div>

        {/* Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Hands-Off Mode:</strong> These workflows are managed by your
                admin or agent. You can view their status and execution history, but
                cannot modify or configure them.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Execution Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{executionStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {executionStats.completed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {executionStats.failed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {executionStats.running}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Workflows */}
        <Card>
          <CardHeader>
            <CardTitle>Active Agentic Workflows</CardTitle>
            <CardDescription>
              Workflows that are currently active and running automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workflows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No agentic workflows are currently active.</p>
                <p className="text-sm mt-2">
                  Your admin or agent can configure workflows for you.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <Card
                    key={workflow.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedWorkflowId === workflow.id
                        ? 'border-blue-500 bg-blue-50'
                        : ''
                    }`}
                    onClick={() =>
                      setSelectedWorkflowId(
                        selectedWorkflowId === workflow.id ? null : workflow.id
                      )
                    }
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-blue-600" />
                            {workflow.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {workflow.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(workflow.isActive ? 'completed' : 'failed')}
                          <Badge variant="outline">
                            Priority: {workflow.executionPriority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Trigger</p>
                          <div className="flex items-center gap-1">
                            {getTriggerIcon(workflow.trigger.type)}
                            <span className="capitalize">{workflow.trigger.type}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Auto-Approve</p>
                          <p>{workflow.autoApprove ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Max Retries</p>
                          <p>{workflow.maxRetries}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Target Mode</p>
                          <p>
                            {workflow.targetAccessMode.length > 0
                              ? workflow.targetAccessMode.join(', ')
                              : 'All'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Execution History</CardTitle>
            <CardDescription>
              {selectedWorkflowId
                ? 'Execution history for selected workflow'
                : 'Most recent workflow executions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {executions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No executions found.</p>
                <p className="text-sm mt-2">
                  Workflow executions will appear here once workflows are triggered.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {executions.map((execution) => (
                  <Card key={execution.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{execution.workflowName}</h3>
                            {getStatusBadge(execution.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <Clock className="h-3 w-3 inline mr-1" />
                              Started: {formatDate(execution.startTime)}
                            </p>
                            {execution.endTime && (
                              <p>
                                <CheckCircle className="h-3 w-3 inline mr-1" />
                                Completed: {formatDate(execution.endTime)}
                              </p>
                            )}
                            {execution.durationMs !== null && (
                              <p>
                                Duration: {formatDuration(execution.durationMs)}
                              </p>
                            )}
                            {execution.error && (
                              <p className="text-red-600">
                                <XCircle className="h-3 w-3 inline mr-1" />
                                Error: {execution.error}
                              </p>
                            )}
                          </div>
                          {execution.result?.eventUrl && (
                            <div className="mt-2">
                              <a
                                href={execution.result.eventUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Calendar className="h-3 w-3" />
                                View Calendar Event
                                <ArrowRight className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      {execution.steps && execution.steps.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs font-semibold text-gray-500 mb-2">
                            Execution Steps:
                          </p>
                          <div className="space-y-1">
                            {execution.steps.map((step, idx) => (
                              <div
                                key={step.id || idx}
                                className="text-xs text-gray-600 flex items-center gap-2"
                              >
                                <span className="w-4 text-center">{idx + 1}.</span>
                                <span className="capitalize">{step.type}</span>
                                <Badge
                                  variant="outline"
                                  className={
                                    step.status === 'completed'
                                      ? 'bg-green-50 text-green-700'
                                      : step.status === 'failed'
                                        ? 'bg-red-50 text-red-700'
                                        : ''
                                  }
                                >
                                  {step.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
