import { cronx } from "src/cronx.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log();
  await cronx.parse(Deno.args);
}
