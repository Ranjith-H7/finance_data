export const resolveJwtSecret = () => {
  const configuredSecret = String(process.env.JWT_SECRET ?? '').trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'dev-only-jwt-secret-change-me';
  }

  throw new Error('JWT_SECRET is not configured');
};