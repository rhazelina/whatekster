const WhatsAppClient = require("./wa-client")
const path = require("path")
const fs = require("fs")

let pathLocation = "./auth"
const authIndex = process.argv.indexOf("--auth")
if(authIndex !== -1) {
  const data = process.argv[authIndex + 1]
  if(!data || data.startsWith("-")) {
    console.error("Error: The --auth flag requires a folder location argument.")
    process.exit(1)
  }
  pathLocation = path.normalize(data)
  if(!fs.existsSync(pathLocation)) {
    try {
      fs.mkdirSync(pathLocation, { recursive: true })
    } catch (err) {
      console.error(`Error make directory: ${err.message}`)
    }
  }
}

const waNew = new WhatsAppClient({
  authlocation: pathLocation
})

function WhatsAppMiddleware(req, res, next) {
  req.whatsapp = waNew
  req.wasock = waNew._socket

  res.setHeader("X-Powered-By", "Temulawak Goreng Tech")
  next()
}

module.exports = WhatsAppMiddleware