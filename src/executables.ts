/**
 * This module contains utility functions for running binary executables as jobs
 *
 * @module
 */

import type { Logger } from "./JobLogger.ts";

type RunExecutableOptions = {
  suppressStdio: boolean;
  jobLogger: Logger;
};

/**
 * Executes a shell command with optional stdio suppression and logging.
 *
 * @param job - The shell command to execute as a string
 * @param options - Configuration options for command execution
 * @param options.suppressStdio - When true, stdout and stderr are not reflected by the jobLogger
 * @param options.jobLogger - Logger object to handle command output
 * @param options.jobLogger.log - Method to log stdout messages
 * @param options.jobLogger.error - Method to log stderr messages
 *
 * @returns Promise that resolves when the command completes
 *
 * @example
 * ```ts
 * await runExecutable("echo hello", {
 *   suppressStdio: false,
 *   jobLogger: console
 * });
 * ```
 */
export async function runExecutable(
  job: string,
  options: RunExecutableOptions,
) {
  const { suppressStdio, jobLogger } = options;

  const stdout = suppressStdio ? "null" : "piped";
  const stderr = suppressStdio ? "null" : "piped";

  const [c, ...args] = job.split(" ");

  const cmd = new Deno.Command(c, {
    args,
    stdout,
    stderr,
  });

  const output = await cmd.output();
  const d = new TextDecoder();
  if (!suppressStdio) {
    const stdoutTxt = d.decode(output.stdout);
    const stderrTxt = d.decode(output.stderr);

    if (stdoutTxt) {
      jobLogger.log(stdoutTxt);
    }
    if (stderrTxt) {
      jobLogger.error(stderrTxt);
    }
  }
}
