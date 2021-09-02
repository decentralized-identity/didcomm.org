const PAGINATION_VISIBLE_PAGES = 5

export const getPages = (pageCount: number, curPage: number) => {
  let startPosition = Math.floor((curPage - 1) / PAGINATION_VISIBLE_PAGES) * PAGINATION_VISIBLE_PAGES
  if (pageCount - curPage < PAGINATION_VISIBLE_PAGES && curPage > PAGINATION_VISIBLE_PAGES) {
    startPosition -= PAGINATION_VISIBLE_PAGES - (pageCount - startPosition)
  }
  return Array.from({ length: Math.min(pageCount, PAGINATION_VISIBLE_PAGES) }, (_, i) => i + 1 + startPosition)
}
