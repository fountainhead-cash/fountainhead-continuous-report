import { Config } from './Config';
import { Log } from './Log';
import  { exec } from 'child_process';
import * as fs from 'fs'; 
import mailgun from 'mailgun-js';

const mailer = mailgun({ apiKey: Config.mailgunApiKey, domain: Config.mailgunDomain });

(async () => {
    while (true) {
        Log.debug('Beginning test run');
        await new Promise((resolve, reject) => {
            exec('yarn test', (err, stdout, stderr) => {
                const data = JSON.parse(fs.readFileSync('./mochawesome-report/mochawesome.json').toString('utf-8'));

                if (data.stats.failures > 0) {
                    Log.error(`${data.stats.failures} failures`);

                    const mailData = {
                        from: Config.mailgunFrom,
                        to: Config.mailgunTo,
                        subject: `FOUNTAINHEAD ${data.stats.failures} ERRORS DETECTED`,
                        text: JSON.stringify(data, null, 2),
                    };

                    mailer.messages().send(mailData, (err, body) => {
                        Log.info(`Mailer: ${JSON.stringify(body)}`);
                    });

                } else {
                    Log.debug('All tests passed');
                }

                setTimeout(() => resolve(true), 1000 * 60 * 10);
            });
        });
    }
})();

