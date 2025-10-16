"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface EndNodeData {
  label: string;
  result: string;
}

const getResultIcon = (result: string) => {
  switch (result) {
    case 'success':
      return <CheckCircle className="w-4 h-4" />;
    case 'error':
      return <XCircle className="w-4 h-4" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <CheckCircle className="w-4 h-4" />;
  }
};

const getResultColor = (result: string) => {
  switch (result) {
    case 'success':
      return 'bg-green-100 border-green-300 text-green-800';
    case 'error':
      return 'bg-red-100 border-red-300 text-red-800';
    case 'warning':
      return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

export default function EndNode({ data, selected }: NodeProps<EndNodeData>) {
  return (
    <div className={`px-1 py-0.5 shadow-sm rounded border w-[60px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } ${getResultColor(data.result)}`}>
      <div className="flex items-center gap-1 mb-1">
        {getResultIcon(data.result)}
        <div className="font-bold text-xs">{data.label}</div>
      </div>
      
      <div className="text-xs text-gray-600 mb-1">
        End
      </div>
      
      <Badge variant="secondary" className="text-xs">
        {data.result || 'success'}
      </Badge>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-gray-500 border-2 border-white"
        style={{ left: -6 }}
      />
    </div>
  );
}
