'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User } from 'lucide-react';
import type { FamilyMember } from '@/types/family';
import { getShortName, getYearsRange } from '@/utils/helpers';
import { useFamilyStore } from '@/store/familyStore';
import './FamilyMemberNode.css';

export interface FamilyMemberNodeData extends Record<string, unknown> {
  member: FamilyMember;
  isRoot: boolean;
}

interface FamilyMemberNodeProps {
  data: FamilyMemberNodeData;
}

function FamilyMemberNode({ data }: FamilyMemberNodeProps) {
  const { setSelectedMember, openDrawer, selectedMemberId } = useFamilyStore();
  const { member } = data;

  const handleClick = () => {
    setSelectedMember(member.id);
    openDrawer();
  };

  const isSelected = selectedMemberId === member.id;

  return (
    <div
      className={`family-member-node ${member.gender} ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} id="top" className="handle" />
      <Handle type="source" position={Position.Left} id="left" className="handle handle-side" />
      <Handle type="target" position={Position.Right} id="right" className="handle handle-side" />

      <div className="node-content">
        <div className="avatar">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={getShortName(member)} />
          ) : (
            <User size={32} />
          )}
        </div>
        <div className="info">
          <div className="name">{getShortName(member)}</div>
          <div className="years">{getYearsRange(member)}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="handle" />
    </div>
  );
}

export default memo(FamilyMemberNode);
