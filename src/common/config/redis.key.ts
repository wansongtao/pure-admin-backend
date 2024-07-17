import { createHash } from 'crypto';

export const getCaptchaKey = (ip: string, userAgent: string) => {
  const data = `${ip}:${userAgent}`;
  const key = createHash('sha256').update(data).digest('hex');
  return `captcha:${key}`;
};

export const getSSOKey = (userId: string) => `sso:${userId}`;

export const getBlackListKey = (token: string) => `blacklist:${token}`;

export const getPermissionsKey = (userId: string) => `permissions:${userId}`;
