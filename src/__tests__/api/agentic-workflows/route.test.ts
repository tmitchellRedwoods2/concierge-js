/**
 * Unit tests for Agentic Workflows API - List workflows
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/agentic-workflows/route';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { WorkflowModel } from '@/lib/models/Workflow';
import connectDB from '@/lib/db/mongodb';

jest.mock('@/lib/auth');
jest.mock('@/lib/auth/permissions');
jest.mock('@/lib/models/Workflow');
jest.mock('@/lib/db/mongodb');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockHasPermission = hasPermission as jest.MockedFunction<typeof hasPermission>;
const MockWorkflowModel = WorkflowModel as jest.MockedClass<typeof WorkflowModel>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;

describe('Agentic Workflows API - GET /api/agentic-workflows', () => {
  const mockHandsOffSession = {
    user: {
      id: 'hands-off-user-id',
      name: 'Hands-Off User',
      email: 'hands-off@example.com',
      role: 'client' as const,
      accessMode: 'hands-off' as const,
    },
  };

  const mockAdminSession = {
    user: {
      id: 'admin-user-id',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin' as const,
    },
  };

  const mockAgenticWorkflow = {
    _id: 'workflow-123',
    userId: 'hands-off-user-id',
    name: 'Email Appointment Scheduler',
    description: 'Automatically schedules appointments from emails',
    trigger: {
      type: 'email',
      conditions: [{ field: 'content', operator: 'contains', value: 'appointment' }],
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
    mockHasPermission.mockReturnValue(true);
  });

  it('should return agentic workflows for hands-off user', async () => {
    mockAuth.mockResolvedValue(mockHandsOffSession as any);

    (MockWorkflowModel.find as jest.Mock) = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockAgenticWorkflow]),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/agentic-workflows');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.workflows).toHaveLength(1);
    expect(data.workflows[0].id).toBe('workflow-123');
    expect(data.workflows[0].name).toBe('Email Appointment Scheduler');
    expect(data.workflows[0].isAgentic).toBe(true);
    expect(data.count).toBe(1);
  });

  it('should return agentic workflows for admin user', async () => {
    mockAuth.mockResolvedValue(mockAdminSession as any);

    (MockWorkflowModel.find as jest.Mock) = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockAgenticWorkflow]),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/agentic-workflows');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.workflows).toHaveLength(1);
  });

  it('should return empty array when no workflows found', async () => {
    mockAuth.mockResolvedValue(mockHandsOffSession as any);

    (MockWorkflowModel.find as jest.Mock) = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/agentic-workflows');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.workflows).toEqual([]);
    expect(data.count).toBe(0);
  });

  it('should return 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/agentic-workflows');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for user without permission', async () => {
    mockAuth.mockResolvedValue(mockHandsOffSession as any);
    mockHasPermission.mockReturnValueOnce(false);

    const request = new NextRequest('http://localhost:3000/api/agentic-workflows');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - Insufficient permissions');
  });

  it('should filter workflows by targetAccessMode for clients', async () => {
    mockAuth.mockResolvedValue(mockHandsOffSession as any);

    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockAgenticWorkflow]),
    };

    (MockWorkflowModel.find as jest.Mock) = jest.fn().mockReturnValue(mockQuery);

    const request = new NextRequest('http://localhost:3000/api/agentic-workflows');
    await GET(request);

    // Verify query includes isAgentic and access mode filters
    expect(MockWorkflowModel.find).toHaveBeenCalled();
    const queryCall = (MockWorkflowModel.find as jest.Mock).mock.calls[0][0];
    expect(queryCall.isAgentic).toBe(true);
    expect(queryCall.isActive).toBe(true);
    expect(queryCall.$or).toBeDefined();
  });

  it('should format workflow response correctly', async () => {
    mockAuth.mockResolvedValue(mockHandsOffSession as any);

    (MockWorkflowModel.find as jest.Mock) = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockAgenticWorkflow]),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/agentic-workflows');
    const response = await GET(request);
    const data = await response.json();

    const workflow = data.workflows[0];
    expect(workflow).toHaveProperty('id');
    expect(workflow).toHaveProperty('name');
    expect(workflow).toHaveProperty('description');
    expect(workflow).toHaveProperty('isAgentic');
    expect(workflow).toHaveProperty('targetAccessMode');
    expect(workflow).toHaveProperty('autoApprove');
    expect(workflow).toHaveProperty('executionPriority');
    expect(workflow).toHaveProperty('maxRetries');
    expect(workflow).toHaveProperty('retryDelayMs');
  });

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValue(mockHandsOffSession as any);

    (MockWorkflowModel.find as jest.Mock) = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/agentic-workflows');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch agentic workflows');
  });
});
