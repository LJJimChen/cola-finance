import fs from 'fs';
import path from 'path';

export function getLocalD1DB() {
  try {
    // Navigate up from apps/bff/scripts/utils to apps/bff/
    // Actually, this function assumes it's running from apps/bff root if using relative path
    // But since we are moving it to a shared util, let's make it robust.
    // The .wrangler directory is usually in the project root where wrangler dev runs.
    // Assuming apps/bff is the CWD when running scripts.
    
    const basePath = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
    
    if (!fs.existsSync(basePath)) {
      return undefined;
    }

    const dbFile = fs
      .readdirSync(basePath)
      .find((file) => file.endsWith('.sqlite'));
      
    return dbFile ? path.join(basePath, dbFile) : undefined;
  } catch {
    return undefined;
  }
}
