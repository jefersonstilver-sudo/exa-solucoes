import React from 'react';

const DividerGlow: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`divider-glow w-full max-w-3xl mx-auto ${className}`} aria-hidden="true" />
);

export default DividerGlow;
