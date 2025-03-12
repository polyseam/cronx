import { Command, ValidationError } from "@cliffy/command";
import { Confirm, Input, Select } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";

import type { LogLevel } from "@polyseam/cconsole";

import deno_json from "../deno.json" with { type: "json" };

import { cconsole } from "cconsole";

import { runExecutable } from "src/executables.ts";

import { JobLogger } from "src/JobLogger.ts";

import { scheduleCronWithExecutable, validateJobLabel } from "src/cronx.ts";

import {
  getCronTabExpressionForNaturalLanguageSchedule,
  getNaturalLanguageScheduleForCronTabExpression,
} from "src/nlp.ts";

import { getLocalUTCOffset } from "src/cron.ts";

const DEFAULT_SCHEDULE_OPTIONS = [
  { name: "Every minute", value: "* * * * *" },
  { name: "Every hour", value: "0 * * * *" },
  { name: "Every day at 12am", value: "0 0 * * *" },
  { name: "Every 15 minutes", value: "*/15 * * * *" },
  { name: "Every 30 minutes", value: "*/30 * * * *" },
  { name: "Every Sunday at 12am", value: "0 0 * * 0" },
  { name: "First day of every month", value: "0 0 1 * *" },
];

export const cli = new Command().name("cronx")
  .description("CLI utility for scheduling cron jobs")
  .version(deno_json.version)
  .arguments("<job>")
  .option(
    "-t, --tab <tab:string>",
    "The crontab expression for your workload in your timezone",
  )
  .option(
    "-n, --natural <description:string>",
    "Natural language description of schedule (e.g., 'every day at 2pm')",
  )
  .option("--offset <hours:number>", "The timezone offset in hours", {
    default: getLocalUTCOffset(),
  })
  .option("-l, --label <label:string>", "A label for the job")
  .option("-v, --verbosity <level:string>", "Set the log level", {
    default: "INFO",
    action: (opt) => {
      const verbosity = opt.verbosity.toUpperCase();
      if (!["DEBUG", "INFO", "WARN", "ERROR"].includes(verbosity)) {
        throw new ValidationError(
          "Invalid log level, must be one of: 'DEBUG', 'INFO', 'WARN', 'ERROR'",
        );
      }
    },
  })
  .option(
    `--suppress-stdio`,
    `Whether or not to suppress your executable's "stdout" and "stderr"`,
    {
      default: false,
    },
  )
  .option("-y, --yes", "Disable interactivity")
  .option("-r, --run", "Run the job immediately as well")
  .action(
    async (options, job) => {
      const logLevel = options.verbosity.toUpperCase() as LogLevel;

      cconsole.setLogLevel(logLevel);

      const {
        tab,
        offset,
        suppressStdio,
      } = options;

      if (options.label) {
        if (!validateJobLabel(options.label)) {
          cconsole.error(
            'cronx: invalid "label": only alphanumeric characters, whitespace, hyphens, and underscores are allowed',
          );
          Deno.exit(1);
        }
      } else if (!validateJobLabel(job)) {
        cconsole.error(
          'cronx: unable to generate a valid "label" from your <job> argument, please provide one using the "--label" option',
        );
        Deno.exit(1);
      }

      const label = options.label ?? job;

      let naturalInput = options.natural;
      let naturalOutput;

      const nonInteractive = options.yes;

      let cronExpression = tab;

      if (tab) {
        naturalOutput = getNaturalLanguageScheduleForCronTabExpression(
          cronExpression!,
        );
        if (naturalOutput instanceof Error) {
          cconsole.error(naturalOutput.message);
          Deno.exit(1);
        }
      } else if (naturalInput) {
        cronExpression = getCronTabExpressionForNaturalLanguageSchedule(
          naturalInput,
        );

        if (typeof cronExpression !== "string") {
          cconsole.error(
            'failed to generate cron expression from "--natural" input',
          );
          cconsole.error(naturalInput);
          Deno.exit(1);
        }
      } else if (!nonInteractive) {
        const sResponse = await Select.prompt({
          message: `How often do you want to run '${colors.cyan(job)}' ?`,
          options: [
            ...DEFAULT_SCHEDULE_OPTIONS,
            { name: "Write your own schedule...", value: "custom" },
          ],
        });

        if (sResponse === "custom") {
          naturalInput = await Input.prompt({
            message: "Write your schedule in plain language",
            hint: "e.g., 'every day at 2pm'",
          });

          cronExpression = getCronTabExpressionForNaturalLanguageSchedule(
            naturalInput,
          );
        } else {
          cronExpression = sResponse;
        }
      } else {
        cconsole.error(
          'when using "--yes", you must provide a "--tab" or "--natural" option',
        );
        Deno.exit(1);
      }

      naturalOutput = getNaturalLanguageScheduleForCronTabExpression(
        cronExpression!,
      );

      if (naturalOutput instanceof Error) {
        cconsole.error(naturalOutput.message);
        Deno.exit(1);
      }

      if (!nonInteractive) {
        const go = await Confirm.prompt({
          message: `Do you want to schedule '${
            colors.cyan(job)
          }' to run '${naturalOutput}'?`,
          hint: cronExpression,
          default: true,
        });

        if (!go) {
          cconsole.debug(colors.red("Aborted."));
          Deno.exit(0);
        }
      }

      cconsole.info(
        `Scheduling '${colors.cyan(job)}' to run '${
          colors.green(naturalOutput)
        }'(${cronExpression})`,
      );

      const jobLogger = new JobLogger(label);

      if (options.run) {
        cconsole.debug();
        cconsole.debug(
          `Running job: ${job} ${
            suppressStdio ? "and suppressing output to" : "writing output to"
          } stdout and stderr`,
        );
        cconsole.debug();
        await runExecutable(job, {
          suppressStdio,
          jobLogger,
        });
      }

      scheduleCronWithExecutable(job, {
        suppressStdio,
        jobLogger,
        label,
        cronxExpression: cronExpression!,
        offset,
      });
    },
  );
