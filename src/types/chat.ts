export type NavItem = {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  active?: boolean;
};

export type PinnedItem = {
  id: string;
  title: string;
  iconName: string;
  color: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  iconName: string;
  color: string;
};

export type QuickAction = {
  id: string;
  label: string;
  iconName: string;
};
