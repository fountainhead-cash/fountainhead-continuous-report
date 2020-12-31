require('dotenv').config();

import bitcore from 'bitcore-lib-cash';
import { BigNumber } from 'bignumber.js';

export interface ServerConfig {
    mailgunApiKey: string;
    mailgunDomain: string;
    mailgunFrom: string;
    mailgunTo: string;

    bchdEnabled: boolean;
    bitdbEnabled: boolean;
    bitsocketEnabled: boolean;
    slpdbEnabled: boolean;
    slpsocketEnabled: boolean;
    gsppEnabled: boolean;
    slpstreamEnabled: boolean;
    insomniaEnabled: boolean;

    bchdUrl: string;
    bchdWebUrl: string;
    bitdbUrl: string;
    bitsocketUrl: string;
    slpdbUrl: string;
    slpsocketUrl: string;
    gsppUrl: string;
    slpstreamUrl: string;
    insomniaUrl: string;
}

const Config: ServerConfig = {
    mailgunApiKey: process.env.MAILGUN_API_KEY,
    mailgunDomain: process.env.MAILGUN_DOMAIN,
    mailgunFrom: process.env.MAILGUN_FROM,
    mailgunTo: process.env.MAILGUN_TO,

    bchdEnabled:      true,
    bitdbEnabled:     true,
    bitsocketEnabled: true,
    slpdbEnabled:     true,
    slpsocketEnabled: true,
    gsppEnabled:      true,
    slpstreamEnabled: true,
    insomniaEnabled:  true,

    bchdUrl: "bchd.fountainhead.cash:443",
    bchdWebUrl: "https://bchd.fountainhead.cash",
    bitdbUrl: "https://bitdb.fountainhead.cash",
    bitsocketUrl: "https://bitsocket.fountainhead.cash",
    slpdbUrl: "https://slpdb.fountainhead.cash",
    slpsocketUrl: "https://slpsocket.fountainhead.cash",
    gsppUrl: "https://gs.fountainhead.cash",
    slpstreamUrl: "https://slpstream.fountainhead.cash",
    insomniaUrl: "https://insomnia.fountainhead.cash",
};

export { Config };
