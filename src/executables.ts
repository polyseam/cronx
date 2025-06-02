/**
 * This module contains utility functions for running binary executables as jobs.
 *
 * It provides functionality to execute shell commands with options for output control
 * and logging. These utilities are primarily used by the cron scheduling API for
 * executing command-line jobs.
 *
 * @module executables
 */

import { JobLogger, type Logger } from "./JobLogger.ts";
import { cconsole } from "cconsole";

/**
 * Configuration options for executing a shell command.
 *
 * @interface RunExecutableOptions
 * @property {boolean} [suppressStdout=false] - When true, standard output from the command will not be logged
 * @property {boolean} [suppressStderr=false] - When true, standard error from the command will not be logged
 * @property {Logger} [jobLogger] - Custom logger for capturing command output. Defaults to a new JobLogger instance if not provided
 *
 * @example
 * ```ts
 * // Suppress stderr but log stdout with a custom logger
 * const options: RunExecutableOptions = {
 *   suppressStderr: true,
 *   jobLogger: new JobLogger("backup-job")
 * };
 *
 * // Suppress both stdout and stderr
 * const silentOptions: RunExecutableOptions = {
 *   suppressStdout: true,
 *   suppressStderr: true
 * };
 * ```
 */
type RunExecutableOptions = {
  suppressStdout?: boolean;
  suppressStderr?: boolean;
  jobLogger?: Logger;
};

/**
 * Executes a shell command with optional stdio suppression and logging capabilities.
 *
 * This function runs the specified command using Deno's subprocess API and captures
 * its output. The command's stdout and stderr can be optionally suppressed and/or
 * logged using a custom logger.
 *
 * @param {string} job - The shell command to execute as a string (e.g., "node script.js --option")
 * @param {RunExecutableOptions} [options] - Configuration options for command execution
 * @param {boolean} [options.suppressStdout=false] - When true, stdout is not logged
 * @param {boolean} [options.suppressStderr=false] - When true, stderr is not logged
 * @param {Logger} [options.jobLogger] - Custom logger to handle command output (defaults to a new JobLogger)
 *
 * @returns {Promise<void>} Promise that resolves when the command completes
 *
 * @example
 * ```ts
 * // Basic usage with default options
 * await runExecutable("npm run build");
 *
 * // With a custom logger and suppressed stderr
 * await runExecutable("curl https://api.example.com/data", {
 *   suppressStderr: true,
 *   jobLogger: new JobLogger("API-Fetch")
 * });
 *
 * // Complete silence (suppress all output)
 * await runExecutable("node cleanup.js", {
 *   suppressStdout: true,
 *   suppressStderr: true
 * });
 *
 * // Using console as the logger
 * await runExecutable("echo 'Running backup...' && tar -czf backup.tar.gz ./data", {
 *   jobLogger: console
 * });
 * ```
 *
 * @remarks
 * - The command is split on spaces to separate the executable from its arguments
 * - This function uses Deno.Command API to execute the process
 * - stderr output is not always indicative of errors (some programs use it for diagnostic output)
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

/**
 * Prints debug information about the job being executed.
 *
 * This internal helper function outputs the job command and its output configuration
 * to help with debugging. Output is controlled by cconsole's debug level setting.
 *
 * @param {Object} params - Parameters object
 * @param {boolean} params.suppressStdout - Whether stdout is being suppressed
 * @param {boolean} params.suppressStderr - Whether stderr is being suppressed
 * @param {string} params.job - The shell command being executed
 *
 * @private
 */
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
