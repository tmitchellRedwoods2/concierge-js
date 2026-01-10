"use client";

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2 } from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface NodeConfigModalProps {
  node: Node | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, data: any) => void;
}

export default function NodeConfigModal({ node, isOpen, onClose, onSave }: NodeConfigModalProps) {
  const [config, setConfig] = useState<any>({});
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);

  useEffect(() => {
    if (node) {
      setConfig({ ...node.data });
    }
  }, [node]);

  // Load automation rules when modal opens for automation_rule node
  useEffect(() => {
    if (isOpen && node?.type === 'automation_rule') {
      loadAutomationRules();
    }
  }, [isOpen, node]);

  const loadAutomationRules = async () => {
    try {
      setLoadingRules(true);
      const response = await fetch('/api/automation/rules');
      const data = await response.json();
      
      if (data.success) {
        setAutomationRules(data.rules || []);
      }
    } catch (error) {
      console.error('Error loading automation rules:', error);
    } finally {
      setLoadingRules(false);
    }
  };

  if (!isOpen || !node) return null;

  const handleSave = () => {
    onSave(node.id, config);
    onClose();
  };

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="triggerType">Trigger Type</Label>
        <Select
          value={config.triggerType || 'email'}
          onValueChange={(value) => setConfig(prev => ({ ...prev, triggerType: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="voicemail">Voicemail</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="schedule">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Conditions</Label>
        <div className="space-y-2">
          {(config.conditions || []).map((condition: any, index: number) => (
            <div key={index} className="flex gap-2 items-center">
              <Select
                value={condition.field || 'content'}
                onValueChange={(value) => {
                  const newConditions = [...(config.conditions || [])];
                  newConditions[index] = { ...newConditions[index], field: value };
                  setConfig(prev => ({ ...prev, conditions: newConditions }));
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                  <SelectItem value="sender">Sender</SelectItem>
                  <SelectItem value="from">From</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={condition.operator || 'contains'}
                onValueChange={(value) => {
                  const newConditions = [...(config.conditions || [])];
                  newConditions[index] = { ...newConditions[index], operator: value };
                  setConfig(prev => ({ ...prev, conditions: newConditions }));
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="startsWith">Starts With</SelectItem>
                  <SelectItem value="endsWith">Ends With</SelectItem>
                  <SelectItem value="regex">Regex</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                value={condition.value || ''}
                onChange={(e) => {
                  const newConditions = [...(config.conditions || [])];
                  newConditions[index] = { ...newConditions[index], value: e.target.value };
                  setConfig(prev => ({ ...prev, conditions: newConditions }));
                }}
                placeholder="Value"
                className="flex-1"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newConditions = (config.conditions || []).filter((_: any, i: number) => i !== index);
                  setConfig(prev => ({ ...prev, conditions: newConditions }));
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newConditions = [...(config.conditions || []), { field: 'content', operator: 'contains', value: '' }];
              setConfig(prev => ({ ...prev, conditions: newConditions }));
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Condition
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAIConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="prompt">AI Prompt</Label>
        <Textarea
          id="prompt"
          value={config.prompt || ''}
          onChange={(e) => setConfig(prev => ({ ...prev, prompt: e.target.value }))}
          placeholder="Enter the prompt for AI processing..."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="model">AI Model</Label>
        <Select
          value={config.model || 'claude-3-sonnet'}
          onValueChange={(value) => setConfig(prev => ({ ...prev, model: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
            <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
            <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="temperature">Temperature</Label>
        <Input
          id="temperature"
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={config.temperature || 0.7}
          onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
        />
        <p className="text-xs text-gray-500 mt-1">Controls randomness (0 = deterministic, 2 = very random)</p>
      </div>

      <div>
        <Label htmlFor="maxTokens">Max Tokens</Label>
        <Input
          id="maxTokens"
          type="number"
          min="1"
          max="4000"
          value={config.maxTokens || 1000}
          onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
        />
      </div>
    </div>
  );

  const renderAPIConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="url">API URL</Label>
        <Input
          id="url"
          value={config.url || ''}
          onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
          placeholder="https://api.example.com/endpoint"
        />
      </div>

      <div>
        <Label htmlFor="method">HTTP Method</Label>
        <Select
          value={config.method || 'POST'}
          onValueChange={(value) => setConfig(prev => ({ ...prev, method: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Headers</Label>
        <div className="space-y-2">
          {Object.entries(config.headers || {}).map(([key, value], index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={key}
                onChange={(e) => {
                  const newHeaders = { ...(config.headers || {}) };
                  delete newHeaders[key];
                  newHeaders[e.target.value] = value;
                  setConfig(prev => ({ ...prev, headers: newHeaders }));
                }}
                placeholder="Header name"
                className="w-32"
              />
              <Input
                value={value as string}
                onChange={(e) => {
                  const newHeaders = { ...(config.headers || {}) };
                  newHeaders[key] = e.target.value;
                  setConfig(prev => ({ ...prev, headers: newHeaders }));
                }}
                placeholder="Header value"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newHeaders = { ...(config.headers || {}) };
                  delete newHeaders[key];
                  setConfig(prev => ({ ...prev, headers: newHeaders }));
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newHeaders = { ...(config.headers || {}), '': '' };
              setConfig(prev => ({ ...prev, headers: newHeaders }));
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Header
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="body">Request Body</Label>
        <Textarea
          id="body"
          value={typeof config.body === 'string' ? config.body : JSON.stringify(config.body || {}, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setConfig(prev => ({ ...prev, body: parsed }));
            } catch {
              setConfig(prev => ({ ...prev, body: e.target.value }));
            }
          }}
          placeholder='{"key": "value"}'
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">Enter JSON object or string</p>
      </div>
    </div>
  );

  const renderConditionConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="condition">Condition Expression</Label>
        <Textarea
          id="condition"
          value={config.condition || ''}
          onChange={(e) => setConfig(prev => ({ ...prev, condition: e.target.value }))}
          placeholder="e.g., {{ai_result.confidence}} > 0.8"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">Use template variables like {`{{ai_result.field}}`} or {`{{trigger.data}}`}</p>
      </div>

      <div>
        <Label htmlFor="truePath">True Path Label</Label>
        <Input
          id="truePath"
          value={config.truePath || 'True'}
          onChange={(e) => setConfig(prev => ({ ...prev, truePath: e.target.value }))}
          placeholder="True"
        />
      </div>

      <div>
        <Label htmlFor="falsePath">False Path Label</Label>
        <Input
          id="falsePath"
          value={config.falsePath || 'False'}
          onChange={(e) => setConfig(prev => ({ ...prev, falsePath: e.target.value }))}
          placeholder="False"
        />
      </div>
    </div>
  );

  const renderApprovalConfig = () => (
    <div className="space-y-4">
      <div>
        <Label>Approvers</Label>
        <div className="space-y-2">
          {(config.approvers || []).map((approver: string, index: number) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={approver}
                onChange={(e) => {
                  const newApprovers = [...(config.approvers || [])];
                  newApprovers[index] = e.target.value;
                  setConfig(prev => ({ ...prev, approvers: newApprovers }));
                }}
                placeholder="approver@example.com"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newApprovers = (config.approvers || []).filter((_: any, i: number) => i !== index);
                  setConfig(prev => ({ ...prev, approvers: newApprovers }));
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newApprovers = [...(config.approvers || []), ''];
              setConfig(prev => ({ ...prev, approvers: newApprovers }));
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Approver
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="timeout">Timeout (hours)</Label>
        <Input
          id="timeout"
          type="number"
          min="1"
          max="168"
          value={Math.round((config.timeout || 24 * 60 * 60 * 1000) / (1000 * 60 * 60))}
          onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) * 60 * 60 * 1000 }))}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="requireAll"
          checked={config.requireAll || false}
          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, requireAll: checked }))}
        />
        <Label htmlFor="requireAll">Require all approvers</Label>
      </div>
    </div>
  );

  const renderAutomationRuleConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ruleId">Select Automation Rule *</Label>
        {loadingRules ? (
          <div className="text-sm text-gray-500 py-2">Loading automation rules...</div>
        ) : (
          <Select
            value={config.ruleId || ''}
            onValueChange={(value) => {
              const selectedRule = automationRules.find(r => r.id === value);
              setConfig(prev => ({ 
                ...prev, 
                ruleId: value,
                ruleName: selectedRule?.name || ''
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an automation rule" />
            </SelectTrigger>
            <SelectContent>
              {automationRules.length === 0 ? (
                <SelectItem value="" disabled>No automation rules available</SelectItem>
              ) : (
                automationRules.map((rule) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {rule.name} {!rule.enabled && <Badge variant="secondary" className="ml-2">Disabled</Badge>}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Select an automation rule to execute as part of this workflow step.
          The rule will use the workflow context (trigger data, AI results, etc.).
        </p>
      </div>

      {config.ruleId && (
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm font-medium text-blue-900">Selected Rule:</p>
          <p className="text-sm text-blue-700">{config.ruleName || 'Unknown'}</p>
          <p className="text-xs text-blue-600 mt-1">
            This rule will execute when the workflow reaches this step.
            It will have access to all workflow context data.
          </p>
        </div>
      )}
    </div>
  );

  const renderEndConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="result">Result Type</Label>
        <Select
          value={config.result || 'success'}
          onValueChange={(value) => setConfig(prev => ({ ...prev, result: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Result Message</Label>
        <Textarea
          id="message"
          value={config.message || ''}
          onChange={(e) => setConfig(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Optional message to include with the result"
          rows={3}
        />
      </div>
    </div>
  );

  const renderConfigForm = () => {
    switch (node.type) {
      case 'trigger':
        return renderTriggerConfig();
      case 'ai':
        return renderAIConfig();
      case 'api':
        return renderAPIConfig();
      case 'condition':
        return renderConditionConfig();
      case 'approval':
        return renderApprovalConfig();
      case 'automation_rule':
        return renderAutomationRuleConfig();
      case 'end':
        return renderEndConfig();
      default:
        return <div>No configuration available for this node type.</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Configure {node.data.label}</CardTitle>
            <CardDescription>
              {node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node Configuration
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="label">Node Name</Label>
              <Input
                id="label"
                value={config.label || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Enter node name"
              />
            </div>

            {renderConfigForm()}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Configuration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
