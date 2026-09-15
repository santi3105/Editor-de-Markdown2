// ============================================================
// quotes.mjs — módulo que consume una API externa pública
// para traer una cita inspiradora aleatoria.
//
// API usada: DummyJSON (https://dummyjson.com/docs/quotes)
// Es gratuita, no requiere clave (API key) y responde JSON.
// ============================================================

const API_URL = 'https://dummyjson.com/quotes/random';

export async function obtenerCitaAleatoria() {
  let respuesta;
  try {
    respuesta = await fetch(API_URL);
  } catch (errorDeRed) {
    // Esto ocurre si no hay conexión a internet en absoluto: fetch
    // ni siquiera logra contactar al servidor.
    throw new Error('No se pudo conectar a la API. Revisa tu conexión a internet.');
  }

  if (!respuesta.ok) {
    // El servidor respondió, pero con un error (ej: 404, 500).
    throw new Error(`La API respondió con un error (código ${respuesta.status}).`);
  }

  const datos = await respuesta.json();
  // La API devuelve { id, quote, author }. Los renombramos a español
  // para que el resto del código sea consistente.
  return { texto: datos.quote, autor: datos.author };
}
