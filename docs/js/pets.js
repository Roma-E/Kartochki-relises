// Питомцы: утверждённые рисунки. Тёмные части берут цвет из CSS-переменных,
// поэтому в тёмной теме чёрные звери автоматически становятся светлыми.
const PET_ART = {
 "dog": [
  "24 24 160 176",
  "<path d=\"M28 200 C38 166 46 144 44 116 C40 88 44 66 56 54 Q64 46 74 56 L86 66 L94 34 Q98 24 105 34 L114 62 Q128 68 138 64 L152 52 Q172 42 178 66 Q182 94 162 118 Q146 136 144 162 L142 200Z\" fill=\"#4A57D1\"/><ellipse cx=\"100\" cy=\"92\" rx=\"11\" ry=\"14\" fill=\"#FFFFFF\" transform=\"rotate(-18 100 92)\"/><ellipse cx=\"124\" cy=\"82\" rx=\"10\" ry=\"13\" fill=\"#FFFFFF\" transform=\"rotate(-18 124 82)\"/><circle cx=\"102\" cy=\"86\" r=\"6.5\" fill=\"#111111\"/><circle cx=\"126\" cy=\"76\" r=\"6.5\" fill=\"#111111\"/><ellipse cx=\"162\" cy=\"70\" rx=\"10\" ry=\"7\" fill=\"#111111\" transform=\"rotate(-24 162 70)\"/>"
 ],
 "gor": [
  "30 40 158 132",
  "<path d=\"M34 172 V96 A52 52 0 0 1 138 86 A48 48 0 0 1 184 132 V172 Z\" fill=\"#4361D8\"/><path d=\"M74 172 Q78 140 92 128 Q86 152 88 172Z\" fill=\"var(--cut)\"/><path d=\"M128 172 Q132 142 146 132 Q140 154 142 172Z\" fill=\"var(--cut)\"/><path d=\"M52 74 h42 a9 9 0 0 1 9 9 v8 a26 26 0 0 1 -13 23 a22 22 0 0 1 -34 0 a26 26 0 0 1 -13 -23 v-8 a9 9 0 0 1 9 -9z\" fill=\"#FFFFFF\"/><ellipse cx=\"64\" cy=\"88\" rx=\"3.8\" ry=\"5.4\" fill=\"#4361D8\"/><ellipse cx=\"84\" cy=\"88\" rx=\"3.8\" ry=\"5.4\" fill=\"#4361D8\"/>"
 ],
 "glz": [
  "8 14 184 160",
  "<defs><linearGradient id=\"GID\" x1=\"0\" y1=\"0\" x2=\"0.3\" y2=\"1\"><stop offset=\"0\" stop-color=\"#E5203A\"/><stop offset=\"1\" stop-color=\"#FF5D6C\"/></linearGradient></defs><path d=\"M40 120 C40 94 50 80 60 72 L56 26 Q56 16 66 21 L98 54 H118 L146 26 Q156 18 158 30 L150 76 C160 86 164 102 164 120 C164 150 140 166 112 166 H90 C60 166 40 150 40 120Z\" fill=\"url(#GID)\"/><ellipse cx=\"78\" cy=\"118\" rx=\"22\" ry=\"25\" fill=\"#FFFFFF\"/><ellipse cx=\"126\" cy=\"118\" rx=\"22\" ry=\"25\" fill=\"#FFFFFF\"/><ellipse cx=\"82\" cy=\"114\" rx=\"9\" ry=\"14\" fill=\"url(#GID)\"/><ellipse cx=\"122\" cy=\"114\" rx=\"9\" ry=\"14\" fill=\"url(#GID)\"/>"
 ],
 "zay": [
  "40 10 120 168",
  "<path d=\"M78 100 C60 72 62 20 80 16 C95 14 94 70 92 100Z\" fill=\"var(--pet-ink)\"/><path d=\"M122 100 C140 72 138 20 120 16 C105 14 106 70 108 100Z\" fill=\"var(--pet-ink)\"/><ellipse cx=\"100\" cy=\"132\" rx=\"54\" ry=\"42\" fill=\"var(--pet-ink)\"/><path d=\"M60 126 q16 -12 32 2 q-4 16 -16 16 q-14 -2 -16 -18z\" fill=\"var(--pet-inv)\"/><path d=\"M140 126 q-16 -12 -32 2 q4 16 16 16 q14 -2 16 -18z\" fill=\"var(--pet-inv)\"/><circle cx=\"79\" cy=\"133\" r=\"6\" fill=\"var(--pet-ink)\"/><circle cx=\"121\" cy=\"133\" r=\"6\" fill=\"var(--pet-ink)\"/>"
 ],
 "ele": [
  "26 40 148 128",
  "<path d=\"M30 168 V112 A70 70 0 0 1 170 112 V168 H148 A15 15 0 0 0 118 168 H98 V142 A21 21 0 0 0 56 142 V168 Z\" fill=\"var(--pet-ink2)\"/><path d=\"M86 82 v44 a22 22 0 0 0 0 -44z\" fill=\"var(--cut)\"/><circle cx=\"62\" cy=\"104\" r=\"3.8\" fill=\"var(--cut)\"/>"
 ],
 "cat": [
  "0 0 200 200",
  "<defs><mask id=\"GID\"><rect width=\"200\" height=\"200\" fill=\"#fff\"/><circle cx=\"102\" cy=\"96\" r=\"3.4\" fill=\"#000\"/><circle cx=\"118\" cy=\"96\" r=\"3.4\" fill=\"#000\"/></mask></defs><path d=\"M18 104 h20 M12 120 h24\" stroke=\"var(--pet-ink)\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M82 132 Q56 128 58 96\" fill=\"none\" stroke=\"var(--pet-ink)\" stroke-width=\"8\" stroke-linecap=\"round\"/><path d=\"M80 138 L90 82 L92 54 Q93 48 98 52 L106 64 H114 L122 52 Q127 48 128 54 L130 82 L140 138 Z\" fill=\"var(--pet-ink)\" stroke=\"var(--pet-ink)\" stroke-width=\"6\" stroke-linejoin=\"round\" mask=\"url(#GID)\"/><path d=\"M40 136 Q38 146 48 146 H152 Q162 146 160 136\" fill=\"none\" stroke=\"#E25A5F\" stroke-width=\"9\" stroke-linecap=\"round\"/><g fill=\"var(--pet-ink)\"><rect x=\"62\" y=\"150\" width=\"14\" height=\"6\" rx=\"3\"/><rect x=\"124\" y=\"150\" width=\"14\" height=\"6\" rx=\"3\"/><circle cx=\"69\" cy=\"164\" r=\"8\"/><circle cx=\"131\" cy=\"164\" r=\"8\"/></g><circle cx=\"69\" cy=\"164\" r=\"3\" fill=\"var(--cut)\"/><circle cx=\"131\" cy=\"164\" r=\"3\" fill=\"var(--cut)\"/>"
 ]
};
let petGid = 0;
function petSvg(id, w, h, extra) {
  const a = PET_ART[id]; if (!a) return '';
  const g = 'pg' + (++petGid);
  return '<svg class="pet-svg" width="' + w + '" height="' + h + '" viewBox="' + a[0] + '" ' + (extra || '') + ' aria-hidden="true">' + a[1].replace(/GID/g, g) + '</svg>';
}
const RARITY = [
  { id: 'common', n: 'обычная', p: 60, c: '#B9B8C0', c1: '#E4E3E8', c2: '#9897A0', fg: '#16161A', tint: '#ECEBEF' },
  { id: 'rare', n: 'редкая', p: 28, c: '#3D7BF2', c1: '#8FB5FF', c2: '#2F63D6', fg: '#FFFFFF', tint: '#DCE7FD' },
  { id: 'epic', n: 'эпическая', p: 10, c: '#9B5CF6', c1: '#CDAEFF', c2: '#7B3FE0', fg: '#FFFFFF', tint: '#ECE0FD' },
  { id: 'legend', n: 'легенда', p: 2, c: '#F4C430', c1: '#FFE38A', c2: '#E0A800', fg: '#16161A', tint: '#FCF0C6' }
];
// grow — сколько раз покормить до взрослого; стадии: малыш → подросток (40%) → взрослый
const PETS = {
  dog: { w: 56, name: 'Синий пёс', no: '01', r: 0, grow: 150, desc: 'Твой первый друг. Верный и всегда голодный.', big: [132, 152] },
  zay: { w: 40, name: 'Заяц', no: '02', r: 0, grow: 200, desc: 'Шустрый и любопытный. Обожает короткие интервалы и быстрые повторы.', big: [104, 150] },
  glz: { w: 62, name: 'Глазастик', no: '05', r: 1, grow: 300, desc: 'Замечает каждую ошибку. Растёт быстрее, если не пропускать дни.', big: [156, 136] },
  gor: { w: 66, name: 'Горилла', no: '03', r: 2, grow: 400, desc: 'Сильный и спокойный. Любит длинные сессии повторения.', big: [170, 142] },
  cat: { w: 70, name: 'Скейт-кот', no: '06', r: 1, grow: 300, desc: 'Гоняет на скейте и не любит ждать. Лучше всего растёт на быстрых повторах.', big: [170, 170] },
  ele: { w: 66, name: 'Слонёнок', no: '04', r: 3, grow: 500, desc: 'Никогда ничего не забывает. Выпадает примерно раз из пятидесяти.', big: [170, 146] }
};
const PET_ORDER = ['dog', 'zay', 'glz', 'cat', 'gor', 'ele'];
function petStage(id, fed) {
  const g = (PETS[id] || PETS.dog).grow, p = fed / g;
  if (p >= 1) return { n: 'взрослый', next: null, pct: 100 };
  if (p >= 0.4) return { n: 'подросток', next: 'взрослый', left: Math.ceil(g - fed), pct: Math.round(p * 100) };
  return { n: 'малыш', next: 'подросток', left: Math.ceil(g * 0.4 - fed), pct: Math.round(p * 100) };
}
