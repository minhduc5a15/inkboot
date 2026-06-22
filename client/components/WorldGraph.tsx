'use client';

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  Panel,
  Handle,
  Position,
} from '@xyflow/react';
import { WorldEntity, Relation as WorldRelation } from '@/types';
import '@xyflow/react/dist/style.css';

// Custom Node Component
const EntityNode = ({
  data,
}: {
  data: Record<string, unknown> & { type: string; label: string };
}) => {
  const getBorderColor = (type: string) => {
    switch (type) {
      case 'character':
        return 'border-blue-500/50';
      case 'location':
        return 'border-emerald-500/50';
      case 'organization':
        return 'border-amber-500/50';
      case 'lore':
        return 'border-purple-500/50';
      case 'item':
        return 'border-rose-500/50';
      default:
        return 'border-zinc-700';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'character':
        return 'text-blue-400';
      case 'location':
        return 'text-emerald-400';
      case 'organization':
        return 'text-amber-400';
      default:
        return 'text-zinc-400';
    }
  };

  return (
    <div
      className={`px-4 py-2 rounded-lg bg-zinc-900 border-2 ${getBorderColor(data.type)} shadow-2xl min-w-[150px] group transition-all hover:scale-105`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-zinc-600 border-none"
      />
      <div className="flex flex-col gap-1">
        <span
          className={`text-[8px] uppercase tracking-widest font-bold ${getIconColor(data.type)}`}
        >
          {data.type}
        </span>
        <span className="text-white font-serif italic text-sm">
          {data.label}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-zinc-600 border-none"
      />
    </div>
  );
};

const nodeTypes = {
  entity: EntityNode,
};

interface WorldGraphProps {
  entities: WorldEntity[];
  relations: WorldRelation[];
  onNodeClick?: (entity: WorldEntity) => void;
}

export default function WorldGraph({
  entities,
  relations,
  onNodeClick,
}: WorldGraphProps) {
  // Memoize nodes and edges
  const initialNodes: Node[] = useMemo(() => {
    return entities.map((entity, index) => {
      // Simple circle layout with deterministic radius
      const angle = (index / entities.length) * 2 * Math.PI;
      const radius = 250 + (index % 5) * 20;
      return {
        id: entity.id,
        type: 'entity',
        position: {
          x: Math.cos(angle) * radius + 400,
          y: Math.sin(angle) * radius + 300,
        },
        data: {
          label: entity.name,
          type: entity.type || 'character',
          original: entity,
        },
      };
    });
  }, [entities]);

  const initialEdges: Edge[] = useMemo(() => {
    return relations.map((rel) => ({
      id: rel.id,
      source: rel.sourceEntityId,
      target: rel.targetEntityId,
      label: rel.relationType,
      animated: true,
      style: { stroke: '#444' },
      labelStyle: { fill: '#888', fontSize: 10, fontStyle: 'italic' },
      labelBgStyle: { fill: '#161616', fillOpacity: 0.8 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
    }));
  }, [relations]);

  const [nodes, setNodes] = React.useState<Node[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);

  // Update nodes/edges when props change (e.g. new entity added)
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    if (onNodeClick && node.data.original) {
      onNodeClick(node.data.original as WorldEntity);
    }
  };

  return (
    <div className="w-full h-[700px] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
      >
        <Background color="#222" gap={20} />
        <Controls className="bg-zinc-900 border-zinc-800 fill-white" />
        <Panel
          position="top-right"
          className="bg-zinc-900/80 p-2 rounded border border-zinc-800 backdrop-blur-md"
        >
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Drag to move • Click to edit
          </p>
        </Panel>
      </ReactFlow>
    </div>
  );
}
