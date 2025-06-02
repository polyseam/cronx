import { colors } from "@cliffy/ansi/colors";

/**
 * Interface defining the standard logging capabilities required for job execution.
 *
 * This interface provides a minimal logging API that all logger implementations
 * must satisfy to be used with cronx job execution.
 *
 * @interface Logger
 *
 * @example
 * ```ts
 * // Create a custom logger implementing the Logger interface
 * const customLogger: Logger = {
 *   log: (message) => myLoggingSystem.info(message),
 *   error: (message) => myLoggingSystem.error(message)
 * };
 *
 * // Use with scheduleCronWithExecutable
 * scheduleCronWithExecutable("npm run build", {
 *   cronTabExpression: "0 0 * * *",
 *   jobLogger: customLogger
 * });
 * ```
 */
export interface Logger {
  /**
   * Logs standard output messages.
   *
   * @param {...any[]} args - Arguments to log (typically strings)
   */
  // deno-lint-ignore no-explicit-any
  log: (...args: any[]) => void;

  /**
   * Logs error messages.
   *
   * @param {...any[]} args - Arguments to log (typically strings)
   */
  // deno-lint-ignore no-explicit-any
  error: (...args: any[]) => void;
}

/**
 * A utility class for logging job execution messages with optional labels.
 *
 * JobLogger implements the Logger interface and provides colored console output
 * with optional job labels to distinguish between different job outputs.
 *
 * @class JobLogger
 * @implements {Logger}
 *
 * @example
 * ```typescript
 * // Create a logger with a label
 * const logger = new JobLogger("MyJob");
 * logger.log("Process started"); // ["MyJob" stdout] Process started
 * logger.error("Process failed"); // ["MyJob" stderr] Process failed
 *
 * // Create a logger without a label
 * const simpleLogger = new JobLogger();
 * simpleLogger.log("Simple message"); // Simple message (no label)
 * ```
 */
export class JobLogger implements Logger {
  /**
   * Optional label to prefix log messages with
   */
  label?: string;

  /**
   * Creates a new JobLogger instance.
   *
   * @param {string} [label] - Optional identifier to prefix all log messages with
   */
  constructor(label?: string) {
    this.label = label;
  }
  /**
   * Logs a standard output message, optionally prefixed with the job label.
   *
   * If a label was provided when creating the logger, the message will be
   * prefixed with the label in blue color.
   *
   * @param {string} message - The message to log
   *
   * @example
   * ```ts
   * const logger = new JobLogger("DataJob");
   * logger.log("Processing complete");
   * // Output: ["DataJob" stdout] Processing complete (with "DataJob" in blue)
   * ```
   */
  log(message: string) {
    const m = this.label
      ? `${colors.brightBlue(`["${this.label}" stdout]`)} ${message}`
      : message;
    console.log(m);
  }
  /**
   * Logs an error message, optionally prefixed with the job label.
   *
   * If a label was provided when creating the logger, the message will be
   * prefixed with the label in red color.
   *
   * @param {string} message - The error message to log
   *
   * @example
   * ```ts
   * const logger = new JobLogger("DataJob");
   * logger.error("Database connection failed");
   * // Output: ["DataJob" stderr] Database connection failed (with "DataJob" in red)
   * ```
   */
  error(message: string) {
    const m = this.label
      ? `${colors.red(`["${this.label}" stderr]`)} ${message}`
      : message;
    console.error(m);
  }
}
