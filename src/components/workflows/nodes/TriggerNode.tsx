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
    <div className={`px-3 py-2 shadow-md rounded-md border-2 min-w-[150px] max-w-[200px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } ${getTriggerColor(data.triggerType)}`}>
      <div className="flex items-center gap-2 mb-2">
        {getTriggerIcon(data.triggerType)}
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      
      <div className="text-xs text-gray-600 mb-2">
        {data.triggerType.charAt(0).toUpperCase() + data.triggerType.slice(1)} Trigger
      </div>
      
      {data.conditions.length > 0 && (
        <div className="space-y-1">
          {data.conditions.slice(0, 2).map((condition, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {condition.field} {condition.operator} "{condition.value}"
            </Badge>
          ))}
          {data.conditions.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{data.conditions.length - 2} more
            </Badge>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ right: -6 }}
      />
    </div>
  );
}
