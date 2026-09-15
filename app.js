// ============================================================
// app.js — lógica del editor de Markdown
//
// Usa 3 librerías cargadas localmente desde /libs (ver index.html):
//   - marked      -> convierte texto Markdown en HTML
//   - DOMPurify   -> limpia ese HTML de código peligroso
//   - html2pdf    -> convierte HTML ya renderizado en un PDF descargable
//
// Todo el código va dentro de una función que se ejecuta sola
// (function () { ... })() para no "ensuciar" el espacio global
// del navegador con variables sueltas como "editor" o "render".
// ============================================================

(function () {

  // ---------- 1. Referencias a los elementos del HTML ----------
  // document.getElementById busca un elemento por su atributo id="..."
  // Guardamos cada uno en una variable para no tener que buscarlo
  // de nuevo cada vez que lo necesitamos.
  const editor = document.getElementById('editor');           // el <textarea>
  const preview = document.getElementById('preview');         // el <div> de vista previa
  const status = document.getElementById('status');           // el texto "guardado"/"editando..."
  const btnCargar = document.getElementById('btnCargar');     // botón "Abrir .md"
  const fileInput = document.getElementById('fileInput');     // input de archivo oculto
  const btnDescargarMd = document.getElementById('btnDescargarMd'); // botón "Descargar .md"
  const btnPdf = document.getElementById('btnPdf');           // botón "Exportar PDF"

  // Clave que usamos para guardar el texto en el navegador (localStorage)
  const STORAGE_KEY = 'md-editor-content';

  // Texto que aparece la primera vez que se abre la app (o si se borró todo)
  const DEFAULT_TEXT = `# Bienvenido al editor

Escribe **Markdown** en el panel izquierdo y mira la vista previa aquí.

- Soporta listas
- Soporta \`código\`
- Soporta tablas y citas

> Todo se procesa en tu navegador, sin conexión a internet.

\`\`\`js
console.log("hola mundo");
\`\`\`
`;

  // ---------- 2. Configuración de la librería marked ----------
  // breaks: true  -> un solo salto de línea ya se muestra como <br>
  //                  (por defecto Markdown necesita línea en blanco doble)
  // gfm: true     -> activa la sintaxis "GitHub Flavored Markdown"
  //                  (tablas, listas de tareas, etc.)
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  // ---------- 3. Función principal: convierte Markdown -> HTML visible ----------
  // Esta es la función más importante de todo el proyecto.
  // Se llama cada vez que el usuario escribe algo en el editor.
  function render() {
    const raw = editor.value;               // 1. texto tal cual lo escribió el usuario
    const html = marked.parse(raw);         // 2. lo convierte a HTML (ej: "# Hola" -> "<h1>Hola</h1>")
    const clean = DOMPurify.sanitize(html); // 3. elimina cualquier código HTML peligroso
    preview.innerHTML = clean;              // 4. inserta ese HTML limpio dentro del div de vista previa
  }

  // ---------- 4. Guardado automático mientras se escribe ----------
  // Variable que guarda la referencia al temporizador activo (setTimeout),
  // para poder cancelarlo si el usuario sigue escribiendo antes de que se cumpla.
  let saveTimer = null;

  // Esta función se ejecuta CADA VEZ que el usuario teclea algo en el editor.
  function onInput() {
    render();                          // actualiza la vista previa al instante
    status.textContent = 'editando...';

    // clearTimeout cancela el guardado anterior si todavía no se había
    // disparado. Así evitamos guardar en cada tecla (sería ineficiente)
    // y solo guardamos cuando el usuario hace una pausa de 500ms.
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, editor.value); // guarda el texto en el navegador
      status.textContent = 'guardado';
    }, 500);
  }

  // ---------- 5. Inicialización al cargar la página ----------
  function init() {
    // Intenta recuperar texto guardado de una sesión anterior.
    // localStorage.getItem devuelve null si nunca se guardó nada.
    const saved = localStorage.getItem(STORAGE_KEY);
    editor.value = saved !== null ? saved : DEFAULT_TEXT;
    render(); // muestra la vista previa inmediatamente, sin esperar a que el usuario escriba
  }

  // "input" es el evento que se dispara cada vez que cambia el contenido
  // de un campo de texto (cada tecla, pegar texto, borrar, etc.)
  editor.addEventListener('input', onInput);

  // ---------- 6. Botón "Abrir .md" ----------
  // El input de archivo real está oculto (hidden en el HTML) porque no
  // se puede personalizar su apariencia. Así que el botón bonito
  // simplemente "hace clic" por código sobre el input oculto.
  btnCargar.addEventListener('click', () => fileInput.click());

  // Cuando el usuario selecciona un archivo en la ventana del sistema,
  // se dispara el evento "change" sobre el input de archivo.
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0]; // el archivo elegido (o undefined si canceló)
    if (!file) return;              // si no eligió nada, no hacemos nada

    // FileReader es la API del navegador para leer el contenido de un archivo
    const reader = new FileReader();
    reader.onload = (ev) => {
      editor.value = ev.target.result; // ev.target.result = el texto del archivo
      render();
      status.textContent = 'archivo cargado';
    };
    reader.readAsText(file); // inicia la lectura como texto plano

    fileInput.value = ''; // limpia el input, para poder cargar el mismo archivo dos veces seguidas si se quiere
  });

  // ---------- 7. Botón "Descargar .md" ----------
  btnDescargarMd.addEventListener('click', () => {
    // Un Blob es un "archivo en memoria". Aquí creamos uno con el texto
    // del editor, indicando que es de tipo texto/markdown.
    const blob = new Blob([editor.value], { type: 'text/markdown;charset=utf-8' });

    // Convertimos ese Blob en una URL temporal que el navegador puede usar
    const url = URL.createObjectURL(blob);

    // Creamos un enlace <a> invisible, le decimos que "descargue" en vez
    // de "navegar", y simulamos un clic sobre él para disparar la descarga.
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento.md';
    a.click();

    // Liberamos la URL temporal de la memoria, ya no se necesita
    URL.revokeObjectURL(url);
  });

  // ---------- 8. Botón "Exportar PDF" ----------
  btnPdf.addEventListener('click', () => {
    status.textContent = 'generando PDF...';

    // Opciones de configuración para html2pdf
    const opciones = {
      margin: 14,                                   // margen del PDF en milímetros
      filename: 'documento.pdf',                     // nombre del archivo descargado
      image: { type: 'jpeg', quality: 0.98 },        // calidad de las imágenes dentro del PDF
      html2canvas: { scale: 2, useCORS: true },      // scale:2 = mayor resolución (texto más nítido)
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, // tamaño de hoja A4 vertical
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // intenta no cortar elementos entre páginas
    };

    // html2pdf toma el elemento "preview" (la vista previa ya renderizada)
    // exactamente como se ve en pantalla, y lo convierte en PDF.
    html2pdf().set(opciones).from(preview).save().then(() => {
      status.textContent = 'guardado';
    });
  });

  // ---------- 9. Arrancamos todo ----------
  // Esta línea se ejecuta al final del archivo, cuando el navegador
  // ya cargó todo lo anterior. Es lo que realmente "enciende" la app.
  init();

})();