// PdfApi.js
// Responsable únicamente de la comunicación con el backend de conversión
// a PDF. Sigue el mismo patrón que Api.js (Excel), pero:
//   - apunta al endpoint /convert/pdf
//   - determina si la respuesta es un PDF individual o un ZIP con varios
//     PDFs, leyendo el Content-Type que devuelve el servidor.


// const ENDPOINT = 'https://localhost:7163/api/cfdiconverter/convert/pdf';
const ENDPOINT = 'https://cfdistoolsback.onrender.com/api/cfdiconverter/convert/pdf';

const DEFAULT_PDF_FILENAME = 'CFDI_Convertido.pdf';
const DEFAULT_ZIP_FILENAME = 'CFDI_PDFs_Convertidos.zip';

function extractFileName(xhr, fallback) {
    const disposition = xhr.getResponseHeader('Content-Disposition');
    if (!disposition || disposition.indexOf('attachment') === -1) {
        return fallback;
    }
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
        return matches[1].replace(/['"]/g, '');
    }
    return fallback;
}

/**
 * Interpreta el Content-Type de la respuesta para saber si el backend
 * devolvió un PDF individual o un ZIP con varios PDFs.
 * @returns {'pdf'|'zip'}
 */
function resolveResultType(xhr) {
    const contentType = (xhr.getResponseHeader('Content-Type') || '').toLowerCase();
    if (contentType.includes('zip')) return 'zip';
    return 'pdf';
}

/**
 * Sube los archivos XML/ZIP y devuelve el PDF (o ZIP de PDFs) resultante,
 * reportando progreso real de subida vía XHR.
 * @param {File[]} files
 * @param {{
 *   onProgress?: (percent:number)=>void,
 *   onSuccess:(result:{blob:Blob, fileName:string, type:'pdf'|'zip'})=>void,
 *   onError:(message:string)=>void
 * }} callbacks
 * @returns {XMLHttpRequest} referencia al request, útil para abortarlo
 */
export function convertFilesToPdf(files, { onProgress, onSuccess, onError }) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', ENDPOINT, true);
    xhr.responseType = 'blob';

    if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
            if (!e.lengthComputable) return;
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
        });
    }

    xhr.onload = () => {
        const errorCount = xhr.getResponseHeader('X-Archivos-Con-Error');
        if (xhr.status >= 200 && xhr.status < 300) {
            const type = resolveResultType(xhr);
            const fallbackName = type === 'zip' ? DEFAULT_ZIP_FILENAME : DEFAULT_PDF_FILENAME;
            onSuccess({
                blob: xhr.response,
                fileName: extractFileName(xhr, fallbackName), errorCount,
                type,
            });
            return;
        }

        // El cuerpo de error viene como blob porque responseType es 'blob';
        // hay que leerlo como texto aparte.
        const reader = new FileReader();
        reader.onload = () => {
            onError(reader.result || 'Hubo un problema al procesar los archivos.');
        };
        reader.onerror = () => {
            onError('Hubo un problema al procesar los archivos.');
        };
        reader.readAsText(xhr.response);
    };

    xhr.onerror = () => {
        onError('No se pudo conectar con el servidor. Revisa tu conexión de red o vuelve a intentarlo.');
    };

    xhr.send(formData);

    return xhr;
}