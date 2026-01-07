const {
  getAggregateVotesInPollMessage,
  useMultiFileAuthState,
  getWAUploadToServer,
  fetchLatestBaileysVersion,
  DisconnectReason,
  proto,
  Browsers,
} = require("@whiskeysockets/baileys")

async function A() {
  const a = await fetchLatestBaileysVersion()
  console.log(a)
}
A()