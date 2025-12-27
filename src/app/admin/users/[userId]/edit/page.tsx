/**
 * Edit User Page
 * Admin only
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: 'basic' | 'premium' | 'elite';
  role: 'client' | 'admin' | 'agent';
  accessMode?: 'hands-off' | 'self-service' | 'ai-only';
  netWorth?: number;
  annualIncome?: number;
}

export default function EditUserPage() {
  const { isAdmin } = usePermissions();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    plan: 'basic' as 'basic' | 'premium' | 'elite',
    role: 'client' as 'client' | 'admin' | 'agent',
    accessMode: 'self-service' as 'hands-off' | 'self-service' | 'ai-only' | undefined,
    netWorth: '',
    annualIncome: '',
  });

  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user');
        }

        const user: User = data.user;
        setFormData({
          username: user.username,
          email: user.email,
          password: '', // Don't pre-fill password
          firstName: user.firstName,
          lastName: user.lastName,
          plan: user.plan,
          role: user.role,
          accessMode: user.accessMode,
          netWorth: user.netWorth?.toString() || '',
          annualIncome: user.annualIncome?.toString() || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        plan: formData.plan,
        role: formData.role,
      };

      // Only include password if provided
      if (formData.password) {
        payload.password = formData.password;
      }

      // Only include accessMode for clients
      if (formData.role === 'client') {
        payload.accessMode = formData.accessMode || 'self-service';
      }

      if (formData.netWorth) {
        payload.netWorth = parseFloat(formData.netWorth);
      }
      if (formData.annualIncome) {
        payload.annualIncome = parseFloat(formData.annualIncome);
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div>Loading user...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Admin
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
          <CardDescription>Update user information and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                minLength={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Plan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as 'client' | 'admin' | 'agent';
                    setFormData({
                      ...formData,
                      role: newRole,
                      accessMode: newRole === 'client' ? (formData.accessMode || 'self-service') : undefined,
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
            </div>

            {formData.role === 'client' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Access Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.accessMode || 'self-service'}
                  onChange={(e) => setFormData({ ...formData, accessMode: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="hands-off">Hands-Off</option>
                  <option value="self-service">Self-Service</option>
                  <option value="ai-only">AI-Only</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hands-Off: Minimal UI, agents handle everything<br />
                  Self-Service: Full dashboard access<br />
                  AI-Only: Chat interface only
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Net Worth (optional)
                </label>
                <input
                  type="number"
                  value={formData.netWorth}
                  onChange={(e) => setFormData({ ...formData, netWorth: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Annual Income (optional)
                </label>
                <input
                  type="number"
                  value={formData.annualIncome}
                  onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
