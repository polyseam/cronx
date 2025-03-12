import { cronxCommand } from "src/cronx.ts";

if (import.meta.main) {
  console.log();
  await cronxCommand.parse(Deno.args);
}
