import { colors } from "@cliffy/ansi/colors";
/**
 * A utility class for logging messages with optional labels.
 *
 * @class
 * @example
 * ```typescript
 * const logger = new JobLogger("MyJob");
 * logger.log("Process started"); // ["MyJob" stdout] Process started
 * logger.error("Process failed"); // ["MyJob" stderr] Process failed
 * ```
 */
export class JobLogger {
  label?: string;
  constructor(label?: string) {
    this.label = label;
  }
  log(message: string) {
    const m = this.label
      ? `${colors.brightBlue(`["${this.label}" stdout]`)} ${message}`
      : message;
    console.log(m);
  }
  error(message: string) {
    const m = this.label
      ? `${colors.red(`["${this.label}" stderr]`)} ${message}`
      : message;
    console.error(m);
  }
}
