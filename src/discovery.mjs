export function filterIdeas(ideas, {query = '', categories = [], themes = []} = {}) {
  const text = query.trim().toLowerCase();
  return ideas.filter(i => (!categories.length || categories.includes(i.category)) &&
    (!themes.length || themes.includes(i.theme)) &&
    [i.name,i.title,i.description,i.maker,i.category,i.theme].join(' ').toLowerCase().includes(text));
}

export function parseFilters(search, categories, themes) {
  const params = new URLSearchParams(search);
  return {query: params.get('q') ?? '',
    categories: [...new Set(params.getAll('category').filter(c => categories.includes(c)))],
    themes: [...new Set(params.getAll('theme').filter(t => themes.includes(t)))]};
}

export function filterURL(filters) {
  const params = new URLSearchParams();
  if (filters.query) params.set('q',filters.query);
  for (const category of filters.categories) params.append('category',category);
  for (const theme of filters.themes) params.append('theme',theme);
  return `/${params.size ? `?${params}` : ''}#collection`;
}

export function legacyDestination(path, hash) {
  if (path !== '/') return null;
  return ({'#ideas':'/','#places':'/places/','#saved':'/saved/','#about':'/about/'})[hash] ?? null;
}
