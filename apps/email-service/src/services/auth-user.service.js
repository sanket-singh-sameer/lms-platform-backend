const AUTH_SERVICE_BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

export const getUserEmailByUserId = async (userId) => {
  if (!userId) return null;

  const endpoint = `${AUTH_SERVICE_BASE_URL.replace(/\/$/, '')}/auth/users/${encodeURIComponent(userId)}/email`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `Auth service email lookup failed with status ${response.status}`);
  }

  const payload = await response.json();
  return payload.email || null;
};
