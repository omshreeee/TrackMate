const express = require("express");
const path = require("path");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const port = process.env.PORT || 8000;

app.use(cors()); // Allow frontend requests
app.use(express.json()); // Parse JSON body

// Define endpoint for storing and sending location
app.post("/api/send-location", (req, res) => {
  const { location } = req.body;

  if (!location) {
    return res.status(400).json({ message: "Please provide location" });
  }

  // Send alert to NGOs
  sendAlertToNGOs(location);

  res.status(200).json({ message: "Location sent successfully" });
});

// Serve static files
app.use(express.static(path.join(__dirname, "")));

// Define root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Function to send email alerts to NGOs

  function sendAlertToNGOs(location) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "trackmate09o@gmail.com-enter sender email",
        pass: "nohmo oypow jfcho oxazj--enter your email passkey", // Use environment variables in production
      },
    });
  
    const ngoEmails = [
      "enter ngo/volunteer email"

    ];
  
    ngoEmails.forEach((email) => {
      const mailOptions = {
        from: "trackmate09@gmail.com",
        to: email,
        subject: "Location Alert",
        text: `🚨 ALERT!!\n\nA location has been reported: ${location}`
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(`Error sending to ${email}:`, error);
        } else {
          console.log(`Alert email sent to ${email}:`, info.response);
        }
      });
    });
  }
  