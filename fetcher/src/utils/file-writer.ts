import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_OUTPUT_PATH = join(__dirname, '../../../dashboard/public/data');

async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function writeJsonFile(
  filename: string,
  data: unknown,
  outputPath: string = DEFAULT_OUTPUT_PATH
): Promise<void> {
  await ensureDir(outputPath);
  const filePath = join(outputPath, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.warn(`✓ Written: ${filePath}`);
}

/**
 * Writes data to the `latest/` subdirectory used by the dashboard.
 */
export async function writeLatestData(
  baseFilename: string,
  data: unknown,
  outputPath: string = DEFAULT_OUTPUT_PATH
): Promise<void> {
  const latestPath = join(outputPath, 'latest');
  await writeJsonFile(baseFilename, data, latestPath);
}

export async function readExistingData(
  filename: string,
  outputPath: string = DEFAULT_OUTPUT_PATH
): Promise<unknown> {
  try {
    const latestPath = join(outputPath, 'latest', filename);
    const content = await readFile(latestPath, 'utf-8');
    return JSON.parse(content);
  } catch (error: unknown) {
    const isFileNotFound =
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT';
    if (!isFileNotFound) {
      console.warn(`Failed to read existing ${filename}:`, error);
    }
    return null;
  }
}
