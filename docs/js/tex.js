// ===== Формулы (MathJax), оформление текста, клавиатура символов, панель выделения =====
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

window.MathJax = {
  tex: { packages: { '[-]': ['html'] }, macros: { tg: '\\operatorname{tg}', ctg: '\\operatorname{ctg}', arctg: '\\operatorname{arctg}', arcctg: '\\operatorname{arcctg}', sh: '\\operatorname{sh}', ch: '\\operatorname{ch}', th: '\\operatorname{th}', R: '\\mathbb{R}', N: '\\mathbb{N}', Z: '\\mathbb{Z}', Q: '\\mathbb{Q}', C: '\\mathbb{C}' } },
  svg: { fontCache: 'local' },
  startup: {
    typeset: false, ready() {
      MathJax.startup.defaultReady();
      MathJax.startup.promise.then(() => {
        try { document.head.appendChild(MathJax.svgStylesheet()); } catch (e) { }
        window.mjReady = true; document.querySelectorAll('.rt').forEach(el => renderInto(el, el._src));
      });
    }
  }
};

function fmtText(t) {
  return esc(t).replace(/\\\$/g, '$')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>')
    .replace(/\n/g, '<br>');
}
function renderInto(el, src) {
  src = src || ''; el._src = src; el.classList.add('rt'); el.innerHTML = '';
  const re = /\\\$|\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
  let last = 0, m, prevDisp = false;
  const addText = (t, nextDisp) => {
    if (prevDisp) t = t.replace(/^\n/, ''); if (nextDisp) t = t.replace(/\n$/, ''); if (!t) return;
    const s = document.createElement('span'); s.innerHTML = fmtText(t); el.appendChild(s);
  };
  while ((m = re.exec(src))) {
    if (m[0] === '\\$') continue;
    const disp = m[1] != null || m[3] != null, tex = m[1] ?? m[2] ?? m[3] ?? m[4];
    addText(src.slice(last, m.index), disp); addMath(el, tex, disp); prevDisp = disp; last = re.lastIndex;
  }
  addText(src.slice(last), false);
}
function addMath(el, tex, disp) {
  if (window.mjReady) {
    try { const n = MathJax.tex2svg(tex, { display: disp }); el.appendChild(n); return; }
    catch (e) { const s = document.createElement('span'); s.className = 'texerr'; s.textContent = 'Ошибка в формуле: ' + tex; el.appendChild(s); return; }
  }
  const s = document.createElement('code'); s.className = 'rawtex'; s.textContent = tex; el.appendChild(s);
}
const rt = (src, cls) => { const d = document.createElement('div'); d.className = cls || ''; renderInto(d, src); return d; };

