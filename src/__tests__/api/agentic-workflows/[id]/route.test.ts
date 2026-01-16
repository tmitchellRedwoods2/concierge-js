/**
 * Unit tests for Agentic Workflows API - Get workflow details
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/agentic-workflows/[id]/route';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { WorkflowModel } from '@/lib/models/Workflow';
import { WorkflowExecution } from '@/lib/models/WorkflowExecution';
import connectDB from '@/lib/db/mongodb';

jest.mock('@/lib/auth');
jest.mock('@/lib/auth/permissions');
jest.mock('@/lib/models/Workflow');
jest.mock('@/lib/models/WorkflowExecution');
jest.mock('@/lib/db/mongodb');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockHasPermission = hasPermission as jest.MockedFunction<typeof hasPermission>;
const MockWorkflowModel = WorkflowModel as jest.MockedClass<typeof WorkflowModel>;
const MockWorkflowExecution = WorkflowExecution as jest.MockedClass<typeof WorkflowExecution>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;

describe('Agentic Workflows API - GET /api/agentic-workflows/[id]', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'client' as const,
      accessMode: 'hands-off' as const,
    },
  };

  const mockWorkflow = {
    _id: 'workflow-123',
    userId: 'test-user-id',
    name: 'Email Appointment Scheduler',
    description: 'Automatically schedules appointments from emails',
    trigger: {
      type: 'email',
      conditions: [],
    },
    steps: [],
    nodes: [],
    edges: [],
    isAgentic: true,
    targetAccessMode: ['hands-off'],
    autoApprove: true,
    executionPriority: 8,
    maxRetries: 3,
    retryDelayMs: 5000,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockExecution = {
    id: 'exec-123',
    workflowId: 'workflow-123',
    workflowName: 'Email Appointment Scheduler',
    status: 'completed',
    startTime: '2024-01-01T10:00:00Z',
    endTime: '2024-01-01T10:05:00Z',
    steps: [
      {
        id: 'step-1',
        type: 'email_parse',
        status: 'completed',
      },
    ],
    triggerData: { email: 'test@example.com' },
    result: { appointmentId: 'appt-123' },
    userId: 'test-user-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
    mockHasPermission.mockReturnValue(true);
  });

  it('should return workflow details and execution history', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowModel.findById as jest.Mock) = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockWorkflow),
      }),
    });

    (MockWorkflowExecution.find as jest.Mock) = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockExecution]),
          }),
        }),
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/workflow-123'
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: 'workflow-123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.workflow).toBeDefined();
    expect(data.workflow.id).toBe('workflow-123');
    expect(data.executions).toHaveLength(1);
    expect(data.stats).toBeDefined();
    expect(data.stats.total).toBe(1);
    expect(data.stats.completed).toBe(1);
  });

  it('should return 404 when workflow not found', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowModel.findById as jest.Mock) = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/non-existent'
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Workflow not found');
  });

  it('should return 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/workflow-123'
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: 'workflow-123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for user without permission', async () => {
    mockAuth.mockResolvedValue(mockSession as any);
    mockHasPermission.mockReturnValueOnce(false);

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/workflow-123'
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: 'workflow-123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - Insufficient permissions');
  });

  it('should return 403 for workflow not owned by user and not accessible', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    const otherUserWorkflow = {
      ...mockWorkflow,
      userId: 'other-user-id',
      targetAccessMode: ['self-service'], // Different access mode
    };

    (MockWorkflowModel.findById as jest.Mock) = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(otherUserWorkflow),
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/workflow-123'
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: 'workflow-123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - Workflow not accessible');
  });

  it('should filter executions by status when provided', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowModel.findById as jest.Mock) = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockWorkflow),
      }),
    });

    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockExecution]),
    };

    (MockWorkflowExecution.find as jest.Mock) = jest.fn().mockReturnValue(mockQuery);

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/workflow-123?status=completed'
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: 'workflow-123' }),
    });

    expect(response.status).toBe(200);
    expect(MockWorkflowExecution.find).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId: 'workflow-123',
        userId: 'test-user-id',
        status: 'completed',
      })
    );
  });

  it('should calculate execution statistics correctly', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowModel.findById as jest.Mock) = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockWorkflow),
      }),
    });

    const mixedExecutions = [
      { ...mockExecution, status: 'completed' },
      { ...mockExecution, id: 'exec-2', status: 'failed' },
      { ...mockExecution, id: 'exec-3', status: 'running' },
      { ...mockExecution, id: 'exec-4', status: 'completed' },
    ];

    (MockWorkflowExecution.find as jest.Mock) = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mixedExecutions),
          }),
        }),
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/workflow-123'
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: 'workflow-123' }),
    });
    const data = await response.json();

    expect(data.stats.total).toBe(4);
    expect(data.stats.completed).toBe(2);
    expect(data.stats.failed).toBe(1);
    expect(data.stats.running).toBe(1);
  });

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowModel.findById as jest.Mock) = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/workflow-123'
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: 'workflow-123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch workflow details');
  });
});
