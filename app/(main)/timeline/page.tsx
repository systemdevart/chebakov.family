'use client';

import TimelineView from '@/components/timeline/TimelineView';
import ProfileDrawer from '@/components/profile/ProfileDrawer';

export default function TimelinePage() {
  return (
    <div style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <TimelineView />
      <ProfileDrawer />
    </div>
  );
}
