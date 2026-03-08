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

  // Build reverse lookup maps
  const spouseOf = new Map<string, string[]>();
  const parentOf = new Map<string, string[]>();

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

    member.parentIds.forEach((pId) => assignGeneration(pId, gen - 1));
    member.childrenIds.forEach((cId) => assignGeneration(cId, gen + 1));
    (parentOf.get(memberId) || []).forEach((cId) => assignGeneration(cId, gen + 1));
    member.spouseIds.forEach((sId) => assignGeneration(sId, gen));
    (spouseOf.get(memberId) || []).forEach((sId) => assignGeneration(sId, gen));
  }

  assignGeneration(rootId, 0);

  members.forEach((m) => {
    if (!generations.has(m.id)) {
      let foundGen: number | null = null;
      for (const sId of m.spouseIds) {
        if (generations.has(sId)) { foundGen = generations.get(sId)!; break; }
      }
      if (foundGen === null) {
        for (const cId of m.childrenIds) {
          if (generations.has(cId)) { foundGen = generations.get(cId)! - 1; break; }
        }
      }
      if (foundGen === null) {
        for (const pId of m.parentIds) {
          if (generations.has(pId)) { foundGen = generations.get(pId)! + 1; break; }
        }
      }
      assignGeneration(m.id, foundGen ?? 0);
    }
  });

  const nodeWidth = 200;
  const nodeHeight = 80;
  const horizontalGap = 60;
  const verticalGap = 120;
  const familyGap = 100; // Gap between different family units

  // Get all children for a couple (intersection - children that belong to BOTH parents if both specified)
  function getCoupleChildren(parent1Id: string, parent2Id?: string): string[] {
    const p1 = memberMap.get(parent1Id);
    if (!p1) return [];

    let childIds: string[];
    if (parent2Id) {
      const p2 = memberMap.get(parent2Id);
      if (p2) {
        // Children that have BOTH parents
        const p1Children = new Set(p1.childrenIds);
        childIds = p2.childrenIds.filter(c => p1Children.has(c));
      } else {
        childIds = [...p1.childrenIds];
      }
    } else {
      childIds = [...p1.childrenIds];
    }

    // Sort by birth date
    return childIds.sort((a, b) => {
      const ma = memberMap.get(a);
      const mb = memberMap.get(b);
      if (!ma?.birthDate && !mb?.birthDate) return 0;
      if (!ma?.birthDate) return 1;
      if (!mb?.birthDate) return -1;
      return new Date(ma.birthDate).getTime() - new Date(mb.birthDate).getTime();
    });
  }

  // Position a family unit recursively, returns the width used
  interface FamilyUnit {
    coupleIds: string[];
    children: FamilyUnit[];
    x: number;
    width: number;
  }

  // Store built units by couple key for reuse
  const builtUnits = new Map<string, FamilyUnit>();

  function buildFamilyUnit(personId: string, processedCouples: Set<string>): FamilyUnit | null {
    const person = memberMap.get(personId);
    if (!person) return null;

    // Check if person already positioned via another branch
    const personKey = personId;
    if (processedCouples.has(personKey)) return null;

    // Get spouse(s)
    const allSpouses = new Set([
      ...person.spouseIds,
      ...(spouseOf.get(personId) || []),
    ]);

    // Only include spouse in couple if they don't have their own parents in the tree
    // (cross-family marriages are connected by edges only, not positioned together)
    let spouseId: string | undefined;
    for (const sId of allSpouses) {
      const spouse = memberMap.get(sId);
      if (spouse && spouse.parentIds.length === 0) {
        // Spouse has no parents in tree - position them together
        spouseId = sId;
        break;
      }
    }

    const coupleKey = [personId, spouseId].filter(Boolean).sort().join('-');

    // Return existing unit if already built
    if (builtUnits.has(coupleKey)) {
      return builtUnits.get(coupleKey)!;
    }

    if (processedCouples.has(coupleKey)) return null;
    processedCouples.add(coupleKey);
    processedCouples.add(personId);
    if (spouseId) processedCouples.add(spouseId);

    const coupleIds = spouseId ? [personId, spouseId] : [personId];

    // Get children - only those belonging to this person (not via spouse with parents)
    const childIds = person.childrenIds.slice().sort((a, b) => {
      const ma = memberMap.get(a);
      const mb = memberMap.get(b);
      if (!ma?.birthDate && !mb?.birthDate) return 0;
      if (!ma?.birthDate) return 1;
      if (!mb?.birthDate) return -1;
      return new Date(ma.birthDate).getTime() - new Date(mb.birthDate).getTime();
    });

    // Build child family units
    const childUnits: FamilyUnit[] = [];
    childIds.forEach((childId) => {
      const childUnit = buildFamilyUnit(childId, processedCouples);
      if (childUnit) childUnits.push(childUnit);
    });

    const unit: FamilyUnit = { coupleIds, children: childUnits, x: 0, width: 0 };
    builtUnits.set(coupleKey, unit);
    return unit;
  }

  // Calculate width for each family unit
  function calculateWidth(unit: FamilyUnit): number {
    const coupleWidth = unit.coupleIds.length * nodeWidth + (unit.coupleIds.length - 1) * horizontalGap;

    if (unit.children.length === 0) {
      unit.width = coupleWidth;
      return coupleWidth;
    }

    let childrenTotalWidth = 0;
    unit.children.forEach((child, i) => {
      childrenTotalWidth += calculateWidth(child);
      if (i < unit.children.length - 1) childrenTotalWidth += familyGap;
    });

    unit.width = Math.max(coupleWidth, childrenTotalWidth);
    return unit.width;
  }

  // Position family unit
  function positionFamily(unit: FamilyUnit, startX: number, gen: number) {
    const y = (gen - minGen) * (nodeHeight + verticalGap);
    const coupleWidth = unit.coupleIds.length * nodeWidth + (unit.coupleIds.length - 1) * horizontalGap;
    const coupleStartX = startX + (unit.width - coupleWidth) / 2;

    // Position couple
    unit.coupleIds.forEach((id, i) => {
      if (positioned.has(id)) return;
      const x = coupleStartX + i * (nodeWidth + horizontalGap);
      nodes.push({
        id,
        type: 'familyMember',
        position: { x, y },
        data: { member: memberMap.get(id)!, isRoot: id === rootId },
      });
      positioned.add(id);
    });

    // Position children
    let childX = startX;
    unit.children.forEach((childUnit, i) => {
      const childGen = gen + 1;
      positionFamily(childUnit, childX, childGen);
      childX += childUnit.width;
      if (i < unit.children.length - 1) childX += familyGap;
    });

    unit.x = startX;
  }

  // Find all root ancestors (those with no parents)
  const rootAncestors = new Set<string>();
  const visitedForAncestors = new Set<string>();

  function findRootAncestors(personId: string) {
    if (visitedForAncestors.has(personId)) return;
    visitedForAncestors.add(personId);

    const person = memberMap.get(personId);
    if (!person) return;

    if (person.parentIds.length === 0) {
      rootAncestors.add(personId);
    } else {
      person.parentIds.forEach(pId => findRootAncestors(pId));
    }

    // Also check spouse's ancestors
    person.spouseIds.forEach(sId => {
      const spouse = memberMap.get(sId);
      if (spouse) {
        spouse.parentIds.forEach(pId => findRootAncestors(pId));
      }
    });
  }

  findRootAncestors(rootId);

  // Build family units starting from root ancestors
  const processedCouples = new Set<string>();
  const topLevelUnits: FamilyUnit[] = [];

  rootAncestors.forEach(ancestorId => {
    const unit = buildFamilyUnit(ancestorId, processedCouples);
    if (unit) topLevelUnits.push(unit);
  });

  // Calculate minimum generation
  const minGen = Math.min(...Array.from(generations.values()));

  // Calculate total width for top level units
  let totalWidth = 0;
  topLevelUnits.forEach((unit, i) => {
    calculateWidth(unit);
    totalWidth += unit.width;
    if (i < topLevelUnits.length - 1) totalWidth += familyGap;
  });

  // Position all units starting from top level
  let startX = -totalWidth / 2;
  topLevelUnits.forEach((unit, i) => {
    const unitGen = generations.get(unit.coupleIds[0]) ?? minGen;
    positionFamily(unit, startX, unitGen);
    startX += unit.width;
    if (i < topLevelUnits.length - 1) startX += familyGap;
  });

  // Position any remaining unpositioned members (edge cases)
  let extraX = totalWidth / 2 + familyGap;
  members.forEach((m) => {
    if (!positioned.has(m.id)) {
      const gen = generations.get(m.id) ?? 0;
      const y = (gen - minGen) * (nodeHeight + verticalGap);
      nodes.push({
        id: m.id,
        type: 'familyMember',
        position: { x: extraX, y },
        data: { member: m, isRoot: m.id === rootId },
      });
      positioned.add(m.id);
      extraX += nodeWidth + horizontalGap;
    }
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
          strokeWidth: 2,
          strokeDasharray: '6 4',
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
