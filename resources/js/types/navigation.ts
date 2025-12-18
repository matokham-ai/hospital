import React from 'react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any> | string;
  description?: string;
  children?: { name: string; href: string; icon?: React.ComponentType<any> }[];
}