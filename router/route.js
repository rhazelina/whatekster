const route = require("express").Router()
const baseToBuf = require("../lib/base-to-buf")

route.get("/status", (req, res) => {
  if(!!req.query?.qrcode_img) {
    if(!req.whatsapp?._info?.qrImg) {
      res.setHeader("Content-Type", "text/txt")
      return res.status(200).send("")
    }
    res.setHeader("Content-Type", "image/png")
    return res.status(200).send(
      baseToBuf(req.whatsapp?._info?.qrImg)
    )
  }
  return res.status(200).json({
    data: {
      ready: req.whatsapp?._info?.ready || true,
      problem: req.whatsapp?._info?.problem || null,
      qrcode: req.whatsapp?._info?.qr || null,
      qrcode_img: req.whatsapp?._info?.qrImg || null,
    }
  })
})

route.post("/send-message", async (req, res) => {
  try {
    const { to, message, media_url, media_type } = req.body

    const phone = String(to).replace(/[^\d]/g, "")
    const chatId = phone.endsWith("@s.whatsapp.net") ? phone : `${phone}@s.whatsapp.net`

    if(!message || typeof message !== "string") {
      return res.status(400).json({
        message: "Need Message Sending!"
      })
    }

    let structureMessage = {}

    if(!!media_url && !!media_type) {
      structureMessage["caption"] = String(message)
    } else {
      structureMessage["text"] = String(message)
    }

    if(!!media_type && !["image","video","sticker","document","audio"].includes(media_type)) {
      return res.status(400).json({
        message: "Media type is not valid, only image,video,sticker,document and audio"
      })
    } else {
      if(!!media_type && !!media_url) {
        if(!!String(media_url).startsWith("http")) {
          structureMessage[media_type] = {
            url: String(media_url)
          }
        } else {
          structureMessage[media_type] = baseToBuf(media_url)
        }
      }
    }
    
    const sendAPI = await req.wasock.sendMessage(chatId, structureMessage)
    console.log(structureMessage)
    return res.status(200).json({
      message: "Success!",
      data: sendAPI
    })
  } catch(e) {
    console.log(e)
    return res.status(500).json({
      message: "Internal server error"
    })
  }
})

module.exports = route