export const generateMenus = <T extends { id: number; pid: number | null }>(
  permissions: T[],
) => {
  const permissionMap = new Map<number, T & { children?: T[] }>();
  const menus: (T & { children?: T[] })[] = [];

  permissions.forEach((permission) => {
    permissionMap.set(permission.id, permission);
  });

  permissions.forEach((permission) => {
    if (!permission.pid) {
      menus.push(permission);
      return;
    }

    const parent = permissionMap.get(permission.pid);
    if (!parent) {
      menus.push(permission);
      return;
    }

    if (parent.children) {
      parent.children.push(permission);
      return;
    }

    parent.children = [permission];
  });

  return menus;
};
