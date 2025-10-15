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
    <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } bg-orange-100 border-orange-300 text-orange-800`}>
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-4 h-4" />
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      
      <div className="text-xs text-gray-600 mb-2">
        API Call
      </div>
      
      <div className="space-y-1">
        <Badge className={`text-xs ${getMethodColor(data.method)}`}>
          {data.method || 'POST'}
        </Badge>
        {data.url && (
          <div className="text-xs text-gray-600 truncate">
            {data.url}
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500"
      />
    </div>
  );
}
