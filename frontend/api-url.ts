const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '10.0.2.2', '10.0.3.2']);

export function validateApiBaseUrl(value: string | undefined, allowInsecureLocal = false): string {
  if (!value?.trim()) throw new Error('Set EXPO_PUBLIC_API_URL to your CHOCOLATE backend URL.');
  let parsed: URL;
  try { parsed = new URL(value.trim()); }
  catch { throw new Error('EXPO_PUBLIC_API_URL must be a valid HTTPS URL.'); }
  if (parsed.protocol === 'https:') return parsed.toString().replace(/\/$/, '');
  const isExplicitLocalHttp = parsed.protocol === 'http:' && allowInsecureLocal && LOOPBACK_HOSTS.has(parsed.hostname.toLowerCase());
  if (isExplicitLocalHttp) return parsed.toString().replace(/\/$/, '');
  throw new Error('EXPO_PUBLIC_API_URL must use HTTPS. HTTP is allowed only for explicitly enabled local development hosts.');
}
