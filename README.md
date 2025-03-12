# @polyseam/cronx

**chronix or /ˈkrɒnɪks/**

a typescript library and cli for using cron on any platform powered by
[Deno.cron](https://docs.deno.com/examples/cron/)

## cli

### usage

```bash
cronx 'echo hello world from the future' -n "every tuesday at 3pm"
# ? Do you want to schedule 'echo hello world from the future' to run 'At 3:00 PM on Tuesday'? (Y/n) › 
# ❯ 0 15 * * 2
```

### installation

Shell (Mac, Linux):

```bash
curl -fsSL https://raw.githubusercontent.com/polyseam/cronx/main/install.sh | sh
```

PowerShell (Windows):

```powershell
irm https://raw.githubusercontent.com/polyseam/cronx/main/install.ps1 | iex
```

## library

### nlp

The `nlp` module provides functions for converting between natural language and
cron tab expressions.

```typescript
import { 
    getCronTabExpressionForNaturalLanguageSchedule,
    getNaturalLanguageScheduleForCronTabExpression
} from '@polyseam/cronx/nlp'

const cronTab = getCronTabExpressionForNaturalLanguageSchedule('wednesdays and fridays at 3:30pm')
console.log(cronTab) // 30 15 * * 3,5

const naturalLanguage = getNaturalLanguageScheduleForCronTabExpression('0 15 * * 2')
console.log(naturalLanguage) // At 3:30 PM on Wednesday and Friday

Deno.cron('my job', cronTab, () => {
    console.log("don't miss your meeting!')
})
```

### cronx

The `cronx` module provides a simple interface for scheduling cron jobs with
command-line executables or async functions.

```typescript
import {
  scheduleCronWithExecutable,
  scheduleCronWithFunction,
} from "@polyseam/cronx";

const expression = "0 15 * * 2"; // every tuesday at 3pm local time
const executable = 'echo "hello world from the future"';

scheduleCronWithExecutable(executable, {
  cronxExpression: expression,
  label: "hello-world",
});

scheduleCronWithFunction(async () => {
  const res = await fetch("https://api.example.com");
  if (res.ok) {
    console.log("service is live!");
  } else {
    console.log("service is down!");
  }
}, {
  cronxExpression: "* 0,8,16 * * *", // every 8 hours
  label: "uptime",
  offset: 0, // UTC time is offset=0
});
```

### cron

The `cron` module provides helpers for taking user friendly cron expressions and
converting them to [Deno.cron]() compatible expressions.

```typescript
import {
  convertCronxExpressionToDenoCronExpression,
  getLocalUTCOffset,
} from "@polyseam/cronx/cron";

const worknights = "0 21 * * 0-4"; // Sunday is 0, unlike in Deno.cron

const timezoneAdjustedCronExpression =
  convertCronxExpressionToDenoCronExpression(
    worknights,
    getLocalUTCOffset(),
  );

Deno.cron("set-alarms", timezoneAdjustedCronExpression, () => {
  console.log("don't forget to set your alarms for tomorrow!");
});
```
