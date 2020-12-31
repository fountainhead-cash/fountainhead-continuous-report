import { Config } from './Config';
import { Log } from './Log';
import  { exec } from 'child_process';
import * as fs from 'fs'; 
import mailgun from 'mailgun-js';

const mailer = mailgun({ apiKey: Config.mailgunApiKey, domain: Config.mailgunDomain });

const getTime = () => parseInt((new Date().getTime() / 1000).toFixed(0));

let lastMailedTime = 0;


(async () => {
    while (true) {
        Log.debug('Beginning test run');
        await new Promise((resolve, reject) => {
            exec('yarn test', (err, stdout, stderr) => {
                const data = JSON.parse(fs.readFileSync('./mochawesome-report/mochawesome.json').toString('utf-8'));

                if (data.stats.failures > 0) {
                    Log.error(`${data.stats.failures} failures`);

                    if (lastMailedTime < getTime() - (60*30)) {
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

                        lastMailedTime = getTime();
                    } else {
                        Log.debug(`Not mailing because it hasn't been very long since last mail`);
                    }

                } else {
                    Log.debug('All tests passed');
                }

                // 1 second delay in case something funny happens
                setTimeout(() => resolve(true), 1000 * 1);
            });
        });
    }
})();

