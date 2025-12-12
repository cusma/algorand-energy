import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default output path is dashboard/public/data
const DEFAULT_OUTPUT_PATH = join(__dirname, '../../../dashboard/public/data');

/**
 * Ensures a directory exists, creating it recursively if necessary.
 *
 * This function is idempotent - it won't fail if the directory already exists.
 *
 * @param dirPath - Absolute path to the directory to create
 * @throws {Error} If directory creation fails for reasons other than already existing
 *
 * @internal
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Writes data to a JSON file with pretty formatting.
 *
 * Creates the output directory if it doesn't exist. The JSON is formatted
 * with 2-space indentation for readability.
 *
 * @param filename - Name of the file to write (e.g., 'nodes.json')
 * @param data - Data to serialize to JSON
 * @param outputPath - Directory path where the file will be written (defaults to dashboard/public/data)
 * @throws {Error} If file writing fails
 *
 * @example
 * await writeJsonFile('data.json', { count: 42 });
 * // Writes to: dashboard/public/data/data.json
 */
export async function writeJsonFile(
  filename: string,
  data: unknown,
  outputPath: string = DEFAULT_OUTPUT_PATH
): Promise<void> {
  try {
    await ensureDir(outputPath);
    const filePath = join(outputPath, filename);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✓ Written: ${filePath}`);
  } catch (error) {
    console.error(`✗ Failed to write ${filename}:`, error);
    throw error;
  }
}

/**
 * Writes data files to the 'latest' subdirectory.
 *
 * This function is a convenience wrapper around writeJsonFile that automatically
 * writes to the `latest/` subdirectory, which is used to store the most recent
 * fetched data for the dashboard.
 *
 * @param baseFilename - Name of the file to write (e.g., 'nodes.json')
 * @param data - Data to serialize to JSON
 * @param outputPath - Base directory path (defaults to dashboard/public/data)
 * @throws {Error} If file writing fails
 *
 * @example
 * await writeDataFiles('nodes.json', nodeData);
 * // Writes to: dashboard/public/data/latest/nodes.json
 */
export async function writeDataFiles(
  baseFilename: string,
  data: unknown,
  outputPath: string = DEFAULT_OUTPUT_PATH
): Promise<void> {
  // Write to latest/
  const latestPath = join(outputPath, 'latest');
  await writeJsonFile(baseFilename, data, latestPath);
}

/**
 * Reads an existing data file from the latest directory.
 *
 * This function supports graceful degradation - when fetching new data fails,
 * the application can fall back to previously fetched data instead of having
 * no data at all.
 *
 * @param filename - Name of the file to read (e.g., 'nodes.json')
 * @param outputPath - Base directory path (defaults to dashboard/public/data)
 * @returns The parsed JSON data, or null if the file doesn't exist or can't be read
 *
 * @example
 * const existingData = await readExistingData('nodes.json');
 * if (existingData) {
 *   console.log('Using cached data');
 * }
 */
export async function readExistingData(
  filename: string,
  outputPath: string = DEFAULT_OUTPUT_PATH
): Promise<unknown | null> {
  try {
    const latestPath = join(outputPath, 'latest', filename);
    const content = await readFile(latestPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
