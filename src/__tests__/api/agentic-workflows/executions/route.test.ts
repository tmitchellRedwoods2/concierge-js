/**
 * Unit tests for Agentic Workflows Executions API
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/agentic-workflows/executions/route';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { WorkflowExecution } from '@/lib/models/WorkflowExecution';
import connectDB from '@/lib/db/mongodb';

jest.mock('@/lib/auth');
jest.mock('@/lib/auth/permissions');
jest.mock('@/lib/models/WorkflowExecution');
jest.mock('@/lib/db/mongodb');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockHasPermission = hasPermission as jest.MockedFunction<typeof hasPermission>;
const MockWorkflowExecution = WorkflowExecution as jest.MockedClass<typeof WorkflowExecution>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;

describe('Agentic Workflows Executions API - GET /api/agentic-workflows/executions', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'client' as const,
      accessMode: 'hands-off' as const,
    },
  };

  const mockExecutions = [
    {
      id: 'exec-1',
      workflowId: 'workflow-123',
      workflowName: 'Email Appointment Scheduler',
      status: 'completed',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T10:05:00Z',
      steps: [],
      triggerData: { email: 'test@example.com' },
      result: { appointmentId: 'appt-1' },
      userId: 'test-user-id',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'exec-2',
      workflowId: 'workflow-123',
      workflowName: 'Email Appointment Scheduler',
      status: 'failed',
      startTime: '2024-01-01T11:00:00Z',
      endTime: '2024-01-01T11:01:00Z',
      steps: [],
      triggerData: { email: 'test2@example.com' },
      error: 'Failed to parse email',
      userId: 'test-user-id',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
    mockHasPermission.mockReturnValue(true);
  });

  it('should return execution history for user', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowExecution.countDocuments as jest.Mock) = jest
      .fn()
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });

    (MockWorkflowExecution.find as jest.Mock) = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockExecutions),
            }),
          }),
        }),
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/executions'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.executions).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
    expect(data.stats).toBeDefined();
    expect(data.stats.total).toBe(2);
    expect(data.stats.completed).toBe(1);
    expect(data.stats.failed).toBe(1);
  });

  it('should filter executions by workflowId', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowExecution.countDocuments as jest.Mock) = jest
      .fn()
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockExecutions[0]]),
    };

    (MockWorkflowExecution.find as jest.Mock) = jest.fn().mockReturnValue(mockQuery);

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/executions?workflowId=workflow-123'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(MockWorkflowExecution.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'test-user-id',
        workflowId: 'workflow-123',
      })
    );
    expect(data.executions).toHaveLength(1);
  });

  it('should filter executions by status', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowExecution.countDocuments as jest.Mock) = jest
      .fn()
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockExecutions[0]]),
    };

    (MockWorkflowExecution.find as jest.Mock) = jest.fn().mockReturnValue(mockQuery);

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/executions?status=completed'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(MockWorkflowExecution.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'test-user-id',
        status: 'completed',
      })
    );
  });

  it('should support pagination with limit and offset', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowExecution.countDocuments as jest.Mock) = jest
      .fn()
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(10),
      });

    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockExecutions),
    };

    (MockWorkflowExecution.find as jest.Mock) = jest.fn().mockReturnValue(mockQuery);

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/executions?limit=5&offset=5'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.limit).toBe(5);
    expect(data.pagination.offset).toBe(5);
    expect(data.pagination.total).toBe(10);
    expect(data.pagination.hasMore).toBe(true);
  });

  it('should filter executions by date range', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowExecution.countDocuments as jest.Mock) = jest
      .fn()
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockExecutions[0]]),
    };

    (MockWorkflowExecution.find as jest.Mock) = jest.fn().mockReturnValue(mockQuery);

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/executions?startDate=2024-01-01&endDate=2024-01-31'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(MockWorkflowExecution.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'test-user-id',
        startTime: expect.objectContaining({
          $gte: expect.any(String),
          $lte: expect.any(String),
        }),
      })
    );
  });

  it('should calculate durationMs correctly', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowExecution.countDocuments as jest.Mock) = jest
      .fn()
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

    (MockWorkflowExecution.find as jest.Mock) = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockExecutions[0]]),
            }),
          }),
        }),
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/executions'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const execution = data.executions[0];
    expect(execution.durationMs).toBeDefined();
    expect(execution.durationMs).toBeGreaterThan(0);
  });

  it('should return 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/executions'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for user without permission', async () => {
    mockAuth.mockResolvedValue(mockSession as any);
    mockHasPermission.mockReturnValueOnce(false);

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/executions'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - Insufficient permissions');
  });

  it('should calculate statistics correctly', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    const mixedExecutions = [
      { ...mockExecutions[0], status: 'completed' },
      { ...mockExecutions[1], status: 'failed' },
      { ...mockExecutions[0], id: 'exec-3', status: 'running' },
      { ...mockExecutions[0], id: 'exec-4', status: 'timeout' },
    ];

    (MockWorkflowExecution.countDocuments as jest.Mock) = jest
      .fn()
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(4),
      });

    (MockWorkflowExecution.find as jest.Mock) = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mixedExecutions),
            }),
          }),
        }),
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/executions'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.stats.total).toBe(4);
    expect(data.stats.completed).toBe(1);
    expect(data.stats.failed).toBe(1);
    expect(data.stats.running).toBe(1);
    expect(data.stats.timeout).toBe(1);
  });

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValue(mockSession as any);

    (MockWorkflowExecution.countDocuments as jest.Mock) = jest
      .fn()
      .mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

    const request = new NextRequest(
      'http://localhost:3000/api/agentic-workflows/executions'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch execution logs');
  });
});
