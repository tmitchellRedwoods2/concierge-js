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
    <div className={`px-1 py-0.5 shadow-sm rounded border w-[60px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } bg-purple-100 border-purple-300 text-purple-800`}>
      <div className="flex items-center justify-center mb-1">
        <Brain className="w-3 h-3" />
      </div>
      
      <div className="text-xs font-bold text-center mb-1">
        AI
      </div>
      
      <div className="text-xs text-center truncate">
        {data.model || 'claude'}
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
