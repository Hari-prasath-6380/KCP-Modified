// ============================================================
// 🔍 WHATSAPP DIAGNOSTICS - Debug & Status Endpoint
// File: backend/routes/diagnostics.js
// ============================================================

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Try to load WhatsApp module to check status
let whatsappModule = null;
let whatsappStatus = 'not_loaded';

try {
    whatsappModule = require('../whatsapp');
    whatsappStatus = 'loaded';
} catch (error) {
    whatsappStatus = 'load_error';
}

// ── GET /api/diagnostics/whatsapp ──────────────────────────
// Returns current WhatsApp client status and diagnostics
router.get('/whatsapp', async (req, res) => {
    console.log('\n[DIAGNOSTICS] WhatsApp status check requested');
    
    const diagnostics = {
        timestamp: new Date().toISOString(),
        whatsappModule: {
            loaded: whatsappModule !== null,
            status: whatsappStatus
        },
        clientReady: false,
        sessionDirectory: {
            exists: false,
            path: null,
            size: 0
        },
        recommendations: []
    };

    // Check if client is ready
    if (whatsappModule && whatsappModule.isClientReady) {
        diagnostics.clientReady = whatsappModule.isClientReady();
    }

    // Check session directory
    const sessionPath = path.join(__dirname, '../.wwebjs_auth');
    try {
        if (fs.existsSync(sessionPath)) {
            diagnostics.sessionDirectory.exists = true;
            diagnostics.sessionDirectory.path = sessionPath;
            
            // Get directory size
            const getDirectorySize = (dir) => {
                let size = 0;
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const stat = fs.statSync(path.join(dir, file));
                    size += stat.size;
                });
                return size;
            };
            
            try {
                diagnostics.sessionDirectory.size = getDirectorySize(sessionPath);
            } catch (e) {
                diagnostics.sessionDirectory.size = 'error';
            }
        }
    } catch (error) {
        // Session directory doesn't exist yet
    }

    // Generate recommendations
    if (!diagnostics.clientReady) {
        if (!diagnostics.sessionDirectory.exists) {
            diagnostics.recommendations.push({
                issue: 'No WhatsApp session found',
                severity: 'HIGH',
                action: 'Restart server and scan QR code when it appears. Session will be saved to .wwebjs_auth/'
            });
        } else {
            diagnostics.recommendations.push({
                issue: 'Session exists but client not ready',
                severity: 'MEDIUM',
                action: 'Wait 20-30 seconds for client to initialize. Check server logs for errors or QR code.'
            });
        }
    } else {
        diagnostics.recommendations.push({
            issue: 'All systems nominal',
            severity: 'OK',
            action: 'WhatsApp is ready to send notifications.'
        });
    }

    if (!whatsappModule) {
        diagnostics.recommendations.push({
            issue: 'WhatsApp module failed to load',
            severity: 'HIGH',
            action: 'Check if whatsapp-web.js and dependencies are installed. Run: npm install whatsapp-web.js puppeteer qrcode-terminal'
        });
    }

    console.log('[DIAGNOSTICS] Response:', diagnostics);
    res.json(diagnostics);
});

// ── GET /api/diagnostics/qr ────────────────────────────────
// Returns whether a QR code image is available and its URL
router.get('/qr', (req, res) => {
    const qrPath = path.join(__dirname, '../uploads/last_qr.png');
    const qrExists = fs.existsSync(qrPath);
    const isReady = whatsappModule ? whatsappModule.isClientReady() : false;

    res.json({
        ready: isReady,
        qrAvailable: qrExists && !isReady, // QR only relevant when not ready
        qrUrl: qrExists ? '/uploads/last_qr.png' : null,
        timestamp: new Date().toISOString()
    });
});

// ── GET /api/diagnostics/health ────────────────────────────
// Quick health check
router.get('/health', async (req, res) => {
    res.json({
        status: 'ok',
        whatsapp: {
            initialized: whatsappModule !== null,
            ready: whatsappModule ? whatsappModule.isClientReady() : false
        },
        timestamp: new Date().toISOString()
    });
});

// ── POST /api/diagnostics/test-whatsapp ────────────────────
// Send a test message to admin (for debugging)
router.post('/test-whatsapp', async (req, res) => {
    console.log('\n[DIAGNOSTICS] Test WhatsApp message requested');

    if (!whatsappModule) {
        return res.status(503).json({
            success: false,
            message: 'WhatsApp module not available',
            details: 'whatsappModule is null'
        });
    }

    if (!whatsappModule.isClientReady()) {
        return res.status(503).json({
            success: false,
            message: 'WhatsApp client not ready',
            details: 'Try again in 20-30 seconds after scanning QR code',
            clientReady: false
        });
    }

    try {
        const testMessage = `🧪 *TEST MESSAGE FROM KCP ORGANICS*

This is a test message to verify WhatsApp notifications are working correctly.

📱 Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
✅ WhatsApp client is ready and functional
✅ Notifications should work for orders

If you received this message, WhatsApp notifications are working! 🎉`;

        await whatsappModule.sendUserMessage('Test', '6380442089', testMessage);

        res.json({
            success: true,
            message: 'Test message sent successfully',
            details: 'Check your WhatsApp phone for the test message'
        });

        console.log('[DIAGNOSTICS] Test message sent successfully');
    } catch (error) {
        console.error('[DIAGNOSTICS] Test message failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to send test message',
            error: error.message
        });
    }
});

// ── POST /api/diagnostics/clear-session ────────────────────
// Clear the WhatsApp session (for recovery)
router.post('/clear-session', async (req, res) => {
    console.log('\n[DIAGNOSTICS] Session clear requested');

    const sessionPath = path.join(__dirname, '../.wwebjs_auth');
    
    try {
        if (fs.existsSync(sessionPath)) {
            // Recursively delete the directory
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log('[DIAGNOSTICS] Session cleared successfully');
            
            res.json({
                success: true,
                message: 'WhatsApp session cleared',
                action: 'Restart server to scan QR code again'
            });
        } else {
            res.json({
                success: true,
                message: 'Session directory not found (nothing to clear)'
            });
        }
    } catch (error) {
        console.error('[DIAGNOSTICS] Failed to clear session:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to clear session',
            error: error.message
        });
    }
});

module.exports = router;
