'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import FamilyMemberNode, { type FamilyMemberNodeData } from './FamilyMemberNode';
import { useFamilyStore } from '@/store/familyStore';
import type { FamilyMember } from '@/types/family';
import './FamilyTree.css';

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

type FamilyNode = Node<FamilyMemberNodeData>;

function buildTreeLayout(
  members: FamilyMember[],
  rootId: string
): { nodes: FamilyNode[]; edges: Edge[] } {
  const nodes: FamilyNode[] = [];
  const edges: Edge[] = [];
  const positioned = new Set<string>();

  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Build generations
  const generations = new Map<string, number>();

  function assignGeneration(memberId: string, gen: number) {
    if (generations.has(memberId)) return;
    generations.set(memberId, gen);

    const member = memberMap.get(memberId);
    if (!member) return;

    // Parents are one generation up
    member.parentIds.forEach((pId) => assignGeneration(pId, gen - 1));
    // Children are one generation down
    member.childrenIds.forEach((cId) => assignGeneration(cId, gen + 1));
    // Spouses are same generation - recursively process their family too
    member.spouseIds.forEach((sId) => {
      if (!generations.has(sId)) {
        assignGeneration(sId, gen);
      }
    });
  }

  // Start from root
  assignGeneration(rootId, 0);

  // Assign any unpositioned members
  members.forEach((m) => {
    if (!generations.has(m.id)) {
      assignGeneration(m.id, 0);
    }
  });

  // Group by generation
  const genGroups = new Map<number, FamilyMember[]>();
  members.forEach((m) => {
    const gen = generations.get(m.id) ?? 0;
    if (!genGroups.has(gen)) {
      genGroups.set(gen, []);
    }
    genGroups.get(gen)!.push(m);
  });

  // Sort generations
  const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b);
  const minGen = sortedGens[0] ?? 0;

  // Position nodes
  const nodeWidth = 200;
  const nodeHeight = 80;
  const horizontalGap = 60;
  const verticalGap = 120;

  sortedGens.forEach((gen) => {
    const genMembers = genGroups.get(gen) ?? [];
    const genIndex = gen - minGen;
    const y = genIndex * (nodeHeight + verticalGap);

    // Sort by birth date (oldest first)
    const sortedByBirth = [...genMembers].sort((a, b) => {
      if (!a.birthDate && !b.birthDate) return 0;
      if (!a.birthDate) return 1;
      if (!b.birthDate) return -1;
      return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
    });

    // Group couples together - place spouse right after their partner
    const sortedMembers: FamilyMember[] = [];
    const placed = new Set<string>();

    sortedByBirth.forEach((member) => {
      if (placed.has(member.id)) return;

      sortedMembers.push(member);
      placed.add(member.id);

      // Add spouse(s) right after
      member.spouseIds.forEach((spouseId) => {
        const spouse = memberMap.get(spouseId);
        if (spouse && !placed.has(spouseId) && generations.get(spouseId) === gen) {
          sortedMembers.push(spouse);
          placed.add(spouseId);
        }
      });
    });

    const totalWidth = sortedMembers.length * nodeWidth + (sortedMembers.length - 1) * horizontalGap;
    const startX = -totalWidth / 2;

    sortedMembers.forEach((member, idx) => {
      if (positioned.has(member.id)) return;

      const x = startX + idx * (nodeWidth + horizontalGap);

      nodes.push({
        id: member.id,
        type: 'familyMember',
        position: { x, y },
        data: {
          member,
          isRoot: member.id === rootId,
        },
      });

      positioned.add(member.id);
    });
  });

  // Unique colors for spouse pairs
  const spouseColors = [
    '#f472b6', // pink
    '#a78bfa', // purple
    '#fb923c', // orange
    '#4ade80', // green
    '#38bdf8', // sky
    '#f87171', // red
  ];
  let spouseColorIndex = 0;

  // Create edges
  members.forEach((member) => {
    // Parent-child edges - from bottom to top
    member.parentIds.forEach((parentId) => {
      edges.push({
        id: `${parentId}-${member.id}`,
        source: parentId,
        target: member.id,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
      });
    });

    // Spouse edges - connect from left side to right side (middle of blocks)
    member.spouseIds.forEach((spouseId) => {
      if (member.id < spouseId) {
        const color = spouseColors[spouseColorIndex % spouseColors.length];
        spouseColorIndex++;
        edges.push({
          id: `spouse-${member.id}-${spouseId}`,
          source: member.id,
          target: spouseId,
          sourceHandle: 'left',
          targetHandle: 'right',
          type: 'straight',
          style: {
            stroke: color,
            strokeWidth: 3,
          },
        });
      }
    });
  });

  return { nodes, edges };
}

export default function FamilyTree() {
  const { data } = useFamilyStore();

  const { nodes, edges } = useMemo(
    () => buildTreeLayout(data.members, data.rootPersonId),
    [data.members, data.rootPersonId]
  );

  return (
    <div className="family-tree-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const nodeData = node.data as FamilyMemberNodeData;
            return nodeData?.member?.gender === 'male' ? '#3b82f6' : '#ec4899';
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
          style={{ background: '#f8fafc' }}
        />
      </ReactFlow>
    </div>
  );
}
