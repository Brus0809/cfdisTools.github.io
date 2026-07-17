// MainPdf.js
// Orquesta la vista de conversión CFDI -> PDF. Misma lógica que Main.js
// (Excel): conecta drop zone, botones y estado de archivos con el
// renderizado y la llamada al API. Solo cambia el módulo de Api usado
// y el mensaje de resultado, que depende de si el backend devolvió un
// PDF individual o un ZIP con varios PDFs.

import {
    getSelectedFiles,
    getFileCount,
    addFiles,
    removeFile,
    clearFiles,
} from './FileManager/FileManager.js';

import {
    renderFileList,
    onRemoveFileClick,
    showError,
    hideError,
    showProgressView,
    updateProgress,
    hideProgressView,
    showResult,
    hideResult,
    showDropZoneView,
} from './UI/UIRenderer.js';

import { convertFilesToPdf } from './Api/ApiPDF.js';

document.addEventListener('DOMContentLoaded', () => {

    fetch('https://cfdistoolsback.onrender.com/Healt/Health')
        .catch(() => { });
        
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const btnConvert = document.getElementById('btn-convert');
    const btnClear = document.getElementById('btn-clear');
    const btnRestart = document.getElementById('btn-restart');

    let activeRequest = null; // referencia al XHR en curso, evita doble envío

    // ---------- Selección de archivos ----------

    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        handleFilesSelected(e.target.files);
        fileInput.value = '';
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        handleFilesSelected(e.dataTransfer.files);
    });

    function handleFilesSelected(fileList) {
        hideError();
        const { rejected } = addFiles(fileList);

        if (rejected.length > 0) {
            showError(`No se agregaron ${rejected.length} archivo(s): ${rejected.join(', ')}`);
        }

        renderFileList(getSelectedFiles());
    }

    onRemoveFileClick((fileId) => {
        removeFile(fileId);
        renderFileList(getSelectedFiles());
    });

    btnClear.addEventListener('click', () => {
        clearFiles();
        renderFileList(getSelectedFiles());
    });

    // ---------- Conversión ----------

    btnConvert.addEventListener('click', () => {
        if (getFileCount() === 0 || activeRequest) return;
        startConversion();
    });

    function startConversion() {
        hideError();
        showProgressView();
        updateProgress(0, 'Subiendo archivos...');

        const files = getSelectedFiles().map(f => f.file);

        activeRequest = convertFilesToPdf(files, {
            onProgress: (percent) => {
                updateProgress(
                    percent,
                    percent < 100 ? `Subiendo archivos... ${percent}%` : 'Generando tu(s) PDF...'
                );
            },
            onSuccess: ({ blob, fileName, type, errorCount }) => {
                activeRequest = null;
                updateProgress(100, '¡Completado!');
                hideProgressView();

                const message = type === 'zip'
                    ? `Se generaron ${files.length} PDF(s) y se empaquetaron en un archivo ZIP.`
                    : 'Tu PDF se generó correctamente.';

                showResult({ blob, fileName, message, errorCount });
            },
            onError: (message) => {
                activeRequest = null;
                hideProgressView();
                renderFileList(getSelectedFiles());
                showError(message);
            },
        });
    }

    // ---------- Reinicio ----------

    btnRestart.addEventListener('click', () => {
        if (activeRequest) {
            activeRequest.abort();
            activeRequest = null;
        }
        clearFiles();
        hideError();
        hideResult();
        showDropZoneView();
    });
});