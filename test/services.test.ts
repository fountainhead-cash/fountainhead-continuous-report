import { Config } from './../Config';

import chai from 'chai';
import * as sinon from 'sinon';
import axios, { AxiosInstance } from 'axios';
import { GrpcClient } from "grpc-bchrpc-node";
import EventSource from 'eventsource';


const toBitDBQuery = (q: object) => Buffer.from(JSON.stringify(q)).toString('base64');

const getTime = () => parseInt((new Date().getTime() / 1000).toFixed(0));

let bchdBlockHeight = null;
let bchdBlockHash = null;
let bchdMedianTime = null;

if (Config.bchdEnabled) describe('#BCHD-status', () => {
    let client = null;

    before(async () => {
        client = new GrpcClient({ url: Config.bchdUrl });
        bchdBlockHeight = (await client.getBlockchainInfo()).getBestHeight();
        bchdBlockHash = Buffer.from((await client.getBlockchainInfo()).getBestBlockHash()).reverse().toString('hex');
        bchdMedianTime = (await client.getBlockchainInfo()).getMedianTime();
    });

    describe('#alive', () => {

        it('correct block time', () => {
            const t = getTime();
            chai.assert.equal(bchdMedianTime > t-10000 && bchdMedianTime < t+10000, true);
        });
    });
});

if (Config.bchdEnabled) describe('#BCHDWEB-status', () => {
    let res = null;

    before(async () => {
        res = await axios.post(`${Config.bchdWebUrl}/v1/GetBlockchainInfo`, {});
    });

    describe('#alive', () => {
        it('http code 200', () => {
            chai.assert.equal(res.status, 200)
        });

        it('has block headers of most recent block', () => {
            chai.assert.equal(res.data.best_height, bchdBlockHeight)
            chai.assert.equal(Buffer.from(res.data.best_block_hash, 'base64').reverse().toString('hex'), bchdBlockHash)
        });
    });
});

if (Config.insomniaEnabled) describe('#INSOMNIA-status', () => {
    let res = null;

    before(async () => {
        res = await axios.get(`${Config.insomniaUrl}/v1/block/headers/668208?count=10`)
    });

    describe('#alive', async () => {
        it('http code 200', () => {
            chai.assert.equal(res.status, 200)
        });

        it('success', () => {
            chai.assert.equal(res.data.success, true);
        });

        it('has block headers of most recent block', () => {
            chai.assert.equal(res.data.headers.length > 0, true);
        });
    });
});

if (Config.bitdbEnabled) describe('#BITDB status', () => {
    let res = null;
    let c = null;

    before(async () => {
        const q = {
            "v": 3,
            "q": {
                "db": ["c"],
                "find": {
                    "blk.i": bchdBlockHeight
                },
                "limit": 1
            }
        };

        res = await axios.get(`${Config.bitdbUrl}/q/${toBitDBQuery(q)}`);
        c = res.data.c;
    });

    describe('#alive', () => {
        it('http code 200', () => {
            chai.assert.equal(res.status, 200)
        });

        it('has transactions on bchd block', () => {
            chai.assert.equal(c.length > 0, true)
        });
    });
});

if (Config.bitsocketEnabled) describe('#BITSOCKET status', () => {
    describe('#alive', async () => {
        const q = {
            "v": 3,
            "q": {
            }
        };

        it('successful message', (done) => {
            const es = new EventSource(`${Config.bitsocketUrl}/s/${toBitDBQuery(q)}`);
            es.onerror = (e) => {
                chai.assert.equal(`onerror ${JSON.stringify(e)}`, 'error');
                done();
            };
            es.onmessage = (e) => {
                chai.assert.equal(JSON.stringify(JSON.parse(e.data)), JSON.stringify(JSON.parse(e.data)));
                es.close();
                done();
            };
        });
    });
});

if (Config.gsppEnabled) describe('#gs++ status', () => {
    let res = null;

    before(async () => {
        const url = `${Config.gsppUrl}/v1/graphsearch/status`;
        res = await axios.post(url, {});
    });

    describe('#alive', () => {
        it('http code 200', () => {
            chai.assert.equal(res.status, 200)
        });

        it('caught up to bchd block', () => {
            chai.assert.equal(res.data.block_height, bchdBlockHeight)
            chai.assert.equal(Buffer.from(res.data.best_block_hash, 'hex').toString('hex'), bchdBlockHash)
        });

        it('zmq txs', () => {
            const t = getTime();
            chai.assert.equal(res.data.last_incoming_zmq_tx_unix > t-1000 && res.data.last_incoming_zmq_tx_unix < t+1000, true);
            chai.assert.equal(res.data.last_outgoing_zmq_tx_unix > t-1000 && res.data.last_outgoing_zmq_tx_unix < t+1000, true);
        });
    });
});

