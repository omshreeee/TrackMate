const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const accountSid = "AC40638fb63dfc60460165ee8e236c95f3oo..s"; //enter account sid from twilio
const authToken = "004fdfe7149aae1d738f2fb685bd143267.."; //enter auth token from twilio
const client = twilio(accountSid, authToken);

app.post("/send-sms", async (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Location data is required." });
    }

    const messageBody = `🚨 Emergency Alert! 🚨\nLocation: https://www.google.com/maps?q=${latitude},${longitude}`;

    try {
        const message = await client.messages.create({
            from: "091320361635609...",//enter twilio number
            body: messageBody,
            to: "+91565...", // Change to actual phone number
        });

        res.json({ success: true, message: "SMS sent successfully!", sid: message.sid });
    } catch (error) {
        console.error("Error sending SMS:", error);
        res.status(500).json({ error: "Failed to send SMS." });
    }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
