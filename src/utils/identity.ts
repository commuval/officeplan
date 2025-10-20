export function getDeviceId(): string {
  const key = 'device_id';
  let id = localStorage.getItem(key);
  if (id && id.trim().length > 0) return id;
  id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(key, id);
  return id;
}


