// fileManager.js
// Responsable únicamente del estado de los archivos seleccionados:
// agregarlos, quitarlos, validarlos y formatear su tamaño.
// No toca el DOM.

export const ALLOWED_EXTENSIONS = ['.xml', '.zip'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB, ajustable

let selectedFiles = []; // [{ id, file }]

export function makeId() {
    return (crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getExtension(fileName) {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex === -1 ? '' : fileName.substring(dotIndex).toLowerCase();
}

export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getSelectedFiles() {
    return selectedFiles;
}

export function getFileCount() {
    return selectedFiles.length;
}

/**
 * Intenta agregar una FileList al estado, validando extensión, tamaño
 * y duplicados.
 * @returns {{ added: Array, rejected: string[] }}
 */
export function addFiles(fileList) {
    const added = [];
    const rejected = [];

    for (const file of Array.from(fileList)) {
        const ext = getExtension(file.name);

        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            rejected.push(`${file.name} (extensión no permitida)`);
            continue;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            rejected.push(`${file.name} (supera ${formatBytes(MAX_FILE_SIZE_BYTES)})`);
            continue;
        }

        const isDuplicate = selectedFiles.some(
            f => f.file.name === file.name && f.file.size === file.size
        );
        if (isDuplicate) continue;

        const entry = { id: makeId(), file };
        selectedFiles.push(entry);
        added.push(entry);
    }

    return { added, rejected };
}

export function removeFile(id) {
    selectedFiles = selectedFiles.filter(f => f.id !== id);
}

export function clearFiles() {
    selectedFiles = [];
}