import { art } from './art.mjs';
export const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const storyURL = id => `/stories/${encodeURIComponent(id)}/`;
export function card(i) {
  return `<article class="idea-card ${esc(i.color)}"><a class="card-open" href="${storyURL(i.id)}"><div class="card-art">${art(i.icon)}</div><span class="eyebrow">${esc(i.category)} / ${esc(i.theme)}</span><h3>${esc(i.name)}</h3><p>${esc(i.title)}</p></a><button class="save" data-save="${esc(i.id)}" aria-pressed="false" aria-label="Save ${esc(i.name)}" disabled>+</button></article>`;
}
