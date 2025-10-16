"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { GitBranch } from 'lucide-react';

interface ConditionNodeData {
  label: string;
  condition: string;
  truePath: string;
  falsePath: string;
}

export default function ConditionNode({ data, selected }: NodeProps<ConditionNodeData>) {
  return (
    <div className={`px-1 py-0.5 shadow-sm rounded border w-[60px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } bg-yellow-100 border-yellow-300 text-yellow-800`}>
      <div className="flex items-center justify-center mb-1">
        <GitBranch className="w-3 h-3" />
      </div>
      
      <div className="text-xs font-bold text-center mb-1">
        IF
      </div>
      
      <div className="text-xs text-center truncate">
        {data.condition || 'condition'}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ top: '30%', right: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ top: '70%', right: -6 }}
      />
    </div>
  );
}
