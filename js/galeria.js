async function loadGaleria() {
  const grid = document.querySelector('#galeria-grid');
  if (!grid) return;

  const response = await fetch('data/galeria.json');
  const fotos = await response.json();

  grid.innerHTML = fotos
    .map(
      (item) => `
      <article class="card">
        <strong>${item.evento}</strong>
        <p>${item.ano}</p>
        <small>${item.imagem}</small>
      </article>
    `,
    )
    .join('');
}

loadGaleria();
