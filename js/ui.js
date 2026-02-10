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
  if (driveId) return `https://drive.google.com/uc?export=download&id=${driveId}`;
  return rawUrl;
}

async function loadPdfJs() {
  const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs';
  return pdfjsLib;
}

function buildArticleCard(item, index) {
  const article = document.createElement('article');
  article.className = 'card article-card textual-card';

  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.index = String(index);
  button.setAttribute('aria-label', `Ler artigo ${item.titulo}`);

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

  button.append(title, authors, context, summary, readIndicator);
  article.append(button);
  return article;
}

async function loadMaterias() {
  const grid = document.querySelector('#materias-grid');
  const modal = document.querySelector('#pdf-modal');
  if (!grid || !modal) return;

  const response = await fetch('data/materias-2026.json');
  const materias = await response.json();

  const pdfjsLib = await loadPdfJs();

  const modalTitle = document.querySelector('#pdf-modal-title');
  const modalMeta = document.querySelector('#pdf-modal-meta');
  const canvasWrap = document.querySelector('#pdf-canvas-wrap');
  const canvas = document.querySelector('#pdf-canvas');
  const pageInfo = document.querySelector('#pdf-page-info');
  const prevBtn = document.querySelector('#pdf-prev');
  const nextBtn = document.querySelector('#pdf-next');
  const closeBtn = document.querySelector('#pdf-close');
  const downloadLink = document.querySelector('#pdf-download');

  const context = canvas.getContext('2d');

  let pdfDoc = null;
  let pageNum = 1;
  let isRendering = false;

  async function renderPage(num) {
    if (!pdfDoc || isRendering) return;
    isRendering = true;
    canvasWrap.classList.add('is-rendering');

    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = Math.max(canvasWrap.clientWidth - 32, 320);
    const scale = containerWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

    pageInfo.textContent = `Página ${pageNum} de ${pdfDoc.numPages}`;
    prevBtn.disabled = pageNum <= 1;
    nextBtn.disabled = pageNum >= pdfDoc.numPages;

    canvasWrap.classList.remove('is-rendering');
    isRendering = false;
  }

  async function openPdf(item) {
    const pdfUrl = resolvePdfUrl(item.pdf);
    pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
    pageNum = 1;
    modalTitle.textContent = item.titulo;
    modalMeta.textContent = `${item.autor} • ${item.escola} • ${item.segmento}`;
    downloadLink.href = pdfUrl;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    await renderPage(pageNum);
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    context.clearRect(0, 0, canvas.width, canvas.height);
    pageInfo.textContent = 'Página 0 de 0';
    pdfDoc = null;
  }

  materias.forEach((item, index) => {
    const card = buildArticleCard(item, index);
    card.querySelector('button').addEventListener('click', async () => {
      await openPdf(item);
    });
    grid.append(card);
  });

  prevBtn.addEventListener('click', async () => {
    if (!pdfDoc || pageNum <= 1 || isRendering) return;
    pageNum -= 1;
    await renderPage(pageNum);
  });

  nextBtn.addEventListener('click', async () => {
    if (!pdfDoc || pageNum >= pdfDoc.numPages || isRendering) return;
    pageNum += 1;
    await renderPage(pageNum);
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', async (event) => {
    if (!modal.classList.contains('open')) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowRight') {
      if (!pdfDoc || pageNum >= pdfDoc.numPages || isRendering) return;
      pageNum += 1;
      await renderPage(pageNum);
    }
    if (event.key === 'ArrowLeft') {
      if (!pdfDoc || pageNum <= 1 || isRendering) return;
      pageNum -= 1;
      await renderPage(pageNum);
    }
  });

  window.addEventListener('resize', async () => {
    if (!modal.classList.contains('open') || !pdfDoc || isRendering) return;
    await renderPage(pageNum);
  });
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
loadVolumes();
