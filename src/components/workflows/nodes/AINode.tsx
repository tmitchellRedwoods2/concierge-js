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
    <div className={`px-2 py-1 shadow-md rounded-md border-2 w-[120px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } bg-purple-100 border-purple-300 text-purple-800`}>
      <div className="flex items-center gap-1 mb-1">
        <Brain className="w-3 h-3" />
        <div className="font-bold text-xs">{data.label}</div>
      </div>
      
      <div className="text-xs text-gray-600 mb-1">
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
        id="input"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
        style={{ right: -6 }}
      />
    </div>
  );
}
