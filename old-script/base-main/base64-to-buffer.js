function base64ToBuffer(base64String) {
  const dataString = String(base64String)
  if(!dataString.startsWith("data:")) {
    console.warn("String does not start with 'data:' Assuming it's already a pure base64 string.")
    try {
      return Buffer.from(base64String)
    } catch(e) {
      console.error(e.stack)
      return { error: 'Error decoding pure base64 string!' }
    }
  }
  const commaIndex = dataString.indexOf(",")
  if(commaIndex > -1) {
    const base64Data = dataString.substring(commaIndex + 1)
    try {
      return Buffer.from(base64Data, "base64")
    } catch(e) {
      console.error(e.stack)
      return { error: 'Error decoding base64 string!' }
    }
  }
  return { error: "Invalid data URI format: missing comma." }
}

module.exports = base64ToBuffer