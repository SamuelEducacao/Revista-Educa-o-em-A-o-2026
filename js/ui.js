async function loadVolumes() {
  const list = document.querySelector('#volumes-list');
  if (!list) return;

  const response = await fetch('data/volumes.json');
  const volumes = await response.json();

  list.innerHTML = volumes
    .map((item) => {
      const icon = item.tipo === 'site' ? '🌐' : '📄';
      const badgeClass = item.tipo === 'site' ? 'badge-site' : 'badge-pdf';
      const badgeText = item.tipo === 'site' ? 'Interativo' : 'PDF';

      return `<li><strong>${item.ano} • ${item.volume}</strong> ${icon}<span class="badge ${badgeClass}">${badgeText}</span><br><a href="${item.link}" target="_blank" rel="noopener">Acessar volume</a></li>`;
    })
    .join('');
}

async function loadMaterias() {
  const list = document.querySelector('#materias-list');
  if (!list) return;

  const response = await fetch('data/materias-2026.json');
  const materias = await response.json();

  list.innerHTML = materias
    .map(
      (item) =>
        `<li><strong>${item.titulo}</strong><br><small>${item.autor}</small><p>${item.resumo}</p><a href="${item.link}">Ver matéria</a></li>`,
    )
    .join('');
}

loadVolumes();
loadMaterias();
