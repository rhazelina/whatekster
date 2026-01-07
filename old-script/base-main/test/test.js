const qrcode = require("qrcode")

qrcode.toDataURL("test")
.then(console.log)
