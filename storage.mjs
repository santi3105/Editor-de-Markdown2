// ============================================================
// storage.mjs — módulo encargado de guardar y recuperar el texto
// del editor usando localStorage (almacenamiento del navegador).
//
// Se guarda solo el texto que el usuario escribió: nada sensible,
// nada que no pueda regenerarse simplemente volviendo a escribir.
// ============================================================

const CLAVE = 'md-editor-content';

export function guardarTexto(texto) {
  localStorage.setItem(CLAVE, texto);
}


export function cargarTexto() {
  return localStorage.getItem(CLAVE);
}