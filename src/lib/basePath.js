// Prefix for static assets referenced outside next/link (favicon, manifest, public files).
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function withBasePath(path) {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}
