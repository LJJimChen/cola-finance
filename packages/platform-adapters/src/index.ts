import { AdapterFactory } from "./adapter-factory";
import { MockAdapter } from "./mock-adapter";

export * from "./types";
export * from "./adapter-factory";
export * from "./mock-adapter";

AdapterFactory.register(new MockAdapter());
