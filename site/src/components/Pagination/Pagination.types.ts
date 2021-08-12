export type Props = {
  pageCount: number
  currentPage: number
  setPage: (page: number) => void
  next: () => void
  hasNext: boolean
}
