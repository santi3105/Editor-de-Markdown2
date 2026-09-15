// ============================================================
// pdf.mjs — módulo encargado de exportar un elemento HTML a PDF
//
// Depende de la librería global html2pdf, cargada como <script>
// clásico en index.html antes de este módulo.
// ============================================================

export function exportarPDF(elemento, nombreArchivo = 'documento.pdf') {
  const opciones = {
    margin: 14,
    filename: nombreArchivo,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#fbfaf7' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };
  return html2pdf().set(opciones).from(elemento).save();
}
