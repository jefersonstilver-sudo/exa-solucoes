
import React from 'react';
import AdvertiserSidebarContent from './AdvertiserSidebarContent';

const AdvertiserDesktopSidebar = () => {
  return (
    <div className="hidden lg:block w-80 fixed inset-y-0 z-30">
      <AdvertiserSidebarContent />
    </div>
  );
};

export default AdvertiserDesktopSidebar;
