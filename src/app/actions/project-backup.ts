
'use server';

import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

/**
 * Generates a full project source code ZIP archive.
 * Excludes large binary directories and build artifacts.
 */
export async function exportProjectSource() {
  const zip = new JSZip();
  const rootDir = process.cwd();

  // Folders to exclude from the backup to keep size manageable
  const EXCLUDED_DIRS = [
    'node_modules',
    '.next',
    '.git',
    'out',
    '.firebase',
    '.DS_Store',
    'dist'
  ];

  async function walk(dir: string, zipPath: string) {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      if (EXCLUDED_DIRS.includes(file)) continue;

      const fullPath = path.join(dir, file);
      const stat = await fs.stat(fullPath);
      const relativePath = path.join(zipPath, file);

      if (stat.isDirectory()) {
        await walk(fullPath, relativePath);
      } else {
        const content = await fs.readFile(fullPath);
        zip.file(relativePath, content);
      }
    }
  }

  try {
    await walk(rootDir, '');
    const buffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    
    return buffer.toString('base64');
  } catch (error: any) {
    console.error('Project backup failed:', error);
    throw new Error('Failed to generate project snapshot');
  }
}
