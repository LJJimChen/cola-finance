import * as fs from 'fs';
import * as path from 'path';
import { IPlatformAdapter, PlatformType } from "./types";

export class AdapterFactory {
  private static adapters = new Map<PlatformType, IPlatformAdapter>();

  static register(adapter: IPlatformAdapter) {
    this.adapters.set(adapter.platform, adapter);
  }

  static getAdapter(type: PlatformType): IPlatformAdapter {
    const adapter = this.adapters.get(type);
    if (!adapter) {
      throw new Error(`Adapter for ${type} not found`);
    }
    return adapter;
  }

  static loadAdapters() {
    const adaptersDir = path.join(__dirname, 'adapters');
    if (!fs.existsSync(adaptersDir)) {
      console.warn(`Adapters directory not found: ${adaptersDir}`);
      return;
    }

    const files = fs.readdirSync(adaptersDir);

    files.forEach((file) => {
      if ((file.endsWith('-adapter.js') || file.endsWith('-adapter.ts')) && !file.endsWith('.d.ts')) {
        const filePath = path.join(adaptersDir, file);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const moduleExports = require(filePath);

        Object.values(moduleExports).forEach((exported: any) => {
          if (typeof exported === 'function' && exported.prototype) {
            try {
              const instance = new exported();
              if (instance.platform && instance.fetchAssets) {
                this.register(instance);
              }
            } catch (error) {
              // Ignore errors during instantiation (e.g. not a valid adapter class)
            }
          }
        });
      }
    });
  }
}

