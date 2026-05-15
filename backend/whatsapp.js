// ============================================================
// 📱 WHATSAPP INTEGRATION MODULE
// File: backend/whatsapp.js
// ============================================================

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const QRCodeFile = require("qrcode"); // New dependency for saving to file
const fs = require("fs");
const path = require("path");

// Use the bundled Chromium from puppeteer@21 (compatible with whatsapp-web.js)
const puppeteer = require("puppeteer");
const CHROME_PATH = puppeteer.executablePath();

// ── ADMIN PHONE NUMBER ──────────────────────────────────────
// 🔧 Admin WhatsApp Number: +91 6380442089
// Format: CountryCode + PhoneNumber + @c.us (no + or spaces)
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP || "916380442089@c.us";
// ────────────────────────────────────────────────────────────

// Track readiness so we don't try to send before connected
let isClientReady = false;

// ── CLIENT SETUP ─────────────────────────────────────────────
// FIX: Uses a pre-cached WhatsApp Web HTML from GitHub instead of
// loading web.whatsapp.com live (which causes ERR_CONNECTION_TIMED_OUT
// in headless Chrome environments).
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "./.wwebjs_auth"
    }),

    // ── 🔧 PUPPETEER: Optimized for Render/Linux Containers ────
    puppeteer: {
        headless: true,
        // On Render, we might need to let puppeteer find the path itself
        // or use the one from the buildpack
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || CHROME_PATH,
        
        timeout: 60000, // 60 seconds timeout
        
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
            "--disable-extensions",
            "--disable-blink-features=AutomationControlled",
            "--disable-default-apps",
            "--disable-sync",
            "--disable-plugins",
            "--disable-images",
            "--disable-component-extensions-with-background-pages",
            "--disable-background-networking",
            "--disable-preconnect",
            "--disable-client-side-phishing-detection",
            "--disable-breakpad",
            "--disable-popup-blocking",
            "--window-size=1280,800"
        ]
    }
    // ──────────────────────────────────────────────────────────
});

// ── QR CODE: Scan with WhatsApp → Linked Devices ────────────
client.on("qr", async (qr) => {
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║    📱 WHATSAPP: SCAN QR CODE TO LINK DEVICE            ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log("");
    qrcode.generate(qr, { small: true });
    console.log("");
    
    // SAVE QR CODE AS IMAGE FOR RENDER USERS
    try {
        const uploadsDir = path.join(__dirname, "uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
        
        const qrPath = path.join(uploadsDir, "last_qr.png");
        await QRCodeFile.toFile(qrPath, qr);
        console.log("🖼️  QR code saved to: backend/uploads/last_qr.png");
        console.log("🌐 You can view it at: [YOUR_BACKEND_URL]/uploads/last_qr.png");
    } catch (err) {
        console.error("❌ Failed to save QR code image:", err.message);
    }

    console.log("");
    console.log("➡️  STEPS TO LINK:");
    console.log("   1. Open WhatsApp on your phone");
    console.log("   2. Tap MENU (⋮) → Linked Devices → Link a Device");
    console.log("   3. Point camera at the QR code above");
    console.log("");
    console.log("💡 Note: Scan QR code only once. Session will be saved.");
    console.log("════════════════════════════════════════════════════════\n");
});

// ── READY ─────────────────────────────────────────────────────
client.on("ready", () => {
    isClientReady = true;
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ [WhatsApp] CLIENT READY AND CONNECTED");
    console.log("✅ Notifications will be sent to: +91 6380442089");
    console.log("═══════════════════════════════════════════════════════\n");
});

// ── AUTHENTICATED ──────────────────────────────────────────────
client.on("authenticated", () => {
    console.log("🔐 [WhatsApp] Device authenticated — session saved");
    console.log("🔐 No QR code needed on next restart\n");
});

// ── AUTH FAILURE ───────────────────────────────────────────────
client.on("auth_failure", (msg) => {
    isClientReady = false;
    console.error("❌ [WhatsApp] Auth failed:", msg);
});

// ── DISCONNECTED ───────────────────────────────────────────────
client.on("disconnected", (reason) => {
    isClientReady = false;
    console.warn("⚠️  [WhatsApp] Disconnected:", reason);
});

// ── LOADING SCREEN ─────────────────────────────────────────────
client.on("loading_screen", (percent, message) => {
    console.log(`⏳ [WhatsApp] Loading... ${percent}% — ${message}`);
});

// ── BROWSER CRASH HANDLER ──────────────────────────────────────
client.on("remote_session_saved", () => {
    console.log("📱 [WhatsApp] Session saved — you can close WhatsApp Web.");
});

// ── GENERAL ERROR HANDLER ──────────────────────────────────────
client.on("error", (error) => {
    isClientReady = false;
    console.error("❌ [WhatsApp] Error:", error.message);
    console.warn("⚠️  [WhatsApp] Continuing without WhatsApp notifications...");
});

// ── UNHANDLED REJECTION HANDLER ────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
    if (reason && reason.message && reason.message.includes("Protocol error")) {
        console.warn("⚠️  [WhatsApp] Protocol error (puppeteer context destroyed) — WhatsApp disabled");
        console.warn("⚠️  [WhatsApp] Server will continue without WhatsApp notifications");
    } else {
        console.error("❌ Unhandled Rejection:", reason);
    }
});

