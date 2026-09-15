// ============================================================
// render.mjs — módulo encargado de convertir Markdown en HTML seguro
//
// Depende de dos librerías globales cargadas como <script> clásico
// en index.html ANTES de este módulo: marked y DOMPurify.
// Un módulo .mjs no puede "importar" una librería UMD que no está
// pensada como módulo, así que simplemente usamos la variable
// global que esas librerías crean en window.
// ============================================================

// Configuración de marked: se ejecuta una sola vez, al cargar el módulo.
marked.setOptions({
  breaks: true, // un solo salto de línea ya se ve como <br>
  gfm: true,    // activa tablas, listas de tareas, etc. (GitHub Flavored Markdown)
});


export function renderMarkdown(textoMarkdown) {
  const htmlSinLimpiar = marked.parse(textoMarkdown);
  // DOMPurify elimina cualquier <script> o atributo peligroso (onclick="...", etc.)
  // que pudiera venir escondido dentro del texto del usuario. Esto es lo que
  // evita un ataque XSS al usar innerHTML más adelante.
  return DOMPurify.sanitize(htmlSinLimpiar);
}
