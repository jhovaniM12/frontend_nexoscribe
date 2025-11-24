/**
 * Función para limpiar HTML y obtener texto plano
 */
export function stripHtml(html: string): string {
  const tmp = document.createElement("DIV")
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ""
}

/**
 * Filtra notas por búsqueda
 */
export function filterNotesBySearch<T extends { title: string; content: string; tags: string[] }>(
  notes: T[], 
  searchQuery: string
): T[] {
  if (!searchQuery.trim()) return notes
  
  const query = searchQuery.toLowerCase()
  return notes.filter((note) => (
    note.title.toLowerCase().includes(query) ||
    stripHtml(note.content).toLowerCase().includes(query) ||
    note.tags.some(tag => tag.toLowerCase().includes(query))
  ))
}

