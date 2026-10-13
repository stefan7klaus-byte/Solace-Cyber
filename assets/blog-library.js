(() => {
  const grid = document.getElementById('recommendation-cards');
  if (!grid) return;

  const articles = Array.from(grid.querySelectorAll('.recommendation-card')).map(card => ({
    card,
    text: card.textContent.toLowerCase(),
    category: card.querySelector('.tag').textContent.split(' · ')[0]
  }));
  const search = document.getElementById('article-search');
  const category = document.getElementById('article-category');
  const status = document.getElementById('library-status');
  const empty = document.getElementById('library-empty');
  const pagination = document.getElementById('library-pagination');
  const previous = document.getElementById('library-previous');
  const next = document.getElementById('library-next');
  const pageLabel = document.getElementById('library-page');
  const pageSize = 10;
  let currentPage = 1;

  function render(moveToResults = false) {
    const query = search.value.trim().toLowerCase();
    const filtered = articles.filter(article =>
      article.text.includes(query) && (!category.value || article.category === category.value)
    );
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const start = (currentPage - 1) * pageSize;
    const visible = filtered.slice(start, start + pageSize);
    const visibleCards = new Set(visible.map(article => article.card));
    articles.forEach(article => { article.card.hidden = !visibleCards.has(article.card); });
    status.textContent = filtered.length
      ? `Showing ${start + 1}–${start + visible.length} of ${filtered.length} articles`
      : '0 articles found';
    empty.hidden = filtered.length !== 0;
    pagination.hidden = pageCount <= 1;
    previous.disabled = currentPage === 1;
    next.disabled = currentPage === pageCount;
    pageLabel.textContent = `Page ${currentPage} of ${pageCount}`;
    if (moveToResults && visible.length) {
      visible[0].card.querySelector('h3 a').focus({ preventScroll: true });
      grid.scrollIntoView({ block: 'start' });
    }
  }

  function resetFilters() {
    currentPage = 1;
    render();
  }

  search.addEventListener('input', resetFilters);
  category.addEventListener('change', resetFilters);
  previous.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      render(true);
    }
  });
  next.addEventListener('click', () => {
    if (!next.disabled) {
      currentPage += 1;
      render(true);
    }
  });
  render();
  document.getElementById('library-tools').hidden = false;
})();
