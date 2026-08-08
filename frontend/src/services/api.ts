const ACCESS_TOKEN_KEY = 'smartcook_access_token';
const REFRESH_TOKEN_KEY = 'smartcook_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  options.headers = headers;

  let res = await fetch(url, options);

  // Nếu gặp lỗi 401 (Access Token hết hạn), thử dùng Refresh Token
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await autoRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      options.headers = headers;
      res = await fetch(url, options);
    }
  }

  return res;
}

export async function autoRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const json = await res.json();
    if (json.success && json.data?.accessToken) {
      setTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    }
  } catch (err) {
    console.error('Lỗi khi auto refresh token:', err);
  }

  clearTokens();
  return false;
}
