const pairs = [
  ["Light primary text", "#172033", "#F6F8FB", "normal"],
  ["Light secondary text", "#667085", "#FFFFFF", "normal"],
  ["Light primary action", "#0B695C", "#FFFFFF", "normal"],
  ["Light critical text", "#B42318", "#FFF4F2", "normal"],
  ["Dark primary text", "#E8E8E8", "#151515", "normal"],
  ["Dark secondary text", "#B0B0B0", "#1F1F1F", "normal"],
  ["Dark muted metadata", "#929292", "#1F1F1F", "normal"],
  ["Dark blue interactive text", "#6F91BD", "#1F1F1F", "normal"],
  ["Dark critical semantic text", "#D87878", "#1F1F1F", "normal"],
  ["Dark high semantic text", "#D98C6D", "#1F1F1F", "normal"],
  ["Dark moderate semantic text", "#B18A45", "#1F1F1F", "normal"],
  ["Dark low semantic text", "#5C9272", "#1F1F1F", "normal"],
  ["Dark primary button text", "#FFFFFF", "#4A6FA5", "normal"],
];

function luminance(hex) {
  const components = hex.slice(1).match(/.{2}/g).map((part) => Number.parseInt(part, 16) / 255);
  const [r, g, b] = components.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

console.table(pairs.map(([name, foreground, background, size]) => {
  const value = ratio(foreground, background);
  return { name, foreground, background, ratio: value.toFixed(2), "AA normal": value >= 4.5 ? "PASS" : "FAIL", "AA large": value >= 3 ? "PASS" : "FAIL", size };
}));
