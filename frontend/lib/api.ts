const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fintrack_token");
}

export function setSession(token: string, user: { id: number; name: string; email: string }) {
  localStorage.setItem("fintrack_token", token);
  localStorage.setItem("fintrack_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("fintrack_token");
  localStorage.removeItem("fintrack_user");
}

export function getStoredUser(): { id: number; name: string; email: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("fintrack_user");
  return raw ? JSON.parse(raw) : null;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      clearSession();
      window.location.href = "/login";
    }

    let message = data.message || "An unexpected error occurred.";
    if (data.errors) {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey && data.errors[firstKey]?.[0]) {
        message = data.errors[firstKey][0];
      }
    }

    throw new ApiError(message, response.status, data.errors);
  }

  return data as T;
}