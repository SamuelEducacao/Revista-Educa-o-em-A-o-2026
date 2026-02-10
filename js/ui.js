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

function setupLightboxHandlers(lightbox, closeBtn) {
  if (!lightbox || !closeBtn) return;
  const close = () => lightbox.classList.remove('open');
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

async function loadMaterias() {
  const grid = document.querySelector('#materias-grid');
  if (!grid) return;

  const response = await fetch('data/materias-2026.json');
  const materias = await response.json();

  grid.innerHTML = materias
    .map(
      (item, index) => `
      <article class="card article-card">
        <button type="button" data-index="${index}" aria-label="Abrir matéria ${item.titulo}">
          <img src="${item.banner}" alt="Banner da matéria ${item.titulo}" loading="lazy" />
          <h2>${item.titulo}</h2>
          <p>${item.autor}</p>
        </button>
      </article>`,
    )
    .join('');

  const lightbox = document.querySelector('#lightbox');
  const closeBtn = document.querySelector('#lightbox-close');
  const image = document.querySelector('#lightbox-image');
  const title = document.querySelector('#lightbox-title');
  const description = document.querySelector('#lightbox-description');
  const download = document.querySelector('#lightbox-download');
  const external = document.querySelector('#lightbox-external');

  setupLightboxHandlers(lightbox, closeBtn);

  grid.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      const materia = materias[Number(button.dataset.index)];
      image.src = materia.banner;
      image.alt = `Banner ampliado: ${materia.titulo}`;
      title.textContent = materia.titulo;
      description.textContent = materia.descricao ?? `Autoria: ${materia.autor}`;
      download.href = materia.arquivoDownload;
      external.href = materia.linkExterno || '#';
      external.style.display = materia.linkExterno ? 'inline-flex' : 'none';
      lightbox.classList.add('open');
    });
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
