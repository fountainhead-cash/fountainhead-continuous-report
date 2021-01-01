import { Config } from './Config';
import { Log } from './Log';
import  { exec } from 'child_process';
import * as fs from 'fs'; 
import mailgun from 'mailgun-js';

const mailer = mailgun({ apiKey: Config.mailgunApiKey, domain: Config.mailgunDomain });

const getTime = () => parseInt((new Date().getTime() / 1000).toFixed(0));

let lastMailedTime = 0;
let lastRunFailed = false;


(async () => {
    while (true) {
        Log.debug('Beginning test run');
        await new Promise((resolve, reject) => {
            exec('yarn test', (err, stdout, stderr) => {
                const data = JSON.parse(fs.readFileSync('./mochawesome-report/mochawesome.json').toString('utf-8'));

                for (const suite of data.results.map(v => v.suites)[0]) {
                    for (const tests of suite.suites.map(v => v.tests)) {
                        for (const test of tests) {
                            if (test.timedOut) {
                                Log.error(`TIMEOUT: ${test.fullTitle}`);
                            } else if (test.fail) {
                                Log.error(`FAIL: ${test.fullTitle}`);
                            }
                        }
                    }
                }

                if (data.stats.failures > 0) {
                    Log.error(`${data.stats.failures} failures`);

                    if (lastMailedTime < getTime() - (Config.emailFrequencySeconds)) {
                        if (lastRunFailed) {
                            if (Config.sendMail) {
                                Log.debug(`Preparing email`);
                                Log.debug(`${JSON.stringify(data)}`);

                                const mailData = {
                                    from: Config.mailgunFrom,
                                    to: Config.mailgunTo,
                                    subject: `FOUNTAINHEAD ${data.stats.failures} ERRORS DETECTED`,
                                    text: JSON.stringify(data, null, 2),
                                };

                                mailer.messages().send(mailData, (err, body) => {
                                    Log.info(`Mailer: ${JSON.stringify(body)}`);
                                });
                            }
                            lastMailedTime = getTime();
                        } else {
                            Log.debug(`Not mailing because previous run didn't fail`);
                        }
                    } else {
                        Log.debug(`Not mailing because it hasn't been very long since last mail`);
                    }

                    lastRunFailed = true;

                } else {
                    Log.debug('All tests passed');
                    lastRunFailed = false;
                }

                // 1 second delay in case something funny happens
                setTimeout(() => resolve(true), 1000 * Config.runDelaySeconds);
            });
        });
    }
})();

