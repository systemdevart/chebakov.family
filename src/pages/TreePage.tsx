import { ReactFlowProvider } from '@xyflow/react';
import FamilyTree from '../components/tree/FamilyTree';
import ProfileDrawer from '../components/profile/ProfileDrawer';

export default function TreePage() {
  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 'calc(100vh - 64px)' }}>
        <FamilyTree />
        <ProfileDrawer />
      </div>
    </ReactFlowProvider>
  );
}
