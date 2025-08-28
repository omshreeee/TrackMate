const dgram = require("dgram");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const serviceAccount = require("./serviceAccountKey.json"); // Download from Firebase settings

// Initialize Firebase Admin SDK
initializeApp({
  credential: require("firebase-admin").credential.cert(serviceAccount),
  databaseURL: "https://trackmate-6d04e-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = getDatabase();
const udpServer = dgram.createSocket("udp4");

const PORT = 5000; // UDP Port

udpServer.on("message", (msg, rinfo) => {
  try {
    const data = JSON.parse(msg.toString());
    const { latitude, longitude } = data;
    console.log(`Received location: ${latitude}, ${longitude} from ${rinfo.address}`);

    // Save to Firebase
    const ref = db.ref("locations").push();
    ref.set({
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });

    console.log("Location stored in Firebase.");
  } catch (error) {
    console.error("Error processing message:", error);
  }
});

udpServer.on("listening", () => {
  console.log(`UDP Server listening on port ${PORT}`);
});

udpServer.bind(PORT);
