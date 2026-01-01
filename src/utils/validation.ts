/**
 * Validation utilities for forms and user input
 */

/**
 * Validates if a URL is a valid GitHub repository URL
 * @param url - The URL to validate
 * @returns true if valid GitHub repo URL, false otherwise
 */
export function isValidGitHubUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // GitHub repository URL patterns
    const patterns = [
        /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/i,
        /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\.git$/i,
    ];

    return patterns.some(pattern => pattern.test(url.trim()));
}

/**
 * Extracts username and repository name from a GitHub URL
 * @param url - The GitHub URL
 * @returns Object with username and repo, or null if invalid
 */
export function getGitHubRepoInfo(url: string): { username: string; repo: string } | null {
    if (!isValidGitHubUrl(url)) return null;

    const match = url.match(/github\.com\/([\w-]+)\/([\w.-]+?)(\.git)?$/i);
    if (!match) return null;

    return {
        username: match[1],
        repo: match[2]
    };
}

/**
 * Validates file size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in megabytes (default: 2MB)
 * @returns true if file size is within limit, false otherwise
 */
export function isValidFileSize(file: File, maxSizeMB: number = 2): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}

/**
 * Formats file size to human readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validates if file type is allowed for assignments
 * @param file - The file to validate
 * @returns true if file type is allowed, false otherwise
 */
export function isValidAssignmentFileType(file: File): boolean {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    return allowedTypes.includes(file.type);
}
