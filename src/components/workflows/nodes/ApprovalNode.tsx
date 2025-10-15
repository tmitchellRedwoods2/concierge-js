"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { UserCheck, Clock } from 'lucide-react';

interface ApprovalNodeData {
  label: string;
  approvers: string[];
  timeout: number;
}

export default function ApprovalNode({ data, selected }: NodeProps<ApprovalNodeData>) {
  const timeoutHours = Math.round(data.timeout / (1000 * 60 * 60));

  return (
    <div className={`px-3 py-2 shadow-md rounded-md border-2 min-w-[150px] max-w-[200px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } bg-indigo-100 border-indigo-300 text-indigo-800`}>
      <div className="flex items-center gap-2 mb-2">
        <UserCheck className="w-4 h-4" />
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      
      <div className="text-xs text-gray-600 mb-2">
        Approval Required
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span className="text-xs">{timeoutHours}h timeout</span>
        </div>
        {data.approvers.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {data.approvers.length} approver{data.approvers.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="approved"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ top: '30%', right: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="rejected"
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ top: '70%', right: -6 }}
      />
    </div>
  );
}
