const express = require("express")
const cors = require("cors")

const app = express()
const port = process.env.PORT || 3050

// Setup All
app.use(cors())
app.use(express.json())

// WhatsApp Middleware
app.use(require("./client/wa-middleware"))

// Route
app.use("/api", require("./router/route"))

app.listen(port, () => {
  console.log("Server Running at http://localhost:"+port)
})