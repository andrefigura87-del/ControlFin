import React from 'react';
import * as LucideIcons from 'lucide-react';

const DynamicIcon = ({ name, size = 20, color, ...props }) => {
  const Icon = name && LucideIcons[name] ? LucideIcons[name] : LucideIcons.HelpCircle;
  return <Icon size={size} color={color} {...props} />;
};

export default DynamicIcon;
