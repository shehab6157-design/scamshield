# ScamShield — Messenger Prototype

A minimal, working starting point: a local encrypted-messaging homeserver
(Dendrite, the Matrix protocol) plus a Node.js client that scans incoming
messages for scam/phishing signals before showing them.

This is intentionally bare-bones — the goal is to prove the full pipeline
works (server → message → scan → display) before any UI work.

## What's here

- `docker-compose.yml` — spins up a local Dendrite homeserver + Postgres
- `client/index.js` — connects, listens for messages, runs them through the scanner
- `client/scamDetector.js` — the scam-detection logic (currently a rule-based
  stub — this is where your real phishing-detection model plugs in later)

## Step 1: Start the homeserver

```bash
# First time only — generates the server config
docker compose run --rm generate-config

# Start the server
docker compose up -d

# Check it's alive
curl http://localhost:8008/_matrix/client/versions
```

## Step 2: Create two test accounts

Dendrite's registration is open by default in dev mode. Register two users
(you'll need `curl` or a Matrix client) — easiest is via the admin API:

```bash
docker compose exec dendrite /usr/bin/create-account \
  --config /etc/dendrite/dendrite.yaml \
  --username alice --password "test1234"

docker compose exec dendrite /usr/bin/create-account \
  --config /etc/dendrite/dendrite.yaml \
  --username bob --password "test1234"
```

## Step 3: Install client dependencies

```bash
cd client
npm install
```

## Step 4: Run the client as each user (two terminals)

Terminal 1:
```bash
HOMESERVER=http://localhost:8008 USERNAME=alice PASSWORD=test1234 npm start
```

Terminal 2:
```bash
HOMESERVER=http://localhost:8008 USERNAME=bob PASSWORD=test1234 npm start
```

## Step 5: Create a room and message between them

Easiest way for now: use a real Matrix client (e.g. Element web, pointed at
`http://localhost:8008` as a custom homeserver) logged in as alice, create a
room, invite bob, and send messages. Your `index.js` clients running in the
terminals will pick up and scan every message live.

Try sending a message like:
```
Your account is suspended! Click here immediately: http://192.168.1.1/verify
```
and watch it get flagged as high risk in the terminal.

## Next steps (see the roadmap)

1. Replace `scanMessage()` internals in `scamDetector.js` with your real
   phishing-detection model/logic.
2. Build a real UI (start with a web client using `matrix-js-sdk` in the
   browser — reuse the same connection logic as `index.js`).
3. Move the homeserver from `localhost` to a real VPS + domain so it's
   reachable from outside your machine.
4. Add invite links/QR codes so new users can join without manual account
   creation.

## Notes

- E2E encryption: this prototype uses unencrypted rooms for simplicity while
  you're testing locally. Matrix's encryption (Olm/Megolm) is a config flag
  away once the basic pipeline is solid — don't add that complexity until
  send/receive/scan is working reliably.
- Don't expose this Dendrite instance to the internet as-is — it's dev config
  with default settings, not hardened for production.
