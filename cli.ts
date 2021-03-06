#!/usr/bin/env node
import meow from 'meow';
import { calculate, download, history, success, clean, cache } from './index';

interface Flags {
  auth?: string;
  branch?: string;
  concurrency: number;
  json?: boolean;
  last?: number;
  period?: number;
  result?: string;
  since?: number;
  threshold?: number;
}

async function main(argv: string[]) {
  const cli = meow({
    argv,
    help: `
      Usage
        $ build-stats <service>:<user>/<repo> <command> [...opts]

      Commands
        download         Download history for a repository
        calculate        Calculate average build time and success rates over time
        history          List individual builds
        success          Get quick stats of number of success and failed builds
        clean            Delete the downloaded history of repository
        cache            Outputs the directory where data will be cached

      Options
        --auth        [authentication]  (download)  Authentication to access private repo
        --concurrency [number]          (download)  How many parallel downloads should be used when downloading data (Default: 10)
        --since       [buildNumber]     (download)  Overrides the normal logic of which builds to download data for.
                                                    This should only be required in debugging/fixing errors (Default: last downloaded build)
        --branch      [name]            (calculate/history) Which branch(es) to display (Comma-separated list) (Default: *)
        --result      [name]            (calculate/history) Which branch(es) to display (Comma-separated list) (Default: *)
        --period      [days]            (calculate) How many days in a time period to calculate the means for (Default: 1)
        --last        [count]           (calculate) How many periods to calculate back to (Default: 30)
        --threshold   [time]            (calculate) Time under which builds graph is shown in green color. Default is mean of all the builds in that period

      Services
        - bitbucket      Bitbucket Pipelines
        - travis         Travis CI

      Examples
        Download travis builds history to .data folder:
        $ build-stats travis:boltpkg/bolt download

        Download travis builds history to .data folder for private repository:
        $ build-stats travis:boltpkg/bolt download --auth <token>

        Download a subset of builds very quickly:
        $ build-stats travis:boltpkg/bolt download --concurrency=20 --since=300

        Calculate monthly average build time and success rate of a repo over the last year
        $ build-stats travis:boltpkg/bolt calculate

        Calculate daily average build time and success rate of a repo over the last month
        $ build-stats travis:boltpkg/bolt calculate --period 1 --last 30

        Calculate daily average build time and success rate of the master branch of a repo over the last 90 days
        $ build-stats travis:boltpkg/bolt calculate --branch master --period 1 --last 90

        Display build history
        $ build-stats travis:boltpkg/bolt history

        Display build history for master branch for builds that were either successful or failed
        $ build-stats travis:boltpkg/bolt history --branch master --result SUCCESSFUL,FAILED

        Display the number of success and failed builds
        $ build-stats travis:boltpkg/bolt success

        Delete the downloaded history of repository
        $ build-stats travis:boltpkg/bolt clean

        Output the cache directory of a repository
        $ build-stats travis:boltpkg/bolt cache
    `,
    flags: {
      auth: {
        type: 'string'
      },
      branch: {
        type: 'string'
      },
      concurrency: {
        type: 'number',
        default: 10
      },
      json: {
        type: 'boolean'
      },
      last: {
        type: 'number'
      },
      period: {
        type: 'number'
      },
      since: {
        type: 'number'
      }
    }
  });

  if (cli.input.length < 2) {
    cli.showHelp();
  }

  let match = cli.input[0].match(/(.*):(.*)\/(.*)/);

  if (!match) {
    throw new Error(
      `Invalid repo "${cli.input[0]}", should be "host:user/repo"`
    );
  }

  let [, host, user, repo]: string[] = match;
  let command: string = cli.input[1];
  let flags: Flags = cli.flags;
  let cwd: string = __dirname;

  if (command === 'download') {
    await download({
      cwd,
      host,
      user,
      repo,
      auth: flags.auth,
      concurrency: flags.concurrency,
      since: flags.since
    });
  } else if (command === 'calculate') {
    await calculate({
      cwd,
      host,
      user,
      repo,
      branch: flags.branch,
      result: flags.result,
      period: flags.period,
      last: flags.last,
      threshold: flags.threshold,
      json: flags.json
    });
  } else if (command === 'history') {
    await history({
      cwd,
      host,
      user,
      repo,
      branch: flags.branch,
      result: flags.result,
      threshold: flags.threshold,
      json: flags.json
    });
  } else if (command === 'success') {
    await success({
      cwd,
      host,
      user,
      repo,
      branch: flags.branch,
      result: flags.result,
      period: flags.period,
      last: flags.last,
      json: flags.json
    });
  } else if (command === 'clean') {
    await clean({
      cwd,
      host,
      user,
      repo
    });
  } else if (command === 'cache') {
    await cache({ cwd, host, user, repo });
  } else {
    throw new Error(
      `Unknown command "${command}", should be "download", "calculate", "history", "success", "clean", "cache"`
    );
  }
}

main(process.argv.slice(2)).catch(err => {
  console.error(err);
  process.exit(1);
});
