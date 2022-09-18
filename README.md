# After the coin listing, don't forget to change the value of TLC (1 TLC = 0.04 USDT)

# USDT to TLC swap backend

## Project setup

```
npm install
```

## Configure

Copy `.env.example` to `.env`

```
PORT=8080                                              # server port
DB=mongodb://localhost:27017/db                        # mongodb
APP_URL=http://localhost:3000                          # Frontend URL
BSC_RPC=https://data-seed-prebsc-1-s1.binance.org:8545 # bsc testnet rpc
TLC_RPC=https://mainnet-rpc.tlxscan.com                # tlx mainnet rpc
OWNER_ADDRESS=                                         # owner wallet address
PRIV_KEY=                                              # owner private key
```

### Run server

```
npm start
```

### Run cron job

```
npm run cron
```
