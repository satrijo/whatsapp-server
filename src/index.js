import pkg from 'whatsapp-web.js';
import QRCode from 'qrcode';
import express from 'express';
import QRCodeTerminal from 'qrcode-terminal';

const app = express();

const { Client, LocalAuth } = pkg;
const client = new Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-gpu',],
    },
    webVersionCache: { type: 'remote', remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html', },
    authStrategy: new LocalAuth({
        clientId: 'client-one',
        dataPath: 'sessions',
    }),
});

let qrImage;

client.on('qr', async (qr) => {
    qrImage = qr;
    QRCodeTerminal.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message_create', message => {
    if (message.body === '!ping') {
        client.sendMessage(message.from, 'pong');
    }
});

app.get('/api/qr', async (req, res) => {

    if (qrImage) {
        try {
            const qrImage = await QRCode.toDataURL(qrImage);
            res.setHeader('Content-Type', 'image/png');
            res.send(Buffer.from(qrImage.split(',')[1], 'base64'));
        } catch (error) {
            res.status(500).send('Error generating QR code image');
        }
    } else {
        res.status(404).send('QR code not available');
    }
});

// Make api link to check group join
app.get('/api/list-group', async (req, res) => {
    const chat = await client.getChats();
    const groups = chat.filter(c => c.isGroup == true);
    res.json(groups);
});

// Make api link to send message to group
app.get('/api/send-message', async (req, res) => {
    const { to, message } = req.query;
    const sentMessage = await client.sendMessage(to, message);
    console.log(sentMessage);
    res.send(`Message sent: ${message}\nto ${to}`);
});

app.get('/api/logout', async (req, res) => {
    const { token } = req.query;
    if (token === 'satriyo') {
        await client.logout();
        res.send('Logout success');
    } else {
        res.send('Logout failed');
    }
})

client.initialize();

app.listen(3333, () => {
    console.log('Server is running on port 3000');
});
