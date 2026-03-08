'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
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

  // Build reverse lookup maps for relationships
  const spouseOf = new Map<string, string[]>(); // who lists this person as spouse
  const parentOf = new Map<string, string[]>(); // who lists this person as parent

  members.forEach((m) => {
    m.spouseIds.forEach((sId) => {
      if (!spouseOf.has(sId)) spouseOf.set(sId, []);
      spouseOf.get(sId)!.push(m.id);
    });
    m.parentIds.forEach((pId) => {
      if (!parentOf.has(pId)) parentOf.set(pId, []);
      parentOf.get(pId)!.push(m.id);
    });
  });

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
    // Also check reverse: who lists me as their parent (my children)
    (parentOf.get(memberId) || []).forEach((cId) => assignGeneration(cId, gen + 1));

    // Spouses are same generation
    member.spouseIds.forEach((sId) => assignGeneration(sId, gen));
    // Also check reverse: who lists me as their spouse
    (spouseOf.get(memberId) || []).forEach((sId) => assignGeneration(sId, gen));
  }

  // Start from root
  assignGeneration(rootId, 0);

  // Assign any unpositioned members based on their relationships
  members.forEach((m) => {
    if (!generations.has(m.id)) {
      // Try to find generation from existing relationships
      let foundGen: number | null = null;

      // Check if any of my spouses have a generation
      for (const sId of m.spouseIds) {
        if (generations.has(sId)) {
          foundGen = generations.get(sId)!;
          break;
        }
      }
      // Check if any of my children have a generation
      if (foundGen === null) {
        for (const cId of m.childrenIds) {
          if (generations.has(cId)) {
            foundGen = generations.get(cId)! - 1;
            break;
          }
        }
      }
      // Check if any of my parents have a generation
      if (foundGen === null) {
        for (const pId of m.parentIds) {
          if (generations.has(pId)) {
            foundGen = generations.get(pId)! + 1;
            break;
          }
        }
      }

      assignGeneration(m.id, foundGen ?? 0);
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

    // Sort by birth date (oldest first), keeping spouses adjacent
    const sortedMembers = [...genMembers].sort((a, b) => {
      if (!a.birthDate && !b.birthDate) return 0;
      if (!a.birthDate) return 1;
      if (!b.birthDate) return -1;
      return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
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

  // Build a map of node positions for spouse edge direction
  const nodePositions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node) => {
    nodePositions.set(node.id, node.position);
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
  const processedSpousePairs = new Set<string>();

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

    // Spouse edges - connect from right side of left person to left side of right person
    member.spouseIds.forEach((spouseId) => {
      const pairKey = [member.id, spouseId].sort().join('-');
      if (processedSpousePairs.has(pairKey)) return;
      processedSpousePairs.add(pairKey);

      const memberPos = nodePositions.get(member.id);
      const spousePos = nodePositions.get(spouseId);
      if (!memberPos || !spousePos) return;

      // Determine which is on the left
      const leftId = memberPos.x < spousePos.x ? member.id : spouseId;
      const rightId = memberPos.x < spousePos.x ? spouseId : member.id;

      const color = spouseColors[spouseColorIndex % spouseColors.length];
      spouseColorIndex++;

      edges.push({
        id: `spouse-${pairKey}`,
        source: leftId,
        target: rightId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'straight',
        style: {
          stroke: color,
          strokeWidth: 3,
        },
      });
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
      </ReactFlow>
    </div>
  );
}
