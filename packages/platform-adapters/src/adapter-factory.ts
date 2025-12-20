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
}

