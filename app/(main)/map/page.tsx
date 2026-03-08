'use client';

import MigrationMap from '@/components/map/MigrationMap';
import ProfileDrawer from '@/components/profile/ProfileDrawer';

export default function MapPage() {
  return (
    <div style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <MigrationMap />
      <ProfileDrawer />
    </div>
  );
}