// § — место, куда встанет выделенный текст / курсор
const PAL = [
  ['Шаблоны', [['a/b', '\\frac{§}{§}', 'дробь'], ['xⁿ', '^{§}', 'степень'], ['xₙ', '_{§}', 'индекс'], ['√', '\\sqrt{§}', 'корень'], ['ⁿ√', '\\sqrt[§]{§}', 'корень n-й'], ['lim', '\\lim_{§ \\to §}', 'предел'], ['lim n→∞', '\\lim_{n \\to \\infty} §', 'предел'], ['Σ', '\\sum_{k=1}^{n} §', 'сумма'], ['∏', '\\prod_{k=1}^{n} §', 'произведение'], ['∫ₐᵇ', '\\int_{§}^{§} § \\,dx', 'интеграл'], ['∫', '\\int § \\,dx', 'интеграл'], ["f′", "f'(x)", 'производная'], ['∂/∂x', '\\frac{\\partial §}{\\partial x}', 'частная'], ['|x|', '\\left| § \\right|', 'модуль'], ['( )', '\\left( § \\right)', 'скобки'], ['{ }', '\\{ § \\}', 'фигурные'], ['система', '\\begin{cases} § \\\\ § \\end{cases}', 'система'], ['матрица', '\\begin{pmatrix} § & § \\\\ § & § \\end{pmatrix}', 'матрица'], ['det', '\\begin{vmatrix} § & § \\\\ § & § \\end{vmatrix}', 'определитель'], ['a⃗', '\\vec{§}', 'вектор'], ['x̄', '\\overline{§}', 'черта'], ['x̂', '\\hat{§}', 'крышка'], ['Cₙᵏ', '\\binom{§}{§}', 'сочетания'], ['текст', '\\text{§}', 'текст'], ['пробел', '\\quad ', 'пробел'], ['$$', '$$§$$', 'формула отдельной строкой']]],
  ['Греческие', [['α', '\\alpha '], ['β', '\\beta '], ['γ', '\\gamma '], ['δ', '\\delta '], ['ε', '\\varepsilon '], ['ζ', '\\zeta '], ['η', '\\eta '], ['θ', '\\theta '], ['λ', '\\lambda '], ['μ', '\\mu '], ['ν', '\\nu '], ['ξ', '\\xi '], ['π', '\\pi '], ['ρ', '\\rho '], ['σ', '\\sigma '], ['τ', '\\tau '], ['φ', '\\varphi '], ['χ', '\\chi '], ['ψ', '\\psi '], ['ω', '\\omega '], ['Γ', '\\Gamma '], ['Δ', '\\Delta '], ['Θ', '\\Theta '], ['Λ', '\\Lambda '], ['Σ', '\\Sigma '], ['Φ', '\\Phi '], ['Ψ', '\\Psi '], ['Ω', '\\Omega ']]],
  ['Сравнение', [['≤', '\\le '], ['≥', '\\ge '], ['≠', '\\ne '], ['≈', '\\approx '], ['≡', '\\equiv '], ['∼', '\\sim '], ['≪', '\\ll '], ['≫', '\\gg '], ['±', '\\pm '], ['∓', '\\mp '], ['·', '\\cdot '], ['×', '\\times '], ['÷', '\\div '], ['∘', '\\circ '], ['∞', '\\infty '], ['∂', '\\partial '], ['∇', '\\nabla '], ['…', '\\dots '], ['⋯', '\\cdots '], ['⊥', '\\perp '], ['∥', '\\parallel '], ['∠', '\\angle ']]],
  ['Множества', [['∈', '\\in '], ['∉', '\\notin '], ['⊂', '\\subset '], ['⊆', '\\subseteq '], ['⊃', '\\supset '], ['∪', '\\cup '], ['∩', '\\cap '], ['∖', '\\setminus '], ['∅', '\\varnothing '], ['ℕ', '\\mathbb{N}'], ['ℤ', '\\mathbb{Z}'], ['ℚ', '\\mathbb{Q}'], ['ℝ', '\\mathbb{R}'], ['ℂ', '\\mathbb{C}'], ['[a,b]', '[a, b]'], ['sup', '\\sup '], ['inf', '\\inf '], ['max', '\\max '], ['min', '\\min ']]],
  ['Логика', [['∀', '\\forall '], ['∃', '\\exists '], ['∄', '\\nexists '], ['¬', '\\neg '], ['∧', '\\land '], ['∨', '\\lor '], ['⇒', '\\Rightarrow '], ['⇔', '\\iff '], ['→', '\\to '], ['↦', '\\mapsto '], ['↑', '\\uparrow '], ['↓', '\\downarrow '], [':', ':\\ ']]],
  ['Функции', [['sin', '\\sin '], ['cos', '\\cos '], ['tg', '\\tg '], ['ctg', '\\ctg '], ['arcsin', '\\arcsin '], ['arccos', '\\arccos '], ['arctg', '\\arctg '], ['ln', '\\ln '], ['log', '\\log_{§} '], ['exp', '\\exp '], ['eˣ', 'e^{§}'], ['sh', '\\sh '], ['ch', '\\ch '], ['o(·)', 'o(§)'], ['O(·)', 'O(§)']]]
];
function inMath(v, pos) { const b = v.slice(0, pos).replace(/\\\$/g, ''); const dd = (b.match(/\$\$/g) || []).length, s = (b.replace(/\$\$/g, '').match(/\$/g) || []).length; return dd % 2 === 1 || s % 2 === 1; }
function insertTpl(ta, tpl, isMath) {
  const v = ta.value, s = ta.selectionStart, e = ta.selectionEnd, sel = v.slice(s, e);
  const parts = tpl.split('§'); let out = parts[0]; const slots = [];
  for (let i = 1; i < parts.length; i++) { slots.push(out.length); if (i === 1 && sel) out += sel; out += parts[i]; }
  let cur = slots.length ? (sel ? (slots[1] !== undefined ? slots[1] + sel.length : out.length) : slots[0]) : out.length;
  if (isMath && !tpl.startsWith('$$') && !inMath(v, s)) { out = '$' + out + '$'; cur += 1; }
  ta.focus(); ta.setRangeText(out, s, e, 'end'); ta.setSelectionRange(s + cur, s + cur); ta.dispatchEvent(new Event('input', { bubbles: true }));
}
function wrapSel(ta, a, b) {
  const v = ta.value, s = ta.selectionStart, e = ta.selectionEnd, sel = v.slice(s, e);
  if (sel.startsWith(a) && sel.endsWith(b) && sel.length >= a.length + b.length) { ta.setRangeText(sel.slice(a.length, sel.length - b.length), s, e, 'select'); }
  else ta.setRangeText(a + sel + b, s, e, 'select');
  ta.focus(); ta.dispatchEvent(new Event('input', { bubbles: true }));
}

