/**
 * This module contains utility functions for running binary executables as jobs
 *
 * @module
 */

import { JobLogger, type Logger } from "./JobLogger.ts";
import { cconsole } from "cconsole";

type RunExecutableOptions = {
  suppressStdout?: boolean;
  suppressStderr?: boolean;
  jobLogger?: Logger;
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
 *   suppressStderr: true,
 *   jobLogger: console
 * });
 * ```
 */
export async function runExecutable(
  job: string,
  options: RunExecutableOptions,
) {
  const suppressStdout = options?.suppressStdout || false;
  const suppressStderr = options?.suppressStderr || false;

  printDebugJobStatus({ suppressStderr, suppressStdout, job });

  const jobLogger = options?.jobLogger || new JobLogger();

  const stdout = suppressStdout ? "null" : "piped";
  const stderr = suppressStderr ? "null" : "piped";

  const [c, ...args] = job.split(" ");

  const cmd = new Deno.Command(c, {
    args,
    stdout,
    stderr,
  });

  const output = await cmd.output();
  const d = new TextDecoder();

  if (!suppressStdout) {
    jobLogger.log(d.decode(output.stdout));
  }

  // note: stderr is not always an error
  // unix philosophy says to use stderr for any diagnostic logging
  if (!suppressStderr) {
    jobLogger.error(d.decode(output.stderr));
  }
}

function printDebugJobStatus(
  { suppressStdout, suppressStderr, job }: {
    suppressStdout: boolean;
    suppressStderr: boolean;
    job: string;
  },
) {
  cconsole.debug();
  cconsole.debug(
    `Running job: ${job} with`,
  );
  cconsole.debug(
    `stdout: ${suppressStdout ? "suppressed" : "reflected"}`,
  );
  cconsole.debug(
    `stderr: ${suppressStderr ? "suppressed" : "reflected"}`,
  );
  cconsole.debug();
}
