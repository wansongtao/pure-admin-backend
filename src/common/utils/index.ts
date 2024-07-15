export const generateMenus = <T extends { id: number; pid: number }>(
  permissions: T[],
) => {
  const permissionMap = new Map<number, T & { children?: T[] }>();
  const menus: (T & { children?: T[] })[] = [];

  permissions.forEach((permission) => {
    permissionMap.set(permission.id, permission);
  });

  permissions.forEach((permission) => {
    if (permission.pid === 0) {
      menus.push(permission);
      return;
    }

    const parent = permissionMap.get(permission.pid);
    if (!parent) {
      return;
    }

    if (parent.children) {
      parent.children.push(permission);
      return;
    }

    parent.children = [permission];
  });
  permissionMap.clear();

  return menus;
};
