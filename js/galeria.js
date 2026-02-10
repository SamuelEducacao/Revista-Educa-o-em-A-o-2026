async function loadGaleria() {
  const grid = document.querySelector('#galeria-grid');
  const filtros = document.querySelector('#galeria-filtros');
  const lightbox = document.querySelector('#gallery-lightbox');
  const close = document.querySelector('#gallery-close');
  const image = document.querySelector('#gallery-image');
  const title = document.querySelector('#gallery-title');
  const description = document.querySelector('#gallery-description');

  if (!grid || !filtros || !lightbox || !close || !image || !title || !description) return;

  let fotos = [];

  try {
    const response = await fetch('data/galeria.json');
    const data = await response.json();
    fotos = Array.isArray(data) ? data : [];
  } catch {
    fotos = [];
  }

  let filtroAtual = 'Todos';

  const renderEstadoVazio = () => {
    filtros.innerHTML = '';
    grid.innerHTML = `
      <div class="gallery-empty" role="status" aria-live="polite">
        <span class="gallery-empty-icon" aria-hidden="true">📷</span>
        <p>Em breve os registros fotográficos das ações pedagógicas da rede municipal serão publicados aqui.</p>
      </div>
    `;
  };

  const opcoes = ['Todos', ...new Set(fotos.map((item) => item.ano)), ...new Set(fotos.map((item) => item.evento))];

  const openLightbox = (item) => {
    image.src = item.imagem;
    image.alt = item.alt;
    title.textContent = `${item.evento} • ${item.ano}`;
    description.textContent = item.descricao;
    lightbox.classList.add('open');
  };

  const renderFiltros = () => {
    if (!fotos.length) {
      filtros.innerHTML = '';
      return;
    }

    filtros.innerHTML = opcoes
      .map((opcao) => `<button type="button" class="filter-btn ${filtroAtual === opcao ? 'active' : ''}" data-filter="${opcao}">${opcao}</button>`)
      .join('');

    filtros.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        filtroAtual = button.dataset.filter;
        renderFiltros();
        renderGaleria();
      });
    });
  };

  const renderGaleria = () => {
    if (!fotos.length) {
      renderEstadoVazio();
      return;
    }

    const itens = fotos.filter((item) => filtroAtual === 'Todos' || item.ano === filtroAtual || item.evento === filtroAtual);

    if (!itens.length) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = itens
      .map((item, index) => `
      <article class="card gallery-item">
        <button type="button" data-index="${index}">
          <img src="${item.imagem}" alt="${item.alt}" loading="lazy" />
          <h2>${item.evento}</h2>
          <p>${item.ano}</p>
        </button>
      </article>`)
      .join('');

    grid.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => openLightbox(itens[Number(button.dataset.index)]));
    });
  };

  close.addEventListener('click', () => lightbox.classList.remove('open'));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.classList.remove('open');
  });

  renderFiltros();
  renderGaleria();
}

loadGaleria();
