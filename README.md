# @polyseam/cronx

**chronix or /ˈkrɒnɪks/**

a typescript library and cli for using cron on any platform powered by
[Deno.cron](https://docs.deno.com/examples/cron/)

### cli installation

Shell (Mac, Linux):

```bash
curl -fsSL https://raw.githubusercontent.com/polyseam/cronx/main/install.sh | sh
```

PowerShell (Windows):

```powershell
irm https://raw.githubusercontent.com/polyseam/cronx/main/install.ps1 | iex
```

## usage

### cli

```bash
cronx 'echo hello world from the future' -n "every tuesday at 3pm"
# ? Do you want to schedule 'echo hello world from the future' to run 'At 3:00 PM on Tuesday'? (Y/n) › 
# ❯ 0 15 * * 2

# backup file every friday at 8pm
cronx 'cp /path/to/file.txt "/path/to/backup/$(date +%G-W%V)"' -t "0 20 * * 5" -l "file-backup"
```

### library

The [@polyseam/cronx](https://jsr.io/@polyseam/cronx) module provides a simple
interface for scheduling cron jobs with command-line executables or async
functions.

```typescript
import {
  CronTabExpression,
  scheduleCronWithExecutable,
  scheduleCronWithFunction,
} from "@polyseam/cronx";

// Schedule a job to run at 9 AM Eastern Time (UTC-5)
scheduleCronWithExecutable('echo "Good morning East Coast!"', {
  cronTabExpression: "0 9 * * *", // crontab literal or new CronTabExpression("0 9 * * *")
  label: "east-coast-morning",
  offset: -5, // Eastern Time (UTC-5)
});

const mondayAt9am = CronTabExpression.fromNaturalLanguageSchedule(
  "every monday at 9am",
);

// Schedule a job to run at 9 AM Pacific Time (UTC-8)
scheduleCronWithExecutable('echo "Happy Monday morning West Coast!"', {
  cronTabExpression: mondayAt9am,
  label: "west-coast-morning",
  offset: -8, // Pacific Time (UTC-8)
});

const atNoon = CronTabExpression.fromNaturalLanguageSchedule(
  "every day at noon",
);

// Use local machine timezone (default behavior)
scheduleCronWithFunction(async () => {
  console.log("Running in local timezone");
}, {
  cronTabExpression: atNoon, // 12:00 PM every day
  label: "local-noon",
  // offset parameter omitted - will use local machine's timezone
});

scheduleCronWithFunction(async () => {
  const res = await fetch("https://api.example.com");
  if (res.ok) {
    console.log("service is live!");
  } else {
    console.log("service is down!");
  }
}, {
  cronxExpression: new CronTabExpression("* 0,8,16 * * *"), // every 8 hours
  label: "uptime",
  offset: 0, // UTC time is offset=0
  logLevel: "DEBUG", // Optional log level for cronx's internal logging
});
```
