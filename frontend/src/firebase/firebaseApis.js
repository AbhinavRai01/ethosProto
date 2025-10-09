import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import JSZip from 'jszip';

/**
 * Unzips a file in the browser and uploads all contained images to Firebase Storage.
 * This function is designed for a bundled environment (e.g., Vite, Create React App)
 * where 'firebase' and 'jszip' are installed via npm.
 *
 * @param {object} params - The parameters for the upload.
 * @param {File} params.zipFile - The .zip file selected by the user.
 * @param {import("firebase/storage").Storage} params.storage - The initialized Firebase Storage instance.
 * @param {string} [params.destinationFolder='images'] - The folder name in Firebase Storage.
 * @param {(message: string) => void} [params.onProgress] - An optional callback function to report progress.
 * @returns {Promise<string[]>} A promise that resolves with an array of the uploaded image URLs.
 */
export async function uploadZippedImages({ zipFile, storage, destinationFolder = 'images', onProgress = () => {} }) {
    if (!zipFile) throw new Error('A zip file must be provided.');
    if (!storage) throw new Error('A Firebase Storage instance must be provided.');

    onProgress('Reading zip file...');
    const zip = await JSZip.loadAsync(zipFile);

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const uploadPromises = [];
    const imageEntries = [];

    // First, find all image files to get a count and filter them.
    zip.forEach((_, zipEntry) => {
        const isImage = !zipEntry.dir && imageExtensions.some(ext => zipEntry.name.toLowerCase().endsWith(ext));
        if (isImage) {
            imageEntries.push(zipEntry);
        }
    });
    
    if (imageEntries.length === 0) {
        const message = 'No images found in the ZIP file.';
        onProgress(message);
        throw new Error(message);
    }

    onProgress(`Found ${imageEntries.length} images. Starting upload...`);
    let uploadedCount = 0;

    // Process each image entry to create an upload promise.
    for (const zipEntry of imageEntries) {
        // FIX: Add a guard to ensure the zip entry has a valid filename.
        // This prevents errors if the zip file contains corrupted entries with no name.
        if (!zipEntry.name || typeof zipEntry.name !== 'string') {
            console.warn('Skipping an invalid or unnamed entry in the zip file:', zipEntry);
            continue; // Skip this iteration and move to the next file.
        }

        const uploadPromise = zipEntry.async('blob').then(blob => {
            const storageRef = ref(storage, `${destinationFolder}/${zipEntry.name}`);
            
            // The actual upload call
            return uploadBytes(storageRef, blob).then(snapshot => {
                uploadedCount++;
                onProgress(`(${uploadedCount}/${imageEntries.length}) Uploaded ${zipEntry.name}`);
                return getDownloadURL(snapshot.ref); // This promise resolves with the URL
            });
        });
        uploadPromises.push(uploadPromise);
    }
    
    // Promise.all waits for all the individual upload promises to complete.
    const urls = await Promise.all(uploadPromises);
    onProgress('All uploads complete!');
    return urls;
}


