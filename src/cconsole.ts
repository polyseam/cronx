import { CConsole } from "@polyseam/cconsole";

/**
 * A preconfigured console instance with default log level set to "INFO".
 * This instance provides enhanced logging capabilities through the CConsole class.
 *
 * Configured at runtime with the `--verbosity` option passed to cconsole.setLogLevel()
 *
 * @type {CConsole}
 */
export const cconsole = new CConsole("INFO");
