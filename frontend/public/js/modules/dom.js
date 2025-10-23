export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const show = el => el.classList.remove('hidden');
export const hide = el => el.classList.add('hidden');
export const mute = el => el.classList.add('muted');
export const unmute = el => el.classList.remove('muted');
export const scrollToEl = el => el.scrollIntoView({ behavior: 'smooth', block: 'start' });
export const fmtMoney = n => `$${Number(n||0).toFixed(2)}`;
