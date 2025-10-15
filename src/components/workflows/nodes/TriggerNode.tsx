"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Clock, Zap } from 'lucide-react';

interface TriggerNodeData {
  label: string;
  triggerType: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

const getTriggerIcon = (type: string) => {
  switch (type) {
    case 'email':
      return <Mail className="w-4 h-4" />;
    case 'voicemail':
      return <Phone className="w-4 h-4" />;
    case 'schedule':
      return <Clock className="w-4 h-4" />;
    case 'webhook':
      return <Zap className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
};

const getTriggerColor = (type: string) => {
  switch (type) {
    case 'email':
      return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'voicemail':
      return 'bg-green-100 border-green-300 text-green-800';
    case 'schedule':
      return 'bg-purple-100 border-purple-300 text-purple-800';
    case 'webhook':
      return 'bg-orange-100 border-orange-300 text-orange-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

export default function TriggerNode({ data, selected }: NodeProps<TriggerNodeData>) {
  return (
    <div className={`px-1 py-0.5 shadow-sm rounded border w-[60px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } ${getTriggerColor(data.triggerType)}`}>
      <div className="flex items-center justify-center mb-1">
        {getTriggerIcon(data.triggerType)}
      </div>
      
      <div className="text-xs font-bold text-center mb-1">
        {data.triggerType.charAt(0).toUpperCase() + data.triggerType.slice(1)}
      </div>
      
      {data.conditions.length > 0 && (
        <div className="text-xs text-center truncate">
          {data.conditions[0].value}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-blue-500 border-2 border-white hover:bg-blue-600"
        style={{ right: -6 }}
      />
    </div>
  );
}
