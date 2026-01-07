const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');            // untuk Data URL
const qrcodeTerm = require('qrcode-terminal');   // untuk ASCII di terminal

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'laravel-app' })
});

let qrData = null, isReady = false;

// Event: perlu scan QR
client.on('qr', qr => {
    // 1) Simpan Data URL (jika frontend-butuh)
    qrcode.toDataURL(qr).then(url => qrData = url);

    // 2) Cetak ASCII-QR di terminal
    console.clear();
    console.log('🔗 Scan QR di bawah dengan WhatsApp Mobile untuk login:\n');
    qrcodeTerm.generate(qr, { small: true });
    console.log('\n Menunggu scan QR...');
});

// Event: sesi sudah siap
client.on('ready', () => {
    isReady = true;
    console.log('✅ |  WhatsApp Web client is ready');
});

client.initialize();

// Endpoint untuk cek status/QR (opsional)
app.get('/api/wa/qr', (req, res) => {
    res.json({ qr: qrData, ready: isReady });
});

// Endpoint untuk kirim media (QR image atau file apa pun)
app.post('/api/wa/send-media', async (req, res) => {
    try {
        const { to, mediaBase64, filename, caption } = req.body;
        const chatId = to.endsWith('@c.us') ? to : `${to}@c.us`;

        // Parse data URL
        const matches = mediaBase64.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ error: 'Invalid mediaBase64 format' });
        }
        const mimeType = matches[1];
        const data = matches[2];

        // Instansiasi MessageMedia
        const media = new MessageMedia(mimeType, data, filename);

        // Kirim pesan
        await client.sendMessage(chatId, media, { caption });
        res.json({ status: 'media_sent' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(3001, () => console.log(' WA service listening on port 3001'));
