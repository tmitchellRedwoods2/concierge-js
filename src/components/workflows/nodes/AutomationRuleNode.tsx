"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { Zap } from 'lucide-react';

interface AutomationRuleNodeData {
  label: string;
  ruleId?: string;
  ruleName?: string;
}

export default function AutomationRuleNode({ data, selected }: NodeProps<AutomationRuleNodeData>) {
  return (
    <div className={`px-1 py-0.5 shadow-sm rounded border w-[60px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } bg-purple-100 border-purple-300 text-purple-800`}>
      <div className="flex items-center justify-center mb-1">
        <Zap className="w-3 h-3" />
      </div>
      
      <div className="text-xs font-bold text-center mb-1">
        Rule
      </div>
      
      {data.ruleName && (
        <div className="text-[8px] text-center truncate" title={data.ruleName}>
          {data.ruleName.length > 8 ? data.ruleName.substring(0, 8) + '...' : data.ruleName}
        </div>
      )}

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