// ---- панель выделения как в Telegram ----
const SELACT = [
  ['B', 'Жирный', ta => wrapSel(ta, '**', '**'), 'font-weight:900'],
  ['I', 'Курсив', ta => wrapSel(ta, '*', '*'), 'font-style:italic;font-family:serif'],
  ['U', 'Подчёркнутый', ta => wrapSel(ta, '__', '__'), 'text-decoration:underline'],
  ['S', 'Зачёркнутый', ta => wrapSel(ta, '~~', '~~'), 'text-decoration:line-through'],
  ['A', 'Маркер', ta => wrapSel(ta, '==', '=='), 'background:rgba(255,214,0,.6);color:#111;border-radius:4px;padding:0 4px'],
  ['</>', 'Код', ta => wrapSel(ta, '`', '`'), 'font-family:monospace;font-size:13px'],
  ['|'],
  ['ƒ', 'Сделать формулой', ta => insertTpl(ta, '$§$', false), 'font-family:serif;font-style:italic'],
  ['a/b', 'Дробь — выделенное станет числителем', ta => insertTpl(ta, '\\frac{§}{§}', true), 'font-family:serif'],
  ['xⁿ', 'Степень', ta => insertTpl(ta, '^{§}', true), 'font-family:serif'],
  ['xₙ', 'Индекс', ta => insertTpl(ta, '_{§}', true), 'font-family:serif'],
  ['√', 'Корень', ta => insertTpl(ta, '\\sqrt{§}', true), 'font-family:serif'],
  ['|x|', 'Модуль', ta => insertTpl(ta, '\\left|§\\right|', true), 'font-family:serif'],
  ['a⃗', 'Вектор', ta => insertTpl(ta, '\\vec{§}', true), 'font-family:serif']
];
let selTa = null, selBar = null;
function ensureSelBar() {
  if (selBar) return selBar;
  selBar = document.createElement('div'); selBar.className = 'selbar'; selBar.hidden = true;
  SELACT.forEach(a => {
    if (a[0] === '|') { const s = document.createElement('i'); s.className = 'sep'; selBar.appendChild(s); return; }
    const b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<span style="' + a[3] + '">' + esc(a[0]) + '</span>'; b.title = a[1]; b.setAttribute('aria-label', a[1]);
    b.onpointerdown = e => e.preventDefault();
    b.onclick = () => { if (selTa) { a[2](selTa); setTimeout(() => checkSel(selTa), 0); } };
    selBar.appendChild(b);
  });
  document.body.appendChild(selBar); return selBar;
}
function caretXY(ta, pos) {
  const d = document.createElement('div'), cs = getComputedStyle(ta);
  ['boxSizing', 'width', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontWeight', 'fontSize', 'lineHeight', 'fontFamily', 'letterSpacing', 'wordSpacing'].forEach(p => d.style[p] = cs[p]);
  d.style.position = 'absolute'; d.style.visibility = 'hidden'; d.style.whiteSpace = 'pre-wrap'; d.style.wordWrap = 'break-word'; d.style.top = '0'; d.style.left = '0';
  d.textContent = ta.value.slice(0, pos); const sp = document.createElement('span'); sp.textContent = ta.value.slice(pos) || '.'; d.appendChild(sp); document.body.appendChild(d);
  const r = ta.getBoundingClientRect(), x = r.left + sp.offsetLeft - ta.scrollLeft, y = r.top + sp.offsetTop - ta.scrollTop; d.remove();
  return [x, Math.max(r.top, Math.min(y, r.bottom - 20))];
}
function hideSel() { if (selBar) selBar.hidden = true; selTa = null; }
function checkSel(ta) {
  if (!ta || document.activeElement !== ta || ta.selectionStart === ta.selectionEnd) { if (selTa === ta) hideSel(); return; }
  const bar = ensureSelBar(); selTa = ta; bar.hidden = false;
  const [x, y] = caretXY(ta, ta.selectionStart), w = bar.offsetWidth, h = bar.offsetHeight;
  const left = Math.max(8, Math.min(x - w / 2 + 20, innerWidth - w - 8)); let top = y - h - 12; if (top < 8) top = y + 30;
  bar.style.left = left + 'px'; bar.style.top = top + 'px';
}
function hookSel(ta) {
  ['select', 'mouseup', 'keyup', 'touchend'].forEach(ev => ta.addEventListener(ev, () => setTimeout(() => checkSel(ta), 0)));
  ta.addEventListener('blur', () => setTimeout(() => { if (selTa === ta && document.activeElement !== ta) hideSel(); }, 150));
  ta.addEventListener('scroll', () => { if (selTa === ta) checkSel(ta); });
}
document.addEventListener('selectionchange', () => { const a = document.activeElement; if (a && a.tagName === 'TEXTAREA' && a.dataset.sel) checkSel(a); });
