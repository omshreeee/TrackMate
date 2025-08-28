const express = require("express");
const dgram = require("dgram");
const cors = require("cors");

const app = express();
const udpClient = dgram.createSocket("udp4");

app.use(cors());
app.use(express.json());

app.post("/send-udp-location", (req, res) => {
  const message = Buffer.from(JSON.stringify(req.body));

  udpClient.send(message, 5000, "localhost", (err) => {
    if (err) {
      console.error("UDP Send Error:", err);
      return res
        .status(500)
        .json({ error: "Failed to send location via UDP." });
    }
    res.json({ success: true, message: "Location sent via UDP!" });
  });
});

const PORT = 8000;
app.listen(PORT, () => console.log(`Express server running on port ${PORT}`));
