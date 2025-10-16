"use client";

import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NodeConfigModal from "./NodeConfigModal";
import { 
  Play, 
  Pause, 
  Save, 
  Settings, 
  Plus,
  Maximize,
  Trash2,
  Eye,
  TestTube
} from 'lucide-react';

// Custom Node Types
import TriggerNode from './nodes/TriggerNode';
import AINode from './nodes/AINode';
import APINode from './nodes/APINode';
import ConditionNode from './nodes/ConditionNode';
import ApprovalNode from './nodes/ApprovalNode';
import EndNode from './nodes/EndNode';

// Custom Edge Types
import ApprovalEdge from './edges/ApprovalEdge';

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  ai: AINode,
  api: APINode,
  condition: ConditionNode,
  approval: ApprovalNode,
  end: EndNode,
};

const edgeTypes: EdgeTypes = {
  approval: ApprovalEdge,
};

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: any;
  position: { x: number; y: number };
}

interface WorkflowDesignerProps {
  workflow?: any;
  onSave: (workflow: any) => void;
  onTest: (workflow: any) => void;
  onClose: () => void;
}

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: {
      label: 'Email Trigger',
      triggerType: 'email',
      conditions: [
        { field: 'content', operator: 'contains', value: 'appointment' }
      ]
    },
  },
];

const initialEdges: Edge[] = [];

