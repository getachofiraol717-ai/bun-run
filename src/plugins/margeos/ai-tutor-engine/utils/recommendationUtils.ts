export function filterRecommendations(books: any[], query: string): any[] {
  if (!query) return books;
  return books.filter((b) => b.title?.toLowerCase().includes(query.toLowerCase()));
}
