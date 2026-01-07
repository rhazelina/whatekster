/**
 * Convert Base64 (with or without Data URI prefix) to Buffer.
 * @param {string} base64String 
 * @returns {Buffer}
 */
function base64ToBuffer(base64String) {
  if(typeof base64String !== 'string') {
    return { error: "no string format" }
  }
  const commaIndex = base64String.indexOf(",")
  const cleanBase64 = commaIndex !== -1 
    ? base64String.slice(commaIndex + 1) 
    : base64String;

  try {
    const buffer = Buffer.from(cleanBase64, "base64")
    if(buffer.length === 0 && cleanBase64.length > 0) {
      return { error: "base64 is not valid" }
    }
    return buffer
  } catch(e) {
    console.error("Bad decode base64:", e.message)
    return { error: "Bad decode base64" }
  }
}

module.exports = base64ToBuffer