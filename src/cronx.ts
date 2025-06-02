/**
 * This module provides 2 simple APIs for scheduling cron jobs in Deno.
 *
 * scheduleCronWithExecutable() schedules a job to run a command-line executable.
 * scheduleCronWithFunction() schedules a job to run an async function.
 *
 * @module
 */

import { cconsole } from "cconsole";

import { runExecutable } from "src/executables.ts";

import type { Logger } from "./JobLogger.ts";
import type { LogLevel } from "@polyseam/cconsole";

import {
  CronTabExpression,
  type CronTabExpressionString,
  getLocalUTCOffset,
} from "./CronTabExpression.ts";

export { CronTabExpression, type CronTabExpressionString };

/**
 * Validates a job label accepting only alphanumeric characters, whitespace, hyphens, and underscores.
 *
 * Those are the requirements for the string passed in as the first arg to Deno.cron()
 *
 * @param label - The job label to validate
 * @returns true if the label is valid, otherwise false
 */
export function validateJobLabel(label: string): boolean {
  return (/^[a-zA-Z0-9\s\-_]+$/.test(label));
}

/**
 * Options for scheduling an executable command with cron.
 *
 * @interface ScheduleExecutableOptions
 * @property {CronTabExpressionString | CronTabExpression} [cronTabExpression] - The cron expression defining the schedule (e.g., "0 0 * * *")
 * @property {string} [naturalLanguageSchedule] - A natural language description of the schedule (e.g., "every day at midnight")
 * @property {string} [label] - Custom label for the job (must be alphanumeric with allowed special characters)
 * @property {number} [offset] - Timezone UTC offset in hours (e.g., -5 for EST, +1 for CET)
 * @property {boolean} [suppressStdout] - Whether to suppress standard output from the executable
 * @property {boolean} [suppressStderr] - Whether to suppress standard error from the executable
 * @property {Logger} [jobLogger] - Custom logger for job execution output
 * @property {LogLevel} [logLevel] - Log level for cronx's internal logging
 */
interface ScheduleExecutableOptions {
  cronTabExpression?: CronTabExpressionString | CronTabExpression;
  naturalLanguageSchedule?: string;
  label?: string;
  offset?: number; // timezone utc offset in hours
  suppressStdout?: boolean;
  suppressStderr?: boolean;
  jobLogger?: Logger;
  logLevel?: LogLevel;
}

/**
 * Options for scheduling an executable command with a cron tab expression.
 * This interface requires the cronTabExpression property and disallows naturalLanguageSchedule.
 *
 * @interface ScheduleExecutableOptionsWithcronTabExpression
 * @extends ScheduleExecutableOptions
 * @property {CronTabExpressionString|CronTabExpression} cronTabExpression - The cron expression defining the schedule (required)
 * @property {never} [naturalLanguageSchedule] - Not allowed when using cronTabExpression
 *
 * @example
 * ```ts
 * {
 *   cronTabExpression: "0 0 * * *", // Every day at midnight
 *   label: "daily-job",
 *   offset: -5 // EST timezone
 * }
 * ```
 */
interface ScheduleExecutableOptionsWithCronTabExpression
  extends ScheduleExecutableOptions {
  cronTabExpression: CronTabExpressionString | CronTabExpression;
  naturalLanguageSchedule?: never;
}

/**
 * Options for scheduling an executable command with a natural language expression.
 * This interface requires the naturalLanguageSchedule property and disallows cronTabExpression.
 *
 * @interface ScheduleExecutableOptionsWithNaturalLanguageExpression
 * @extends ScheduleExecutableOptions
 * @property {string} naturalLanguageSchedule - Natural language description of the schedule (required)
 * @property {never} [cronTabExpression] - Not allowed when using naturalLanguageSchedule
 *
 * @example
 * ```ts
 * {
 *   naturalLanguageSchedule: "every day at midnight",
 *   label: "daily-job",
 *   offset: -5 // EST timezone
 * }
 * ```
 */
