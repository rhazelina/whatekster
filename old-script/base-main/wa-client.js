// Copy Code (Matching) By: https://github.com/ernestoyoofi/wa-client/blob/main/lib/wa.js
// Modifiy If You Need
const {
  getAggregateVotesInPollMessage,
  useMultiFileAuthState,
  getWAUploadToServer,
  fetchLatestBaileysVersion,
  DisconnectReason,
  proto,
  Browsers,
} = require("@whiskeysockets/baileys")
const WhatsAppClient = require("@whiskeysockets/baileys").default
const qrcodeTerimal = require("qrcode-terminal")
const qrcode = require("qrcode")
const P = require("pino")
const fs = require("fs")
const path = require("path")

const defaultSetting = {
  version: [ 2, 3000, 1031714797 ], // WhatsApp Beta Version!
  browser: Browsers.ubuntu("Arm64") // Windows Dekstop Client!
}

class WhatsAppClientWS {
  constructor({ setting = defaultSetting, authFolder }) {
    this._setting = setting
    this._setup = {
      qr: null,
      isReady: false,
      problem: null,
      problemLib: false
    }
    this._authfolder = authFolder
    this._socketing = null
    this._paircode = null
    this.WhatsappClientStartUp()

    process.on("exit", this._handleCrashProcess)
    process.on("SIGINT", this._handleCrashProcess)
    process.on("SIGTERM", this._handleCrashProcess)
  }
  // Client
  async WhatsappClientStartUp() {
    const { state, saveCreds } = await useMultiFileAuthState(this._authfolder)
    const socket = WhatsAppClient({
      auth: state,
      logger: P({ level: "silent" }),
      printQRInTerminal: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      version: this._setting.version,
      browser: this._setting.browser,
    })
    socket.ev.on("creds.update", saveCreds)
    socket.ev.on("connection.update", async (conn) => {
      const { connection, lastDisconnect, qr } = conn
      if(connection === "close") {
        const tryConnect = lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
        this._setup.isReady = false
        this._setup.qr = null
        this._setup.problemLib = !tryConnect
        console.error("Socket connection error!", lastDisconnect.error)
        if(lastDisconnect.error?.data?.reason === "405" && fs.existsSync(this._authfolder+"/creds.json")) {
          console.log("Authentication Has Bad, Try Remove Authentication Folder And Try Sign In!")
        }
        if(tryConnect) {
          await new Promise(a => setTimeout(a, 3000)) // Sleep 3s
          this.WhatsappClientStartUp() // Starting Again... 
        } else {
          this._setup.problemLib = true
          this._setup.problem = `Please Remove Authentication Folder ${this._authfolder} And Try Signup Again, If Don't Work Please Check Library Update Or Log Error!`
          await new Promise(a => setTimeout(a, 10000)) // Sleep 10s
          // On This Error, Please Remove Authentication Or Try Check Your Client!
        }
      }
      if(connection === "open") {
        this._setup.isReady = true
        console.log("Success Login To WhatsApp!")
      }
      if(typeof qr === "string") {
        this._setup.qr = await qrcode.toDataURL(qr)
        console.log("Login With This QRCode...")
        qrcodeTerimal.generate(qr, { small: true })
      }
    })
    this._socketing = socket
    Object.keys(socket).forEach(key => {
      this[key] = socket[key]
    })
  }
  // Request Pairing Code
  // On This Request, Change Your Version & Browser To Linux Browser (No Dekstop Windows)
  async requestPairingConnection(phoneNumber) {
    if(!this._socketing) {
      return { error: "Client No Startup!", code: 400 }
    }
    if(typeof this._setup.qr !== "string") {
      return { error: "Need Connection Generate To Pairing Code!", code: 400 }
    }
    try {
      if(this._paircode) {
        return {
          pairing: this._paircode.code,
          phone: this._paircode.phone
        }
      }
      const phoneNum = String(phoneNumber).replace(/\D/g,"")
      const codePairing = await this._socketing.requestPairingCode(phoneNum)
      this._paircode = {
        code: codePairing,
        phone: phoneNum
      }
      return { pairing: String(codePairing), phone: phoneNum }
    } catch(e) {
      return { error: `Bad Request Services ${e.message}`, code: 503 }
    }
  }
  // WhatsApp Client Status
  getStatusClient() {
    return this._setup
  }
  // Send Message
  async sendMessage(...params) {
    return await this._socketing.sendMessage(...params)
  }
  // Handle Crashing By Signin
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



module.exports = WhatsAppClientWS