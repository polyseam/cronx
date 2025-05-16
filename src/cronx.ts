/**
 * This module provides 2 simple APIs for scheduling cron jobs in Deno.
 *
 * scheduleCronWithExecutable() schedules a job to run a command-line executable.
 * scheduleCronWithFunction() schedules a job to run an async function.
 *
 * @module
 */

import { cconsole } from "cconsole";

import {
  convertCronxExpressionToDenoCronExpression,
  getLocalUTCOffset,
} from "./cron.ts";

import { runExecutable } from "src/executables.ts";

import type { Logger } from "./JobLogger.ts";
import type { LogLevel } from "@polyseam/cconsole";

import { getCronTabExpressionForNaturalLanguageSchedule } from "./nlp.ts";

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

interface ScheduleExecutableOptions {
  cronxExpression?: string;
  naturalLanguageSchedule?: string;
  label?: string;
  offset?: number; // timezone utc offset in hours
  suppressStdout?: boolean;
  suppressStderr?: boolean;
  jobLogger?: Logger;
  logLevel?: LogLevel;
}

interface ScheduleExecutableOptionsWithCronxExpression
  extends ScheduleExecutableOptions {
  cronxExpression: string;
}

interface ScheduleExecutableOptionsWithNaturalLanguageExpression
  extends ScheduleExecutableOptions {
  naturalLanguageSchedule: string;
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
 * @param opt.cronxExpression - The cron expression defining the schedule
 * @param opt.offset - Optional timezone offset in hours (defaults to local timezone offset)
 * @param opt.label - Optional custom label for the job (must be alphanumeric with allowed special characters)
 *
 * @throws {Error} If the provided or generated label is invalid
 *
 * @example
 * scheduleCronWithExecutable('npm run build', {
 *   cronxExpression: '0 0 * * *',
 *   label: 'daily-build'
 * });
 */
export function scheduleCronWithExecutable(
  job: string,
  opt:
    | ScheduleExecutableOptionsWithNaturalLanguageExpression
    | ScheduleExecutableOptionsWithCronxExpression,
) {
  const { suppressStdout, suppressStderr, jobLogger } = opt;
  const cronxExpression = opt?.cronxExpression ??
    getCronTabExpressionForNaturalLanguageSchedule(
      opt.naturalLanguageSchedule!,
    );

  const offset = opt?.offset ?? getLocalUTCOffset();
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

  const denoCronExpression = convertCronxExpressionToDenoCronExpression(
    cronxExpression,
    offset,
  );

  Deno.cron(label, denoCronExpression, async () => {
    await runExecutable(job, { suppressStdout, suppressStderr, jobLogger });
  });
}

interface ScheduleFunctionOptions {
  cronxExpression?: string;
  naturalLanguageSchedule?: string;
  label?: string;
  offset?: number;
  logLevel?: LogLevel;
}

interface ScheduleFunctionOptionsWithCronxExpression
  extends ScheduleFunctionOptions {
  cronxExpression: string;
}
interface ScheduleFunctionOptionsWithNaturalLanguageExpression
  extends ScheduleFunctionOptions {
  naturalLanguageExpression: string;
}

/**
 * Schedules a cron job with a specified function to be executed according to the given cron expression.
 *
 * @param jobFn - The async function to be executed on the cron schedule
 * @param opt - Configuration options for the cron schedule
 * @param opt.cronxExpression - The cron expression defining when the job should run
 * @param opt.naturalLanguageExpression - A natural language expression defining when the job should run
 * @param opt.offset - Optional timezone offset in hours (defaults to local timezone offset)
 * @param opt.label - Optional label for the cron job (defaults to function name)
 *
 * @example
 * ```ts
 * scheduleCronWithFunction(async () => {
 *   // your job logic here
 * }, {
 *   cronxExpression: "0 0 * * *",
 *   label: "daily-job"
 * });
 * ```
 */
export function scheduleCronWithFunction(
  jobFn: () => Promise<void>,
  opt:
    | ScheduleFunctionOptionsWithCronxExpression
    | ScheduleFunctionOptionsWithNaturalLanguageExpression,
) {
  const expression = opt?.cronxExpression ??
    getCronTabExpressionForNaturalLanguageSchedule(
      opt.naturalLanguageSchedule!,
    );

  const offset = opt.offset ?? getLocalUTCOffset();

  const label = opt.label ?? jobFn.name;

  const logLevel = opt.logLevel ?? "INFO";

  cconsole.setLogLevel(logLevel);

  const denoCronExpression = convertCronxExpressionToDenoCronExpression(
    expression,
    offset,
  );

  Deno.cron(label, denoCronExpression, async () => {
    cconsole.debug();
    cconsole.debug("Running function job: " + label);
    cconsole.debug();
    await jobFn();
  });
}
