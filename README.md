# @polyseam/cronx

**chronix or /ˈkrɒnɪks/**

a typescript library and cli for using cron on any platform powered by
[Deno.cron](https://docs.deno.com/examples/cron/)

## cli

### usage

> [!WARNING]
> cronx uses 0-based indexing for days of the week, where 0 is Sunday and 6 is
> Saturday, unlike the 1-based indexing used by Deno.cron()

```bash
cronx 'echo hello world from the future' -n "every tuesday at 3pm"
# ? Do you want to schedule 'echo hello world from the future' to run 'At 3:00 PM on Tuesday'? (Y/n) › 
# ❯ 0 15 * * 2
```

## library

### usage

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

## installation

Shell (Mac, Linux):

```bash
curl -fsSL https://raw.githubusercontent.com/polyseam/cronx/main/install.sh | sh
```

PowerShell (Windows):

```powershell
irm https://raw.githubusercontent.com/polyseam/cronx/main/install.ps1 | iex
```
