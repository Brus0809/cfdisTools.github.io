// uiRenderer.js
// Responsable únicamente de tocar el DOM: renderizar la lista de archivos,
// errores, progreso y resultado. No conoce reglas de negocio ni hace fetch.

import { formatBytes } from '../FileManager/FileManager.js';

const dropZone = document.getElementById('drop-zone');
const filesContainer = document.getElementById('files-container');
const filesList = document.getElementById('files-list');
const fileCountSpan = document.getElementById('file-count');

const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const resultContainer = document.getElementById('result-container');
const resultDetails = document.getElementById('result-details');
const btnDownload = document.getElementById('btn-download');

// Si el HTML ya trae su propio #error-banner se reutiliza.
// Si no existe, se crea y se le asigna la clase CSS 'error-banner'
// (los estilos viven en main.css, no aquí).
let errorBanner = document.getElementById('error-banner');
if (!errorBanner) {
    errorBanner = document.createElement('div');
    errorBanner.id = 'error-banner';
    errorBanner.classList.add('error-banner', 'hidden');
    filesContainer.parentNode.insertBefore(errorBanner, filesContainer);
}

let currentDownloadUrl = null;

// ---------- Lista de archivos ----------

export function renderFileList(fileEntries) {
    if (fileEntries.length === 0) {
        filesContainer.style.display = 'none';
        dropZone.style.display = 'block';
        return;
    }

    dropZone.style.display = 'none';
    filesContainer.style.display = 'block';

    fileCountSpan.textContent = fileEntries.length;
    filesList.innerHTML = '';

    const fragment = document.createDocumentFragment();

    fileEntries.forEach(({ id, file }) => {
        const li = document.createElement('li');
        li.dataset.fileId = id;

        // -- Lado izquierdo: icono + nombre --
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';

        const icon = document.createElement('i');
        icon.className = file.name.endsWith('.zip')
            ? 'fa-regular fa-file-zipper'
            : 'fa-regular fa-file-code';

        // textContent es seguro: nunca interpreta HTML
        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-name';
        nameSpan.title = file.name;
        nameSpan.textContent = file.name;

        fileInfo.append(icon, nameSpan);

        // -- Lado derecho: tamaño + botón eliminar --
        const fileActions = document.createElement('div');
        fileActions.className = 'file-actions';

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'file-size';
        sizeSpan.textContent = formatBytes(file.size);

        const removeBtn = document.createElement('i');
        removeBtn.className = 'fa-solid fa-xmark remove-file-btn';
        removeBtn.dataset.fileId = id;

        fileActions.append(sizeSpan, removeBtn);
        li.append(fileInfo, fileActions);
        fragment.appendChild(li);
    });

    filesList.appendChild(fragment);
}

/**
 * Registra el callback de eliminación mediante delegación de eventos
 * (un solo listener para todos los botones .remove-file-btn).
 */
export function onRemoveFileClick(callback) {
    filesList.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-file-btn');
        if (!btn) return;
        e.stopPropagation();
        callback(btn.getAttribute('data-file-id'));
    });
}

// ---------- Errores ----------

export function showError(message) {
    errorBanner.textContent = message;
    errorBanner.classList.remove('hidden');
}

export function hideError() {
    errorBanner.classList.add('hidden');
    errorBanner.textContent = '';
}

// ---------- Progreso ----------

export function showProgressView() {
    filesContainer.style.display = 'none';
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
}

export function updateProgress(percent, text) {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = text;
}

export function hideProgressView() {
    progressContainer.style.display = 'none';
}

// ---------- Resultado ----------

/**
 * Muestra la pantalla de éxito y prepara el enlace de descarga.
 * Libera cualquier Object URL anterior antes de crear el nuevo.
 */
export function showResult({ blob, fileName, message }) {
    if (currentDownloadUrl) {
        URL.revokeObjectURL(currentDownloadUrl);
    }
    currentDownloadUrl = URL.createObjectURL(blob);

    btnDownload.href = currentDownloadUrl;
    btnDownload.download = fileName;

    resultContainer.style.display = 'block';
    resultDetails.textContent = message;

    btnDownload.click();
}

export function hideResult() {
    resultContainer.style.display = 'none';
    if (currentDownloadUrl) {
        URL.revokeObjectURL(currentDownloadUrl);
        currentDownloadUrl = null;
    }
}

// ---------- Vistas base ----------

export function showDropZoneView() {
    dropZone.style.display = 'block';
    filesContainer.style.display = 'none';
}

export function getElements() {
    return { dropZone, fileCountSpan };
}