// ── SEND ORDER NOTIFICATION ────────────────────────────────────
/**
 * Sends WhatsApp order notifications to both admin AND customer.
 * Called automatically from POST /orders in server.js
 * 
 * With retry logic for early initialization
 *
 * @param {Object} orderData
 */
async function sendOrderNotification(orderData) {
    // ── RETRY LOGIC: Wait up to 10 seconds if client is initializing ──
    let attempts = 0;
    let maxAttempts = 10; // 10 attempts × 1 second = 10 seconds max wait
    
    while (!isClientReady && attempts < maxAttempts) {
        attempts++;
        if (attempts === 1) {
            console.log('⏳ [WhatsApp] Client initializing, waiting... (max 10 sec)');
        }
        await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
    }
    
    if (!isClientReady) {
        console.warn('❌ [WhatsApp] Client still not ready after 10-second wait.');
        console.warn('💡 [Suggestions]:');
        console.warn('   1. Check server logs for QR code (appears during startup)');
        console.warn('   2. Scan QR code with WhatsApp → Linked Devices');
        console.warn('   3. Wait for "✅ CLIENT READY" message in logs');
        console.warn('   4. Restart server if QR code never appeared: kill node, npm start, scan QR');
        console.warn('   5. Clear session: delete .wwebjs_auth/session folder and restart');
        return;
    }

    const { customerName, phone, items, totalAmount, paymentMethod, shippingAddress } = orderData;

    // Format each item in the order
    const itemList = items
        .map((item, i) =>
            `  ${i + 1}. ${item.title} × ${item.qty}  →  ₹${(item.price * item.qty).toLocaleString("en-IN")}`
        )
        .join("\n");

    // ── MESSAGE FOR ADMIN ──────────────────────────────────────
    const adminMessage =
`🛒 *New Order — KCP Organics*

👤 *Customer:* ${customerName}
📞 *Phone:* ${phone}
📍 *Address:* ${shippingAddress.address}, ${shippingAddress.city} — ${shippingAddress.pincode}

🪑 *Items Ordered:*
${itemList}

💰 *Total:* ₹${totalAmount.toLocaleString("en-IN")}
💳 *Payment:* ${paymentMethod}

🕐 *Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

✅ Login to admin dashboard to update order status.`;

    // ── MESSAGE FOR CUSTOMER ───────────────────────────────────
    const customerMessage =
`✅ *Order Confirmed — KCP Organics*

Thank you for your order, ${customerName}! 🎉

🪑 *Items Ordered:*
${itemList}

💰 *Order Total:* ₹${totalAmount.toLocaleString("en-IN")}
💳 *Payment Method:* ${paymentMethod}

📍 *Delivery Address:*
${shippingAddress.address}
${shippingAddress.city} — ${shippingAddress.pincode}

🕐 *Order Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

You can track your order status through our website. We will notify you once your order is out for delivery.
Thank you for shopping with KCP Organics! 🙏`;

    try {
        // Send notification to ADMIN
        console.log('📱 [WhatsApp] Sending order to admin...');
        await client.sendMessage(ADMIN_WHATSAPP_NUMBER, adminMessage);
        console.log("✅ [WhatsApp] Order notification sent to admin (+91 6380442089)");

        // Send confirmation to CUSTOMER
        // Format customer phone number for WhatsApp: remove special chars and add @c.us
        try {
            const cleanPhone = phone.replace(/\D/g, ""); // Remove all non-digits
            const last10Digits = cleanPhone.slice(-10); // Get last 10 digits
            
            // Validate phone number
            if (!last10Digits || last10Digits.length !== 10) {
                console.error(`❌ [WhatsApp] Invalid customer phone format: ${phone}`);
                console.error(`❌ [WhatsApp] Phone must be 10 digits. Got: ${cleanPhone}`);
                return; // Skip customer notification if invalid
            }
            
            const fullCustomerNumber = `91${last10Digits}@c.us`;
            console.log(`📱 [WhatsApp] Sending order confirmation to customer: +91${last10Digits}`);
            
            await client.sendMessage(fullCustomerNumber, customerMessage);
            console.log(`✅ [WhatsApp] Order confirmation sent to customer (+91${last10Digits})`);
        } catch (customerError) {
            console.error(`❌ [WhatsApp] Failed to send to customer: ${customerError.message}`);
            console.warn("⚠️  [WhatsApp] Admin was notified, but customer notification failed");
            console.warn(`💡 [Tip] Verify customer phone number: ${phone}`);
        }
    } catch (err) {
        console.error("❌ [WhatsApp] Failed to send message:", err.message);
        console.error("📋 [Error Details] ", err.toString());
    }
}

