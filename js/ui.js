function setupThemeToggle() {
  const button = document.querySelector('#theme-toggle');
  if (!button) return;

  const currentTheme = localStorage.getItem('theme');
  if (currentTheme) document.documentElement.setAttribute('data-theme', currentTheme);

  button.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  });
}

function extractDriveId(url) {
  const match = url?.match(/\/d\/([^/]+)/);
  return match ? match[1] : null;
}

function resolvePdfUrl(rawUrl) {
  const driveId = extractDriveId(rawUrl);
  if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;
  return rawUrl;
}

function resolvePdfDownloadUrl(rawUrl) {
  const driveId = extractDriveId(rawUrl);
  if (driveId) return `https://drive.google.com/uc?export=download&id=${driveId}`;
  return rawUrl;
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildArticleCard(item) {
  const article = document.createElement('article');
  article.className = 'card article-card textual-card';

  const link = document.createElement('a');
  const slug = slugify(item.titulo);
  link.href = `artigos/${slug}.html`;
  link.className = 'article-card-link';
  link.setAttribute('aria-label', `Ler artigo ${item.titulo}`);

  const title = document.createElement('h2');
  title.textContent = item.titulo;

  const authors = document.createElement('p');
  authors.className = 'card-authors';
  authors.textContent = item.autor;

  const context = document.createElement('p');
  context.className = 'card-context';
  context.textContent = `${item.escola} • ${item.segmento}`;

  const summary = document.createElement('p');
  summary.className = 'card-summary';
  summary.textContent = item.descricao;

  const readIndicator = document.createElement('span');
  readIndicator.className = 'card-read';
  readIndicator.textContent = '📄 Ler artigo';

  link.append(title, authors, context, summary, readIndicator);
  article.append(link);
  return article;
}

function buildArticleNavButton(label, title, href, direction, isDisabled) {
  const link = document.createElement('a');
  link.className = `article-nav-button article-nav-${direction}`;

  const labelElement = document.createElement('span');
  labelElement.className = 'article-nav-label';
  labelElement.textContent = label;

  const titleElement = document.createElement('span');
  titleElement.className = 'article-nav-title';
  titleElement.textContent = title || 'Sem artigo disponível';

  link.append(labelElement, titleElement);

  if (isDisabled) {
    link.classList.add('is-disabled');
    link.setAttribute('aria-disabled', 'true');
    link.tabIndex = -1;
    return link;
  }

  link.href = href;
  return link;
}

function renderArticleNavigation(articlePage, materias, currentIndex) {
  const previousItem = currentIndex > 0 ? materias[currentIndex - 1] : null;
  const nextItem = currentIndex < materias.length - 1 ? materias[currentIndex + 1] : null;

  const nav = document.createElement('nav');
  nav.className = 'article-sequential-nav';
  nav.setAttribute('aria-label', 'Navegação entre artigos da edição 2026');

  const previousButton = buildArticleNavButton(
    '← Artigo anterior',
    previousItem?.titulo,
    previousItem ? `${slugify(previousItem.titulo)}.html` : '',
    'previous',
    !previousItem,
  );

  const nextButton = buildArticleNavButton(
    'Próximo artigo →',
    nextItem?.titulo,
    nextItem ? `${slugify(nextItem.titulo)}.html` : '',
    'next',
    !nextItem,
  );

  nav.append(previousButton, nextButton);
  articlePage.append(nav);
}

async function loadMaterias() {
  const grid = document.querySelector('#materias-grid');
  if (!grid) return;

  const response = await fetch('data/materias-2026.json');
  const materias = await response.json();

  materias.forEach((item) => {
    const card = buildArticleCard(item);
    grid.append(card);
  });
}

async function loadArticlePage() {
  const articlePage = document.querySelector('#article-page');
  if (!articlePage) return;

  const slug = articlePage.dataset.articleSlug;
  if (!slug) return;

  const response = await fetch('../data/materias-2026.json');
  const materias = await response.json();
  const currentIndex = materias.findIndex((materia) => slugify(materia.titulo) === slug);
  const item = materias[currentIndex];

  if (!item) {
    articlePage.innerHTML = '<p>Artigo não encontrado.</p>';
    return;
  }

  const pdfViewerUrl = resolvePdfUrl(item.pdf);
  const pdfDownloadUrl = resolvePdfDownloadUrl(item.pdf);

  document.title = `Educação em Ação 2026 | ${item.titulo}`;

  const title = document.querySelector('#article-title');
  const meta = document.querySelector('#article-meta');
  const summary = document.querySelector('#article-summary');
  const readFull = document.querySelector('#article-read-full');
  const download = document.querySelector('#article-download');
  const iframe = document.querySelector('#article-pdf-viewer');

  title.textContent = item.titulo;
  meta.textContent = `${item.autor} • ${item.escola} • ${item.segmento}`;
  summary.textContent = item.descricao;
  readFull.href = pdfViewerUrl;
  download.href = pdfDownloadUrl;
  iframe.src = `${pdfViewerUrl}#toolbar=1&navpanes=1&scrollbar=1`;
  iframe.title = `Visualização do PDF do artigo ${item.titulo}`;

  renderArticleNavigation(articlePage, materias, currentIndex);
}

async function loadVolumes() {
  const list = document.querySelector('#volumes-list');
  if (!list) return;

  const response = await fetch('data/volumes-anteriores.json');
  const volumes = await response.json();

  list.innerHTML = volumes
    .map((item) => {
      const isSite = item.tipo === 'site';
      const icon = isSite ? '🔗' : '📄';
      const badgeClass = item.tipo === 'site' ? 'badge-site' : 'badge-pdf';
      const badgeText = isSite ? 'Edição Digital' : 'PDF';
      const actionText = isSite ? 'Abrir site' : 'Abrir PDF';
      return `<article class="timeline-item"><div><h2>${item.ano} • ${item.volume} ${icon}</h2><p>${item.descricao}</p><span class="badge ${badgeClass}">${badgeText}</span></div><a class="btn" href="${item.link}" target="_blank" rel="noopener">${actionText}</a></article>`;
    })
    .join('');
}

setupThemeToggle();
loadMaterias();
loadArticlePage();
loadVolumes();
