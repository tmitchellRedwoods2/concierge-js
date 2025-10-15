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
    <div className={`px-2 py-1 shadow-md rounded-md border-2 w-[120px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } bg-yellow-100 border-yellow-300 text-yellow-800`}>
      <div className="flex items-center gap-1 mb-1">
        <GitBranch className="w-4 h-4" />
        <div className="font-bold text-xs">{data.label}</div>
      </div>
      
      <div className="text-xs text-gray-600 mb-1">
        Condition
      </div>
      
      {data.condition && (
        <div className="text-xs text-gray-600 truncate">
          {data.condition}
        </div>
      )}

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
