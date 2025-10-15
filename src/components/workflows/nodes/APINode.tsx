"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { Globe, ArrowRight } from 'lucide-react';

interface APINodeData {
  label: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
}

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-green-100 text-green-800';
    case 'POST':
      return 'bg-blue-100 text-blue-800';
    case 'PUT':
      return 'bg-yellow-100 text-yellow-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function APINode({ data, selected }: NodeProps<APINodeData>) {
  return (
    <div className={`px-1 py-0.5 shadow-sm rounded border w-[60px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } bg-orange-100 border-orange-300 text-orange-800`}>
      <div className="flex items-center justify-center mb-1">
        <Globe className="w-3 h-3" />
      </div>
      
      <div className="text-xs font-bold text-center mb-1">
        API
      </div>
      
      <div className="text-xs text-center truncate">
        {data.method || 'POST'}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-orange-500 border-2 border-white"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-orange-500 border-2 border-white"
        style={{ right: -6 }}
      />
    </div>
  );
}
