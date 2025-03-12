import { cli } from "src/cli.ts";

if (import.meta.main) {
  console.log();
  await cli.parse(Deno.args);
}
