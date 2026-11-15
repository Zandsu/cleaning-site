/* eslint-disable @typescript-eslint/no-explicit-any */
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const track = (n: string, p?: Record<string, unknown>) => (window as any).track?.(n, p);
const cfg = JSON.parse($('#cfg')!.textContent || '{}');
const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n)).replace(/ /g, ' ') + ' ₸';
const wa = (text: string) => `https://wa.me/${cfg.site.phone}?text=${encodeURIComponent(text)}`;

/* ---------- Появление при скролле ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => io.observe(el));
} else $$('.reveal').forEach((el) => el.classList.add('in'));

/* ---------- Бургер ---------- */
const burger = $('#burger')!, nav = $('#nav')!;
const setMenu = (open: boolean) => {
  nav.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
};
burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
$$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* ---------- Аналитика кликов ---------- */
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-wa],a[data-tel]');
  if (!a) return;
  if (a.dataset.wa) track('whatsapp_click', { place: a.dataset.wa });
  else track('phone_click', { place: a.dataset.tel });
});

/* ---------- Калькулятор ---------- */
function tariff(points: [number, number][], area: number): number {
  const [p0, p1, p2] = points;
  if (area <= p0[0]) return p0[1];
  const seg = area <= p1[0] ? [p0, p1] : [p1, p2];
  const [[x1, y1], [x2, y2]] = seg;
  return y1 + ((area - x1) * (y2 - y1)) / (x2 - x1);
}
const range = $<HTMLInputElement>('#area-range')!, num = $<HTMLInputElement>('#area-num')!;
const totalEl = $('#total')!, calcWa = $<HTMLAnchorElement>('#calc-wa')!;
let calcTimer: number | undefined;

function calcState() {
  const area = Math.min(1000, Math.max(cfg.calc.minArea, Number(num.value) || cfg.calc.minArea));
  const obj = cfg.objectTypes.find((o: any) => o.id === $<HTMLInputElement>('input[name=obj]:checked')!.value);
  const clean = cfg.cleanTypes.find((c: any) => c.id === $<HTMLInputElement>('input[name=clean]:checked')!.value);
  const vac = $<HTMLInputElement>('#vacuum')!.checked;
  const ex = $$<HTMLInputElement>('.extra:checked').map((c) => cfg.extras.find((e: any) => e.id === c.value));
  let total = tariff(clean.tariff, area) * obj.k;
  // округляем до 100 ₸
  total = Math.round(total / 100) * 100;
  if (vac) total += cfg.calc.vacuum.price;
  ex.forEach((e: any) => { if (e.amount) total += e.perM2 ? e.amount * area : e.amount; });
  return { area, obj, clean, vac, ex, total };
}

function recalc() {
  const s = calcState();
  totalEl.textContent = (s.area <= 40 ? 'от ' : '') + fmt(s.total);
  const lines = [
    'Здравствуйте! Хочу уточнить стоимость и дату уборки.',
    `Объект: ${s.obj.label}`,
    `Площадь: ${s.area} м²`,
    `Вид уборки: ${s.clean.label}`,
  ];
  if (s.vac) lines.push(`Доп.: ${cfg.calc.vacuum.label} (+${fmt(cfg.calc.vacuum.price)})`);
  s.ex.forEach((e: any) => lines.push(`Доп.: ${e.title} (${e.priceText})`));
  lines.push(`Расчётная стоимость: ${totalEl.textContent}`);
  calcWa.href = wa(lines.join('\n'));
  clearTimeout(calcTimer);
  calcTimer = window.setTimeout(() => track('calc_used', { area: s.area, clean: s.clean.id, obj: s.obj.id, total: s.total }), 1200);
}
range.addEventListener('input', () => { num.value = range.value; recalc(); });
num.addEventListener('input', () => { range.value = String(Math.min(Number(num.value) || 0, cfg.calc.maxArea)); recalc(); });
num.addEventListener('blur', () => { num.value = String(calcState().area); recalc(); });
$$('#calc input').forEach((i) => i.addEventListener('change', recalc));
const exBtn = $<HTMLButtonElement>('#extras-toggle')!;
exBtn.addEventListener('click', () => {
  const open = exBtn.getAttribute('aria-expanded') !== 'true';
  exBtn.setAttribute('aria-expanded', String(open));
  $('#extras-box')!.classList.toggle('open', open);
  $('#extras-toggle-t')!.textContent = open ? 'Скрыть доп. услуги' : 'Добавить услуги к расчёту';
});
calcWa.addEventListener('click', () => track('whatsapp_click', { place: 'calculator' }));
recalc();

/* ---------- Вкладки «Что входит» ---------- */
const tabs = $$<HTMLButtonElement>('[role=tab]');
function selectTab(id: string, focus = false) {
  tabs.forEach((t) => {
    const on = t.dataset.tab === id;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    $<HTMLElement>('#' + t.getAttribute('aria-controls'))!.hidden = !on;
    if (on && focus) t.focus();
  });
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t.dataset.tab!));
  t.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowLeft') {
      e.preventDefault();
      selectTab(tabs[(i + (k === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].dataset.tab!, true);
    }
  });
});
$$<HTMLAnchorElement>('[data-tab].card__link').forEach((a) => a.addEventListener('click', () => selectTab(a.dataset.tab!)));

/* ---------- FAQ ---------- */
$$<HTMLButtonElement>('.faq__q').forEach((b) => b.addEventListener('click', () => {
  const open = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', String(open));
  b.closest('.faq__item')!.classList.toggle('open', open);
}));

/* ---------- До / после ---------- */
$$('.ba').forEach((ba) => {
  const r = $<HTMLInputElement>('.ba__range', ba)!;
  const set = () => ba.style.setProperty('--pos', r.value + '%');
  r.addEventListener('input', set);
});
$('#more-works')?.addEventListener('click', (e) => {
  $$('[data-extra]').forEach((f) => { f.hidden = false; f.classList.add('in'); });
  (e.currentTarget as HTMLElement).remove();
});

/* Лайтбокс */
const lb = $<HTMLDialogElement>('#lightbox')!;
$$('.work .zoom').forEach((b) => b.addEventListener('click', () => {
  const ba = b.closest('.work')!.querySelector<HTMLElement>('.ba')!;
  $<HTMLImageElement>('#lb-before')!.src = ba.dataset.before!;
  $<HTMLImageElement>('#lb-after')!.src = ba.dataset.after!;
  $('#lb-title')!.textContent = ba.dataset.title!;
  lb.showModal();
}));
lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });

/* ---------- Видео по нажатию ---------- */
$$('.video').forEach((fig) => {
  const btn = $<HTMLButtonElement>('.video__btn', fig)!;
  btn.addEventListener('click', () => {
    const src = fig.dataset.src;
    if (!src) {
      btn.insertAdjacentHTML('beforeend', '<span class="video__stub">Видео-плейсхолдер: укажите файл в config.ts</span>');
      btn.disabled = true;
      return;
    }
    const v = document.createElement('video');
    v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('aria-label', fig.querySelector('figcaption')!.textContent || '');
    btn.replaceWith(v);
    track('video_play', { title: fig.querySelector('figcaption')!.textContent });
  });
});
