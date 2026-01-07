require("../lib/dotenv")
const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, Browsers } = require("@whiskeysockets/baileys")
const WhatsAppClient = require("@whiskeysockets/baileys").default
const qrTerminal = require("qrcode-terminal")
const qrcode = require("qrcode")
const P = require("pino")
const fs = require("fs")
const path = require("path")

const defaultSettings = {
  version: null,
  browser: Browsers.ubuntu("ARM64")
}

class WhatsAppClientSocket {
  constructor({ setting = defaultSettings, authlocation = "" }) {
    this._setting = setting
    this._info = {
      qr: null,
      qrImg: null,
      ready: false,
      problem: null,
    }
    this._authlocation = authlocation || "./auth"
    this._socket = null
    this._paircode = null
    this._WhatsAppInit()
  }
  async _WhatsAppInit() {
    console.log("[WhatsApp]: Setup...")
    const version = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(this._authlocation)
    const socket = WhatsAppClient({
      auth: state,
      logger: P({ level: "silent" }),
      printQRInTerminal: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      version: this._setting?.version || version?.version,
      browser: this._setting?.browser,
    })
    socket.ev.on("creds.update", saveCreds)
    socket.ev.on("connection.update", async (conn) => {
      const { connection, lastDisconnect, qr } = conn
      this._info.problem = null
      if(connection === "close") {
        const tryConnect = lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;
        // Return Info
        this._info.ready = false
        this._info.problem = lastDisconnect.error

        console.log("[WhatsApp]:", lastDisconnect.error)

        if(lastDisconnect.error?.data?.reason === "405" && fs.existsSync(this._authfolder+"/creds.json")) {
          console.log("[WhatsApp]: Authentication Has Bad, Try Remove Authentication Folder And Try Sign In!")
          this._info.problem = "Authentication Has Bad, Try Remove Authentication Folder And Try Sign In!"
        }

        if(tryConnect) {
          console.log("[WhatsApp]: Reconnect...")
          await new Promise(a => setTimeout(a, 3000))
          this._WhatsAppInit()
        } else {
          console.log("[WhatsApp]: Exit!...")
          process.exit(1)
        }
      }
      if(connection === "open") {
        this._info = {
          qr: null,
          qrImg: null,
          ready: true,
          problem: null,
        }
        console.log("[WhatsApp]: Login...")
      }
      if(typeof qr === "string") {
        console.log("[WhatsApp]: New QRCode Scan...")
        this._info.qr = qr
        this._info.qrImg = await qrcode.toDataURL(qr)
        this._info.ready = false

        if(process.env.ENABLE_QRCODE_CLI) {
          qrTerminal.generate(qr, { small: true })
        }
      }
    })
    this._socket = socket
  }
  _handleCrashProcess() {
    if(!!this._paircode) {
      console.log("[Warning!]: Oh noo!!!, After request pairing code, you can signin again with this authentication, there is only one solution, and that is to remove authentication!")
      console.log("[Warning]: Removeing Authentication...")
      fs.rmSync(path.join(this._authfolder), { recursive: true, force: true })
      console.log("[Warning]: Done, try restart!")
    }
    console.log("Exit...")
    process.exit()
  }
}

module.exports = WhatsAppClientSocket