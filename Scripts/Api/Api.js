// conversionApi.js
// Responsable únicamente de la comunicación con el backend: subir los
// archivos con progreso real y devolver el blob resultante o el error.
// No toca el DOM ni conoce el estado de selectedFiles.

// const ENDPOINT = 'https://localhost:7163/api/cfdiconverter/convert'; 
const ENDPOINT = 'https://cfdistoolsback.onrender.com/api/cfdiconverter/convert';

const DEFAULT_FILENAME = 'CFDI_Excel_Convertido.xlsx';

function extractFileName(xhr) {
    const disposition = xhr.getResponseHeader('Content-Disposition');
    if (!disposition || disposition.indexOf('attachment') === -1) {
        return DEFAULT_FILENAME;
    }
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
        return matches[1].replace(/['"]/g, '');
    }
    return DEFAULT_FILENAME;
}

/**
 * Sube los archivos y reporta progreso real de subida vía XHR.
 * @param {File[]} files
 * @param {{ onProgress?: (percent:number)=>void, onSuccess:(result:{blob:Blob, fileName:string})=>void, onError:(message:string)=>void }} callbacks
 * @returns {XMLHttpRequest} referencia al request, útil para abortarlo
 */
export function convertFiles(files, { onProgress, onSuccess, onError }) {
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
            onSuccess({ blob: xhr.response, fileName: extractFileName(xhr), errorCount });
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