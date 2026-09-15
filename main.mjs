// ============================================================
// main.mjs — punto de entrada de la aplicación
//
// Este es el único módulo que "conoce" al resto: importa las
// funciones de render.mjs, storage.mjs, quotes.mjs y pdf.mjs,
// y las conecta con los elementos del DOM y sus eventos.
// ============================================================

import { renderMarkdown } from './render.mjs';
import { guardarTexto, cargarTexto } from './storage.mjs';
import { obtenerCitaAleatoria } from './quotes.mjs';
import { exportarPDF } from './pdf.mjs';

// ---------- Referencias a elementos del DOM ----------
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const status = document.getElementById('status');
const toolbar = document.getElementById('toolbar');
const fileInput = document.getElementById('fileInput');
const ayudaPanel = document.getElementById('ayuda-panel');
const btnAyuda = document.getElementById('btnAyuda');

const TEXTO_INICIAL = `# Bienvenido al editor

Escribe **Markdown** en el panel izquierdo y mira la vista previa aquí.

- Soporta listas
- Soporta \`código\`
- Soporta tablas y citas

> Todo se procesa en tu navegador, sin conexión a internet
> (excepto el botón de citas, que sí usa una API externa).

\`\`\`js
console.log("hola mundo");
\`\`\`
`;

// ---------- Render + guardado automático ----------
function actualizarVistaPrevia() {
  preview.innerHTML = renderMarkdown(editor.value);
}

let temporizadorGuardado = null;
function alEscribir() {
  actualizarVistaPrevia();
  status.textContent = 'editando...';
  clearTimeout(temporizadorGuardado);
  temporizadorGuardado = setTimeout(() => {
    guardarTexto(editor.value);
    status.textContent = 'guardado';
  }, 500);
}

editor.addEventListener('input', alEscribir);

// ---------- Delegación de eventos en la barra de herramientas ----------
// En vez de poner un addEventListener por cada botón, escuchamos UN
// solo evento "click" en el contenedor padre (#toolbar) y revisamos
// qué botón lo originó, usando el atributo data-action de cada uno.
// Esto es "delegación de eventos": más eficiente cuando hay varios
// elementos parecidos, y permite agregar botones nuevos sin tener
// que registrar un listener nuevo para cada uno.
toolbar.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-action]');
  if (!boton) return; // el clic no fue sobre un botón con acción

  switch (boton.dataset.action) {
    case 'abrir':
      fileInput.click();
      break;
    case 'descargar-md':
      descargarMarkdown();
      break;
    case 'exportar-pdf':
      exportarPdfActual();
      break;
    case 'cita':
      insertarCitaAleatoria();
      break;
  }
});

// ---------- Abrir archivo .md ----------
fileInput.addEventListener('change', (evento) => {
  const archivo = evento.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = (e) => {
    editor.value = e.target.result;
    actualizarVistaPrevia();
    status.textContent = 'archivo cargado';
  };
  lector.readAsText(archivo);
  fileInput.value = '';
});

// ---------- Descargar .md ----------
function descargarMarkdown() {
  const blob = new Blob([editor.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'documento.md';
  enlace.click();
  URL.revokeObjectURL(url);
}

// ---------- Exportar PDF ----------
async function exportarPdfActual() {
  status.textContent = 'generando PDF...';
  try {
    await exportarPDF(preview, 'documento.pdf');
    status.textContent = 'guardado';
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    status.textContent = 'error al generar el PDF';
  }
}

// ---------- Insertar cita aleatoria (fetch + async/await + manejo de errores) ----------
async function insertarCitaAleatoria() {
  status.textContent = 'buscando cita...';
  try {
    const { texto, autor } = await obtenerCitaAleatoria();
    // Insertamos la cita al final del texto actual, con formato de
    // cita en Markdown (>) para que se vea distinta en la vista previa.
    const citaFormateada = `\n\n> ${texto}\n> — ${autor}\n`;
    editor.value += citaFormateada;
    actualizarVistaPrevia();
    guardarTexto(editor.value);
    status.textContent = 'cita agregada';
  } catch (error) {
    // Si la API falla (sin internet, servidor caído, etc.), avisamos
    // al usuario en vez de dejar el botón sin respuesta o romper la app.
    console.error('Error al obtener la cita:', error);
    status.textContent = 'no se pudo obtener la cita';
  }
}

// ---------- Panel de ayuda accesible (ARIA) ----------
// btnAyuda controla la visibilidad de ayudaPanel. Usamos:
//   - aria-expanded en el botón: dice si el panel está abierto o cerrado
//   - aria-controls en el botón: dice QUÉ elemento controla (por id)
//   - hidden en el panel: lo oculta de verdad (no solo visualmente)
// Como es un <button>, ya es operable con teclado (Tab + Enter/Espacio)
// sin necesitar código extra.
btnAyuda.addEventListener('click', () => {
  const estaAbierto = btnAyuda.getAttribute('aria-expanded') === 'true';
  btnAyuda.setAttribute('aria-expanded', String(!estaAbierto));
  ayudaPanel.hidden = estaAbierto;
});

// ---------- Inicialización ----------
function iniciar() {
  const textoGuardado = cargarTexto();
  editor.value = textoGuardado !== null ? textoGuardado : TEXTO_INICIAL;
  actualizarVistaPrevia();
}

iniciar();
