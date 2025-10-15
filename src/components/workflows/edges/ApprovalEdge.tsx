"use client";

import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

export default function ApprovalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeColor = () => {
    if (data?.type === 'approved') return '#10b981'; // green
    if (data?.type === 'rejected') return '#ef4444'; // red
    if (data?.type === 'true') return '#10b981'; // green
    if (data?.type === 'false') return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  const getEdgeLabel = () => {
    if (data?.type === 'approved') return 'Approved';
    if (data?.type === 'rejected') return 'Rejected';
    if (data?.type === 'true') return 'True';
    if (data?.type === 'false') return 'False';
    return '';
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: getEdgeColor(),
          strokeWidth: 2,
        }}
      />
      {getEdgeLabel() && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              style={{
                background: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                border: `1px solid ${getEdgeColor()}`,
                color: getEdgeColor(),
                fontWeight: 'bold',
              }}
            >
              {getEdgeLabel()}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