export default function WorkflowDesigner({ workflow, onSave, onTest, onClose }: WorkflowDesignerProps) {
  // Load workflow data if provided, otherwise use initial nodes
  const getInitialNodes = () => {
    if (workflow && workflow.nodes && workflow.nodes.length > 0) {
      return workflow.nodes;
    }
    return initialNodes;
  };

  const getInitialEdges = () => {
    if (workflow && workflow.edges && workflow.edges.length > 0) {
      return workflow.edges;
    }
    return initialEdges;
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('Connecting:', params);
      
      // Validate connection
      if (!params.source || !params.target || params.source === params.target) {
        console.log('Invalid connection');
        return;
      }
      
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        type: 'default',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      };
      
      console.log('Adding edge:', newEdge);
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowConfigModal(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowConfigModal(false);
  }, []);

  const onConnectStart = useCallback((event: React.MouseEvent, { nodeId, handleId }: any) => {
    console.log('Connection started from:', nodeId, handleId);
  }, []);

  const onConnectEnd = useCallback((event: React.MouseEvent) => {
    console.log('Connection ended');
  }, []);

  // Validate workflow
  const validateWorkflow = useCallback(() => {
    // A workflow is valid if it has at least 2 nodes and they're connected
    const hasMultipleNodes = nodes.length >= 2;
    const hasConnections = edges.length >= nodes.length - 1; // At least n-1 connections for n nodes
    
    // OR if it has a trigger and end node specifically
    const hasTrigger = nodes.some(node => node.type === 'trigger');
    const hasEnd = nodes.some(node => node.type === 'end');
    const hasTriggerEndFlow = hasTrigger && hasEnd && edges.length > 0;
    
    return hasMultipleNodes || hasTriggerEndFlow;
  }, [nodes, edges]);

  // Update validation when nodes/edges change
  React.useEffect(() => {
    setIsValid(validateWorkflow());
  }, [nodes, edges, validateWorkflow]);

  // Update nodes/edges when workflow prop changes
  React.useEffect(() => {
    if (workflow) {
      if (workflow.nodes && workflow.nodes.length > 0) {
        setNodes(workflow.nodes);
      }
      if (workflow.edges && workflow.edges.length > 0) {
        setEdges(workflow.edges);
      }
    }
  }, [workflow, setNodes, setEdges]);

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 200 + (nodes.length * 50), y: 150 + (nodes.length * 30) },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Step`,
        ...getDefaultNodeData(type)
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, nodes.length]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  }, [setNodes]);

  const handleNodeConfigSave = useCallback((nodeId: string, data: any) => {
    updateNodeData(nodeId, data);
    setShowConfigModal(false);
    setSelectedNode(null);
  }, [updateNodeData]);

  const handleConfigModalClose = useCallback(() => {
    setShowConfigModal(false);
    setSelectedNode(null);
  }, []);

  const saveWorkflow = useCallback(() => {
    const workflowData = {
      name: workflow?.name || 'New Workflow',
      description: workflow?.description || '',
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        name: node.data.label,
        config: node.data,
        position: node.position
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type
      }))
    };
    onSave(workflowData);
  }, [workflow, nodes, edges, onSave]);

  const testWorkflow = useCallback(() => {
    const workflowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        name: node.data.label,
        config: node.data,
        position: node.position
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type
      }))
    };
    onTest(workflowData);
  }, [nodes, edges, onTest]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h2 className="text-xl font-semibold">🎨 Workflow Designer</h2>
          <p className="text-sm text-gray-600">Drag nodes from the sidebar to build your workflow</p>
        </div>
          <div className="flex items-center gap-2">
            <Badge variant={isValid ? "default" : "secondary"}>
              {isValid ? "Valid" : "Invalid"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => {
              if (nodes.length >= 2) {
                const newEdge = {
                  id: `test-edge-${Date.now()}`,
                  source: nodes[0].id,
                  target: nodes[1].id,
                  type: 'default',
                  animated: true,
                  style: { stroke: '#3b82f6', strokeWidth: 2 }
                };
                setEdges((eds) => [...eds, newEdge]);
                console.log('Added test edge:', newEdge);
              }
            }}>
              Test Connect
            </Button>
            <Button variant="outline" size="sm" onClick={testWorkflow} disabled={!isValid}>
              <TestTube className="w-4 h-4 mr-2" />
              Test
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              // Fit view to show all nodes
              const reactFlowInstance = document.querySelector('.react-flow') as any;
              if (reactFlowInstance && reactFlowInstance.fitView) {
                reactFlowInstance.fitView();
              }
            }}>
              <Maximize className="w-4 h-4 mr-2" />
              Fit View
            </Button>
            <Button variant="outline" size="sm" onClick={saveWorkflow} disabled={!isValid}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 border-r bg-gray-50 p-4">
          <h3 className="font-semibold mb-2">Step Library</h3>
          <p className="text-xs text-gray-600 mb-4">Drag these to the canvas to build your workflow</p>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode('trigger')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Trigger
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode('ai')}
            >
              <Plus className="w-4 h-4 mr-2" />
              AI Processing
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode('api')}
            >
              <Plus className="w-4 h-4 mr-2" />
              API Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode('condition')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Condition
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode('approval')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Approval
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode('end')}
            >
              <Plus className="w-4 h-4 mr-2" />
              End
            </Button>
          </div>

          {selectedNode && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">Selected Node</h4>
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 rounded text-sm">
                  <strong>{selectedNode.data.label}</strong>
                  <br />
                  <span className="text-gray-600">{selectedNode.type}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowConfigModal(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => deleteNode(selectedNode.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Node
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative" style={{ height: 'calc(100vh - 200px)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.1, minZoom: 0.5, maxZoom: 2 }}
            connectionLineType="smoothstep"
            defaultEdgeOptions={{
              type: 'default',
              animated: true,
              style: { stroke: '#3b82f6', strokeWidth: 2 }
            }}
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
          
          {/* Instructions Overlay */}
          {nodes.length <= 1 && !workflow && (
            <div className="absolute top-4 left-4 pointer-events-none z-10">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 max-w-sm shadow-lg border">
                <div className="text-2xl mb-2">🎨</div>
                <h3 className="font-semibold text-sm mb-2">Start Building Your Workflow</h3>
                <p className="text-xs text-gray-600 mb-2">
                  1. Drag a <strong>Trigger</strong> from the sidebar<br/>
                  2. Add <strong>AI Processing</strong> or <strong>API Call</strong> steps<br/>
                  3. Connect them by dragging between the dots<br/>
                  4. Add an <strong>End</strong> node to complete
                </p>
                <div className="text-xs text-gray-500">
                  Click any node to configure its settings
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node Configuration Modal */}
      <NodeConfigModal
        node={selectedNode}
        isOpen={showConfigModal}
        onClose={handleConfigModalClose}
        onSave={handleNodeConfigSave}
      />
    </div>
  );
}

function getDefaultNodeData(type: string) {
  switch (type) {
    case 'trigger':
      return {
        triggerType: 'email',
        conditions: []
      };
    case 'ai':
      return {
        prompt: '',
        model: 'claude-3-sonnet',
        temperature: 0.7
      };
    case 'api':
      return {
        url: '',
        method: 'POST',
        headers: {},
        body: {}
      };
    case 'condition':
      return {
        condition: '',
        truePath: '',
        falsePath: ''
      };
    case 'approval':
      return {
        approvers: [],
        timeout: 24 * 60 * 60 * 1000 // 24 hours
      };
    case 'end':
      return {
        result: 'success'
      };
    default:
      return {};
  }
}
