export const generateMenus = <
  T extends { id: number; pid: number | null; sort: number },
>(
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
      menus.sort((a, b) => a.sort - b.sort);
      return;
    }

    const parent = permissionMap.get(permission.pid);
    if (!parent) {
      return;
    }

    if (parent.children) {
      parent.children.push(permission);
      parent.children.sort((a, b) => a.sort - b.sort);
      return;
    }

    parent.children = [permission];
  });

  return menus;
};
