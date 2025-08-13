"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryDetector = void 0;
class BinaryDetector {
    isBinary(buffer, filePath) {
        // Extension-based quick check
        if (filePath) {
            const ext = filePath.split('.').pop()?.toLowerCase();
            if (ext && BinaryDetector.binaryExtensions.includes(ext)) {
                return true;
            }
        }
        // Magic number checks for common binary formats
        if (buffer.length > 4) {
            // PNG
            if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47)
                return true;
            // JPG
            if (buffer[0] === 0xFF && buffer[1] === 0xD8)
                return true;
            // GIF
            if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46)
                return true;
            // ZIP
            if (buffer[0] === 0x50 && buffer[1] === 0x4B)
                return true;
            // PDF
            if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46)
                return true;
            // EXE (MZ)
            if (buffer[0] === 0x4D && buffer[1] === 0x5A)
                return true;
        }
        // Check for BOM (encoding detection)
        if (buffer.length > 2) {
            // UTF-8 BOM
            if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF)
                return false;
            // UTF-16 LE BOM
            if (buffer[0] === 0xFF && buffer[1] === 0xFE)
                return false;
            // UTF-16 BE BOM
            if (buffer[0] === 0xFE && buffer[1] === 0xFF)
                return false;
        }
        // Check first 4KB for binary indicators
        const sampleSize = Math.min(4096, buffer.length);
        const sample = buffer.subarray(0, sampleSize);
        // Null byte check
        if (sample.includes(0)) {
            // If file is mostly text but has a few nulls, check ratio
            const nullCount = sample.filter(b => b === 0).length;
            if (nullCount / sample.length > 0.01)
                return true;
        }
        // Control character ratio
        let controlChars = 0;
        for (let i = 0; i < sample.length; i++) {
            const byte = sample[i];
            if ((byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) || byte === 127) {
                controlChars++;
            }
        }
        const controlRatio = controlChars / sample.length;
        if (controlRatio > 0.3)
            return true;
        // Try decoding as UTF-8
        try {
            const text = sample.toString('utf8');
            // If decoding produces lots of replacement chars, likely binary
            const replacementCount = (text.match(/�/g) || []).length;
            if (replacementCount / sample.length > 0.01)
                return true;
        }
        catch {
            return true;
        }
        return false;
    }
}
exports.BinaryDetector = BinaryDetector;
BinaryDetector.binaryExtensions = [
    'exe', 'dll', 'bin', 'dat', 'so', 'o', 'a', 'class', 'jar', 'pyc', 'pyo', 'zip', 'tar', 'gz', '7z', 'rar',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico', 'pdf', 'mp3', 'mp4', 'avi', 'mov', 'mkv', 'flac', 'ogg', 'wav',
    'ttf', 'woff', 'woff2', 'eot', 'otf', 'swf', 'psd', 'ai', 'eps', 'dmg', 'iso', 'img', 'apk', 'msi', 'cab'
];
//# sourceMappingURL=binary.js.map