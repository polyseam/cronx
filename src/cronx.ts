import { Command, ValidationError } from "@cliffy/command";
import { Input, Select } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";
import deno_json from "../deno.json" with { type: "json" };

import {
  CronxNlp,
  TimeFormat,
} from "./nlp.ts";

export const cronx = new Command().name("cronx")
  .description("A crontab expression generator with natural language support.")
  .version(deno_json.version)
  .option("-t, --tab <tab:string>", "The crontab for your workload")
  .option(
    "-n, --natural <description:string>",
    "Natural language description of schedule (e.g., 'every day at 2pm')",
  )
  .option(
    "--time-format <format:string>",
    " 24h or 12h format when outputting natural language schedule",
    {
      action: ({ timeFormat }) => {
        if (!timeFormat) return;
        if (timeFormat !== "12h" && timeFormat !== "24h") {
          throw new ValidationError(
            "Invalid time format. Must be '12h' or '24h'",
          );
        }
      },
    },
  )
  .option("--oxford-comma", "Whether to use the Oxford comma", {
    default: true,
  })
  .arguments("<job>")
  .action(async (options, job) => {
    const {
      tab,
      natural,
      timeFormat,
      oxfordComma,
    } = options;

    const cronxNlp = new CronxNlp({
      timeFormat: timeFormat as TimeFormat,
      useOxfordComma: oxfordComma,
    });

    let cronExpression = tab;

    // If a natural language description is provided, parse it
    if (natural) {
      try {
        cronExpression = cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(natural);
        console.log(
          `${colors.green("✓")} Parsed natural language: "${
            colors.cyan(natural)
          }"`,
        );
        console.log(
          `${colors.green("✓")} Generated cron expression: ${
            colors.yellow(cronExpression)
          }`,
        );
      } catch (error) {
        console.error(
          `${colors.red("✗")} Failed to parse natural language: ${error}`,
        );
        Deno.exit(1);
      }
    }

    // If no tab or natural language provided, prompt user
    if (!cronExpression) {

        const selected = await Select.prompt({
          message: `How often do you want to run '${colors.cyan(job)}' ?`,
          options: [
            { name: "Every minute", value: "* * * * *" },
            { name: "Every hour", value: "0 * * * *" },
            { name: "Every day at midnight", value: "0 0 * * *" },
            { name: "Every 15 minutes", value: "*/15 * * * *" },
            { name: "Every 30 minutes", value: "*/30 * * * *" },
            { name: "Every Sunday at 12am", value: "0 0 * * 0" },
            {
              name: "First day of every month",
              value: "0 0 1 * *",
            },
            {name: "Write your own schedule...", value: "custom"},
          ],
        });

        if(selected === 'custom'){
            cronExpression = await Input.prompt({
                message: "Write your schedule in plain language",
                hint: "e.g., 'every day at 2pm'",
            })
        } else {
            cronExpression = selected;
        }
      
    }

    // Process and display the final crontab
    console.log(
      `${colors.green("➤")} Crontab for ${colors.cyan(job)}: ${
        colors.yellow(cronExpression)
      } ${(colors.magenta(
        cronxNlp.getNaturalLanguageScheduleForCronTabExpression(cronExpression),
      ))}`,
    );

    console.log();

    return {
      job,
      cronExpression,
    };
  });
