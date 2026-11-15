// Генерирует SVG-плейсхолдеры фото «до/после» и постеры видео в public/img.
// Запуск: npm run placeholders. Замените результат своими фото.
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('public/img', { recursive: true });
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const W = 800, H = 600;
const scenes = [
  { name: 'tiles', hue: 190 }, { name: 'kitchen', hue: 30 }, { name: 'oven', hue: 15 },
  { name: 'window', hue: 205 }, { name: 'floor', hue: 40 }, { name: 'shower', hue: 170 },
];

function scene(s, dirty) {
  const bg = dirty ? `hsl(${s.hue} 12% 58%)` : `hsl(${s.hue} 45% 92%)`;
  const line = dirty ? `hsl(${s.hue} 10% 40%)` : `hsl(${s.hue} 40% 80%)`;
  let g = `<rect width="${W}" height="${H}" fill="${bg}"/>`;
  // плитка/сетка
  for (let x = 0; x <= W; x += 100) g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${line}" stroke-width="3"/>`;
  for (let y = 0; y <= H; y += 100) g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${line}" stroke-width="3"/>`;
  // «кран»/объект
  g += `<rect x="300" y="230" width="200" height="140" rx="${s.name === 'window' ? 4 : 24}" fill="${dirty ? `hsl(${s.hue} 8% 48%)` : '#fff'}" stroke="${line}" stroke-width="4"/>`;
  g += `<circle cx="400" cy="300" r="34" fill="${dirty ? `hsl(${s.hue} 8% 38%)` : `hsl(${s.hue} 50% 88%)`}"/>`;
  if (dirty) {
    for (let i = 0; i < 38; i++) {
      const x = rnd() * W, y = rnd() * H, r = 8 + rnd() * 50;
      g += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${r.toFixed(0)}" ry="${(r * (0.5 + rnd() * 0.6)).toFixed(0)}" fill="hsl(${30 + rnd() * 20} 25% ${22 + rnd() * 12}%)" opacity="${(0.25 + rnd() * 0.35).toFixed(2)}"/>`;
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const x = 80 + rnd() * 640, y = 60 + rnd() * 480, r = 10 + rnd() * 14;
      g += `<path d="M${x} ${y - r} L${x + r * 0.25} ${y - r * 0.25} L${x + r} ${y} L${x + r * 0.25} ${y + r * 0.25} L${x} ${y + r} L${x - r * 0.25} ${y + r * 0.25} L${x - r} ${y} L${x - r * 0.25} ${y - r * 0.25}Z" fill="#fff" opacity=".95"/>`;
    }
  }
  return g;
}

const svg = (inner, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${inner}` +
  `<g font-family="Arial,sans-serif" font-size="22" font-weight="700"><rect x="20" y="20" width="120" height="38" fill="#14231f" opacity=".85"/><text x="80" y="46" text-anchor="middle" fill="#fff">${label}</text></g>` +
  `<text x="${W - 20}" y="${H - 20}" text-anchor="end" font-family="Arial,sans-serif" font-size="16" fill="#000" opacity=".35">фото-плейсхолдер</text></svg>`;

scenes.forEach((s, i) => {
  writeFileSync(`public/img/work-${i + 1}-before.svg`, svg(scene(s, true), 'ДО'));
  writeFileSync(`public/img/work-${i + 1}-after.svg`, svg(scene(s, false), 'ПОСЛЕ'));
});

[205, 160, 30].forEach((hue, i) => {
  const inner = `<rect width="${W}" height="${H}" fill="hsl(${hue} 40% 86%)"/>` +
    `<circle cx="640" cy="120" r="150" fill="hsl(${hue} 50% 92%)"/><circle cx="120" cy="520" r="190" fill="hsl(${hue} 35% 78%)"/>`;
  writeFileSync(`public/img/video-${i + 1}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${inner}</svg>`);
});

writeFileSync('public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0e7a4b"/><path d="M32 12l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="#fff"/></svg>`);
console.log('Готово: public/img');