// ── SEND MESSAGE FROM USER ────────────────────────────────────
/**
 * Sends user messages to admin via WhatsApp
 * With retry logic for early initialization
 * 
 * @param {string} senderName
 * @param {string} senderPhone
 * @param {string} messageText
 */
async function sendUserMessage(senderName, senderPhone, messageText) {
    // ── RETRY LOGIC: Wait up to 10 seconds if client is initializing ──
    let attempts = 0;
    let maxAttempts = 10;
    
    while (!isClientReady && attempts < maxAttempts) {
        attempts++;
        if (attempts === 1) {
            console.log('⏳ [WhatsApp] Client initializing, waiting for message send... (max 10 sec)');
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    
    if (!isClientReady) {
        console.warn("⚠️  [WhatsApp] Client not ready — user message not sent.");
        console.warn('💡 Please restart server and scan QR code to enable WhatsApp');
        return;
    }

    const message =
`💬 *New Message from KCP Organics Website*

👤 *Name:* ${senderName}
📞 *Phone:* ${senderPhone}
🕐 *Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

📝 *Message:*
${messageText}

---
Please reply to this customer via WhatsApp or email.`;

    try {
        await client.sendMessage(ADMIN_WHATSAPP_NUMBER, message);
        console.log(`✅ [WhatsApp] User message from ${senderName} sent to admin`);
    } catch (err) {
        console.error("❌ [WhatsApp] Failed to send user message:", err.message);
    }
}

// ── INITIALIZE WITH TIMEOUT ───────────────────────────────────
console.log("\n");
console.log("╔════════════════════════════════════════════════════════╗");
console.log("║          📱 WHATSAPP INITIALIZATION STARTING           ║");
console.log("║                  (May take 20-30 seconds)              ║");
console.log("╚════════════════════════════════════════════════════════╝");
console.log("\n");

// Wrap initialization with timeout to prevent hanging
const initTimeout = setTimeout(() => {
    console.warn("⚠️  [WhatsApp] Initialization timeout — WhatsApp will be unavailable");
    console.warn("⚠️  [WhatsApp] Server will continue without WhatsApp notifications");
}, 60000); // 60 second timeout

client.initialize()
    .then(() => {
        clearTimeout(initTimeout);
        console.log("\n");
        console.log("╔════════════════════════════════════════════════════════╗");
        console.log("║     ✅ WHATSAPP CLIENT INITIALIZED SUCCESSFULLY        ║");
        console.log("╚════════════════════════════════════════════════════════╝");
        console.log("\n");
    })
    .catch((error) => {
        clearTimeout(initTimeout);
        isClientReady = false;
        console.error("\n❌ [WhatsApp] Initialization failed:", error.message);
        
        // Check if it's a Puppeteer/protocol error
        if (error.message && error.message.includes("Protocol error")) {
            console.warn("⚠️  [WhatsApp] Puppeteer protocol error — disabling WhatsApp");
        }
        
        console.warn("⚠️  [WhatsApp] Server will continue without WhatsApp notifications");
        console.warn("💡 [Tip] Try manually scanning QR codes later or restarting the server\n");
    });

// ============================================================
// Exports
// ============================================================
module.exports = { client, sendOrderNotification, sendUserMessage, isClientReady: () => isClientReady };