if (Config.slpstreamEnabled) describe('#SLPSTREAM status', () => {
    describe('#alive', async () => {
        const q = {
            "v": 3,
            "q": {
            }
        };

        it('successful message', (done) => {
            const es = new EventSource(`${Config.slpstreamUrl}/s/${toBitDBQuery(q)}`);
            es.onerror = (e) => {
                chai.assert.equal(`onerror ${JSON.stringify(e)}`, 'error');
                done();
            };
            es.onmessage = (e) => {
                chai.assert.equal(JSON.stringify(JSON.parse(e.data)), JSON.stringify(JSON.parse(e.data)));
                es.close();
                done();
            };
        });
    });
});

if (Config.slpdbEnabled) describe('#SLPDB status', () => {
    let res = null;
    let s = null;

    before(async () => {
        const q = {
          "v": 3,
          "q": {
              "db": ["s"],
              "find": {},
              "limit": 1
          }
        };

        res = await axios.get(`${Config.slpdbUrl}/q/${toBitDBQuery(q)}`);
        s = res.data.s[0];
    });

    describe('#alive', () => {
        it('http code 200', () => {
            chai.assert.equal(res.status, 200)
        });

        it('running', () => {
            chai.assert.equal(s.state, 'RUNNING')
        });

        it('block height and hash matches bchd', () => {
            chai.assert.equal(s.bchBlockHeight, bchdBlockHeight);
            chai.assert.equal(s.bchBlockHash, bchdBlockHash);
        });

        it('zmq txs', () => {
            const t = getTime();
            chai.assert.equal(s.lastIncomingTxnZmq.unix > t-1000 && s.lastIncomingTxnZmq.unix < t+1000, true);
            chai.assert.equal(s.lastOutgoingTxnZmq.unix > t-1000 && s.lastOutgoingTxnZmq.unix < t+1000, true);
        });

        it('zmq blocks', () => {
            const t = getTime();
            chai.assert.equal(s.lastIncomingBlockZmq.unix > t-10000 && s.lastIncomingBlockZmq.unix < t+10000, true);
            chai.assert.equal(s.lastOutgoingBlockZmq.unix > t-10000 && s.lastOutgoingBlockZmq.unix < t+10000, true);
        });
    });
});

if (Config.slpdbEnabled) describe('#SLPDB utxo', () => {
    let res = null;
    let c = null;

    before(async () => {
        const q = {
            v: 3,
            q: {
                db: ["c"],
                find: {
                    "slp.valid": true,
                    "slp.detail.tokenIdHex": {
                        "$in": [
                            "4abbea22956e7db07ac3ae7eb88b14f23ccc5dce4273728275cb17ec91e6f57c",
                            "c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479",
                            "4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf",
                            "7853218e23fdabb103b4bccbe6e987da8974c7bc775b7e7e64722292ac53627f",
                            "9fc89d6b7d5be2eac0b3787c5b8236bca5de641b5bafafc8f450727b63615c11"
                        ]
                    },
                    "slp.detail.transactionType": "SEND",
                    "blk.i": { "$gte": bchdBlockHeight - 100 }
                },
                limit: 999999
            }
        };
        res = await axios.get(`${Config.slpdbUrl}/q/${toBitDBQuery(q)}`);
        c = res.data.c;
    });

    describe('#working', () => {

        it('http code 200', () => {
            chai.assert.equal(res.status, 200)
        });


        it('multiple txs', () => {
            chai.assert.equal(c.length > 0, true)
        });
    });
});

if (Config.slpsocketEnabled) describe('#SLPSOCKET status', () => {
    describe('#alive', async () => {
        const q = {
            "v": 3,
            "q": {
            }
        };

        it('successful message', (done) => {
            const es = new EventSource(`${Config.slpsocketUrl}/s/${toBitDBQuery(q)}`);
            es.onerror = (e) => {
                chai.assert.equal(`onerror ${JSON.stringify(e)}`, 'error');
                done();
            };
            es.onmessage = (e) => {
                chai.assert.equal(JSON.stringify(JSON.parse(e.data)), JSON.stringify(JSON.parse(e.data)));
                es.close();
                done();
            };
        });
    });
});
