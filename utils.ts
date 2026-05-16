import { createDefine } from "fresh";

// Shape of `ctx.state`, shared among middleware, layouts, and routes.
// Empty for now — add fields here as the app needs shared request state.
// deno-lint-ignore no-empty-interface
export interface State {}

export const define = createDefine<State>();
