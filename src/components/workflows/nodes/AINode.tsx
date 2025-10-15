"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { Brain, Zap } from 'lucide-react';

interface AINodeData {
  label: string;
  prompt: string;
  model: string;
  temperature: number;
}

export default function AINode({ data, selected }: NodeProps<AINodeData>) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } bg-purple-100 border-purple-300 text-purple-800`}>
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4" />
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      
      <div className="text-xs text-gray-600 mb-2">
        AI Processing
      </div>
      
      <div className="space-y-1">
        <Badge variant="secondary" className="text-xs">
          {data.model || 'claude-3-sonnet'}
        </Badge>
        {data.prompt && (
          <div className="text-xs text-gray-600 truncate">
            "{data.prompt.substring(0, 30)}..."
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500"
      />
    </div>
  );
}
