const express = require("express")
const cors = require("cors")
const WhatsappClient = require("./wa-client")
const base64ToBuffer = require("./base64-to-buffer")

const app = express()
const port = process.env.PORT || 3001
app.use(express.json())


const whatsapp = new WhatsappClient({
  authFolder: `${process.cwd()}/auth`,
})

// SCAN QRCODE
app.get("/api/wa/qr", (req, res) => {
  const requestStatus = whatsapp.getStatusClient()
  res.status(200).json(requestStatus)
})

// PAIRING CODE
app.get("/api/wa/pairing", async (req, res) => {
  if(!req.query?.phone) {
    return res.status(400).json({ error: "Can't pairing without phone number!" })
  }
  const pairingReq = await whatsapp.requestPairingConnection(req.query.phone)
  res.status(pairingReq.code || (pairingReq.error? 400:200)).json(pairingReq)
})

// SEND MESSAGE TEXT
app.post("/api/wa/send-text", async (req, res) => {
  try {
    const { to, message } = req.body
    const phone = String(to).replace(/[^\d]/g, "") // fixing numeric only
    const chatId = phone.endsWith("@c.us") ? phone : `${phone}@c.us`
    // const chatId = to.endsWith('@c.us') ? to : `${to}@c.us` // original code
    if(!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Need Message Sending!"
      })
    }
    const messageData = await whatsapp.sendMessage(chatId, {
      text: message
    })
    return res.status(200).json({
      status: "message_sent",
      wa: messageData
    })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

// SEND MESSAGE MEDIA
// app.post("/api/wa/send-media", async (req, res) => {
//   try {
//     const { to, mediaBase64, filename, caption } = req.body
//     const listAllowing = ["c.us","g.us","s.whatsapp.net"] // c.us or s.whatsapp.net is attribute host for user/private account, for g.us is for group / community
//     const chatId = to.endsWith('@c.us') ? to : `${to}@c.us`
//     if(!listAllowing.includes(chatId?.split("@")[1])) {
//       return res.status(400).json({
//         error: `${listAllowing.join(",")} only allowing!`
//       })
//     }
//     const matches = mediaBase64.match(/^data:(.+);base64,(.+)$/)
//     const bufferBase64 = base64ToBuffer(mediaBase64)
//     const mimeType = matches[1]
//     const typeMedia = mimeType.split("/")[0]
//     const mediaContext = ["image","video"]
//     const buildMessage = mediaContext.includes(typeMedia)? {
//       [typeMedia]: bufferBase64 // Send Media, image and video
//     }:{
//       document: bufferBase64, // Send Document
//       mimetype: mimeType,
//       filename: filename,
//     }
//     const messageData = await whatsapp.sendMessage(chatId, {
//       ...buildMessage,
//       caption: caption, // Caption!
//       sendEphemeral: req.query.useChatSet? 'chat':undefined // Experimental Code (Disappire Message)
//     })
//     return res.status(200).json({
//       status: "media_sent",
//       wa: messageData
//     })
//   } catch(e) {
//     res.status(500).json({ error: e.message })
//   }
// })

// app.post("/api/wa/send-media", async (req, res) => {
//   try {
//     const { to, mediaBase64, filename, caption } = req.body;
//     const listAllowing = ["c.us", "g.us", "s.whatsapp.net"];

//     // Validasi nomor tujuan
//     const chatId = to.endsWith('@c.us') ? to : `${to}@c.us`;
//     if (!listAllowing.includes(chatId?.split("@")[1])) {
//       return res.status(400).json({ error: `Hanya ${listAllowing.join(",")} yang diperbolehkan!` });
//     }

//     // **Perbaikan validasi mediaBase64**
//     if (!mediaBase64 || typeof mediaBase64 !== "string") {
//       return res.status(400).json({ error: "mediaBase64 harus berupa string valid!" });
//     }

//     // **Validasi format Base64**
//     const matches = mediaBase64.match(/^data:(.+);base64,(.+)$/);
//     if (!matches || matches.length < 3) {
//       return res.status(400).json({ error: "Format mediaBase64 tidak valid!" });
//     }

//     const mimeType = matches[1];
//     const typeMedia = mimeType.split("/")[0];
//     const bufferBase64 = base64ToBuffer(matches[2]); // **Gunakan matches[2] untuk mendapatkan data Base64 murni**

//     // Menentukan tipe media
//     const mediaContext = ["image", "video"];
//     const buildMessage = mediaContext.includes(typeMedia)
//       ? { [typeMedia]: bufferBase64 } // Kirim gambar atau video
//       : {
//           document: bufferBase64, // Kirim dokumen
//           mimetype: mimeType,
//           filename: filename || "file", // Gunakan default filename jika tidak diberikan
//         };

//     // Kirim pesan ke WhatsApp
//     const messageData = await whatsapp.sendMessage(chatId, {
//       ...buildMessage,
//       caption: caption || "", // Gunakan default caption jika tidak diberikan
//       sendEphemeral: req.query.useChatSet ? 'chat' : undefined, // Pesan sementara jika diaktifkan
//     });

//     return res.status(200).json({
//       status: "media_sent",
//       wa: messageData,
//     });
//   } catch (error) {
//     console.error("Error saat mengirim media:", error);
//     res.status(500).json({ error: error.message || "Terjadi kesalahan saat mengirim media." });
//   }
// });

app.post("/api/wa/send-media", async (req, res) => {
  try {
    const { to, mediaBase64, filename, caption } = req.body;
    const listAllowing = ["c.us", "g.us", "s.whatsapp.net"];

    const chatId = to.endsWith("@c.us") ? to : `${to}@c.us`;
    if (!listAllowing.includes(chatId?.split("@")[1])) {
      return res
        .status(400)
        .json({ error: `Hanya ${listAllowing.join(",")} yang diperbolehkan!` });
    }

    if (!mediaBase64 || typeof mediaBase64 !== "string") {
      return res
        .status(400)
        .json({ error: "mediaBase64 harus berupa string valid!" });
    }

    const matches = mediaBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      return res.status(400).json({ error: "Format mediaBase64 tidak valid!" });
    }

    const mimeType = matches[1];
    const typeMedia = mimeType.split("/")[0];
    const base64Data = matches[2];

    // Validasi MIME Type
    if (!["image/png", "image/jpeg"].includes(mimeType)) {
      return res
        .status(400)
        .json({ error: "Hanya gambar PNG atau JPEG yang diperbolehkan!" });
    }

    // Konversi Base64 ke Buffer
    const bufferBase64 = Buffer.from(base64Data, "base64");

    // Tentukan tipe media
    const buildMessage =
      typeMedia === "image"
        ? { image: bufferBase64 }
        : {
            document: bufferBase64,
            mimetype: mimeType,
            filename: filename || "file",
          };

    const messageData = await whatsapp.sendMessage(chatId, {
      ...buildMessage,
      caption: caption || "",
    });

    return res.status(200).json({
      status: "media_sent",
      wa: messageData,
    });
  } catch (error) {
    console.error("Error saat mengirim media:", error);
    res
      .status(500)
      .json({
        error: error.message || "Terjadi kesalahan saat mengirim media.",
      });
  }
});


app.listen(3001, () => {
  console.log(`WA service listening on port 3001`)
})

// avoid
app.use(cors())