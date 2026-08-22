// index.js
//
// Minimal Matrix client prototype.
// Logs in, listens for messages in rooms you're joined to, and runs every
// incoming message through scanMessage() before "displaying" it (here, just
// printing to console with a warning if it's flagged).
//
// Usage:
//   HOMESERVER=http://localhost:8008 USERNAME=alice PASSWORD=secret npm start

import sdk from "matrix-js-sdk";
import { scanMessage } from "./scamDetector.js";

const HOMESERVER = process.env.HOMESERVER || "http://localhost:8008";
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error("Set USERNAME and PASSWORD env vars (create the account first, see README).");
  process.exit(1);
}

async function main() {
  const loginClient = sdk.createClient({ baseUrl: HOMESERVER });

  const loginRes = await loginClient.login("m.login.password", {
    user: USERNAME,
    password: PASSWORD,
  });

  console.log(`Logged in as ${loginRes.user_id}`);

  const client = sdk.createClient({
    baseUrl: HOMESERVER,
    accessToken: loginRes.access_token,
    userId: loginRes.user_id,
    deviceId: loginRes.device_id,
  });

  client.on("Room.timeline", (event, room) => {
    if (event.getType() !== "m.room.message") return;
    if (event.getSender() === loginRes.user_id) return; // ignore own messages

    const body = event.getContent().body || "";
    const result = scanMessage(body);

    console.log(`\n[${room.name || room.roomId}] ${event.getSender()}: ${body}`);

    if (result.risk === "high") {
      console.log(`  🚨 HIGH RISK — ${result.reasons.join("; ")}`);
    } else if (result.risk === "low") {
      console.log(`  ⚠️  possible risk — ${result.reasons.join("; ")}`);
    }
  });

  await client.startClient({ initialSyncLimit: 10 });
  console.log("Listening for messages... (Ctrl+C to stop)");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