interface ScheduleExecutableOptionsWithNaturalLanguageExpression
  extends ScheduleExecutableOptions {
  naturalLanguageSchedule: string;
  cronTabExpression?: never;
}

/**
 * Schedules a cron job to execute a command-line executable.
 *
 * @param job - The command-line executable to run
 * @param opt - Configuration options for the scheduled job
 * @param opt.logLevel - The log level for cronx
 * @param opt.suppressStdout - Whether to suppress stdout
 * @param opt.suppressStderr - Whether to suppress stderr
 * @param opt.jobLogger - Optional custom logger function for job execution
 * @param opt.cronTabExpression - The cron expression defining the schedule
 * @param opt.naturalLanguageSchedule - Natural language description of when to run the job
 * @param opt.offset - Optional timezone offset in hours (defaults to local timezone offset)
 * @param opt.label - Optional custom label for the job (must be alphanumeric with allowed special characters)
 *
 * @throws {Error} If the provided or generated label is invalid
 * @throws {Error} If neither cronTabExpression nor naturalLanguageSchedule is provided (when using naturalLanguageSchedule option)
 *
 * @example
 * // Using cron expression
 * scheduleCronWithExecutable('npm run build', {
 *   cronTabExpression: '0 0 * * *', // Run at midnight every day
 *   label: 'daily-build',
 *   suppressStderr: true
 * });
 *
 * // Using natural language
 * scheduleCronWithExecutable('node cleanup.js', {
 *   naturalLanguageSchedule: 'every Sunday at 2:30 am',
 *   label: 'weekly-cleanup',
 *   offset: -5 // EST timezone
 * });
 */
export function scheduleCronWithExecutable(
  job: string,
  opt:
    | ScheduleExecutableOptionsWithNaturalLanguageExpression
    | ScheduleExecutableOptionsWithCronTabExpression,
) {
  const { suppressStdout, suppressStderr, jobLogger } = opt;
  let exp = {} as CronTabExpression;

  const offset = opt?.offset ?? getLocalUTCOffset();

  if (opt.cronTabExpression) {
    if (opt.cronTabExpression instanceof CronTabExpression) {
      exp = opt.cronTabExpression;
    } else {
      exp = new CronTabExpression(opt.cronTabExpression, offset);
    }
  } else {
    exp = CronTabExpression.fromNaturalLanguageSchedule(
      opt.naturalLanguageSchedule,
      offset,
    );
  }

  const logLevel = opt?.logLevel ?? "INFO";

  cconsole.setLogLevel(logLevel);

  let label = job;

  if (opt.label) {
    if (!validateJobLabel(opt.label)) {
      throw new Error(
        'cronx: invalid "label": only alphanumeric characters, whitespace, hyphens, and underscores are allowed',
      );
    }
    label = opt.label;
  } else if (!validateJobLabel(job)) {
    throw new Error(
      'cronx: unable to generate a valid "label" from your <job> argument, please provide one using the label option',
    );
  }

  Deno.cron(label, exp.toDenoCronSchedule(), async () => {
    await runExecutable(job, { suppressStdout, suppressStderr, jobLogger });
  });
}

/**
 * Options for scheduling a function with cron.
 *
 * @interface ScheduleFunctionOptions
 * @property {CronTabExpressionString|CronTabExpression} [cronTabExpression] - The cron expression defining the schedule (e.g., "0 0 * * *")
 * @property {string} [naturalLanguageSchedule] - A natural language description of the schedule (e.g., "every day at midnight")
 * @property {string} [label] - Custom label for the job (defaults to function name if not provided)
 * @property {number} [offset] - Timezone UTC offset in hours (e.g., -5 for EST, +1 for CET)
 * @property {LogLevel} [logLevel] - Log level for cronx's internal logging
 */
interface ScheduleFunctionOptions {
  cronTabExpression?: CronTabExpressionString | CronTabExpression;
  naturalLanguageSchedule?: string;
  label?: string;
  offset?: number;
  logLevel?: LogLevel;
}

