export function parseCookies(header) {
  if (!header) return {};
  return header.split(";").reduce((acc, part) => {
    const [k, ...v] = part.split("=");
    acc[k.trim()] = decodeURIComponent(v.join("=") || "");
    return acc;
  }, {});
}
