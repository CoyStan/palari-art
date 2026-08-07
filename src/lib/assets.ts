export function assetUrl(pathname: string) {
  if (/^(?:blob:|data:|https?:\/\/)/i.test(pathname)) return pathname;
  return `${import.meta.env.BASE_URL}${pathname.replace(/^\/+/, "")}`;
}