/**
 * Options for scheduling a function with a cron tab expression.
 * This interface requires the cronTabExpression property.
 *
 * @interface ScheduleFunctionOptionsWithCronTabExpression
 * @extends ScheduleFunctionOptions
 * @property {CronTabExpressionString|CronTabExpression} cronTabExpression - The cron expression defining the schedule (required)
 *
 * @example
 * ```ts
 * {
 *   cronTabExpression: "0 0 * * *", // Every day at midnight
 *   label: "daily-job",
 *   offset: -5 // EST timezone
 * }
 * ```
 */
interface ScheduleFunctionOptionsWithCronTabExpression
  extends ScheduleFunctionOptions {
  cronTabExpression: CronTabExpressionString | CronTabExpression;
  naturalLanguageSchedule?: never;
}
/**
 * Options for scheduling a function with a natural language expression.
 * This interface requires the naturalLanguageExpression property.
 *
 * @interface ScheduleFunctionOptionsWithNaturalLanguageExpression
 * @extends ScheduleFunctionOptions
 * @property {string} naturalLanguageSchedule - Natural language description of the schedule (required)
 * @property {never} [cronTabExpression] - Not allowed when using naturalLanguageSchedule
 *
 * @example
 * ```ts
 * {
 *   naturalLanguageSchedule: "every day at midnight",
 *   label: "daily-job",
 *   offset: -5 // EST timezone
 * }
 * ```
 */
interface ScheduleFunctionOptionsWithNaturalLanguageExpression
  extends ScheduleFunctionOptions {
  naturalLanguageSchedule: string;
  cronTabExpression?: never;
}

/**
 * Schedules a cron job with a specified function to be executed according to the given cron expression.
 *
 * @param jobFn - The async function to be executed on the cron schedule
 * @param opt - Configuration options for the cron schedule
 * @param opt.cronTabExpression - The cron expression defining when the job should run
 * @param opt.naturalLanguageSchedule - A natural language expression defining when the job should run
 * @param opt.offset - Optional timezone offset in hours (defaults to local timezone offset)
 * @param opt.label - Optional label for the cron job (defaults to function name)
 * @param opt.logLevel - Optional log level for cronx's internal logging (defaults to "INFO")
 *
 * @throws {Error} If neither cronTabExpression nor naturalLanguageSchedule is provided
 *
 * @example
 * ```ts
 * // Using cron expression
 * scheduleCronWithFunction(async () => {
 *   // your job logic here
 *   await fetchData();
 *   await processResults();
 * }, {
 *   cronTabExpression: "0 0 * * *", // Run at midnight every day
 *   label: "daily-job"
 * });
 *
 * // Using natural language
 * scheduleCronWithFunction(async () => {
 *   // your job logic here
 * }, {
 *   naturalLanguageSchedule: "every day at midnight",
 *   label: "daily-job"
 * });
 * ```
 */
export function scheduleCronWithFunction(
  jobFn: () => Promise<void>,
  opt:
    | ScheduleFunctionOptionsWithCronTabExpression
    | ScheduleFunctionOptionsWithNaturalLanguageExpression,
) {
  let exp = {} as CronTabExpression;

  const offset = opt?.offset ?? getLocalUTCOffset();

  if (opt.cronTabExpression) {
    if (opt.cronTabExpression instanceof CronTabExpression) {
      exp = opt.cronTabExpression;
    } else {
      exp = new CronTabExpression(
        opt.cronTabExpression as CronTabExpressionString,
        offset,
      );
    }
  } else if (opt.naturalLanguageSchedule) {
    exp = CronTabExpression.fromNaturalLanguageSchedule(
      opt.naturalLanguageSchedule,
      offset,
    );
  } else {
    throw new Error(
      'cronx: either "cronTabExpression" or "naturalLanguageSchedule" must be provided',
    );
  }

  const label = opt.label ?? jobFn.name;

  const logLevel = opt.logLevel ?? "INFO";

  cconsole.setLogLevel(logLevel);

  Deno.cron(label, exp.toDenoCronSchedule(), async () => {
    cconsole.debug();
    cconsole.debug("Running function job: " + label);
    cconsole.debug();
    await jobFn();
  });
}
