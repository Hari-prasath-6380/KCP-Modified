require('dotenv').config();

// ===== TELEGRAM CONFIGURATION (FREE - completely free forever) =====
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️  Telegram configuration missing in environment variables');
    console.warn('💡 Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to your Render environment');
}

// Admin notification details
const ADMIN_PHONE = process.env.ADMIN_PHONE || '6380442089';

// ===== WHATSAPP INTEGRATION =====
let whatsappModule = null;
try {
    whatsappModule = require('../whatsapp');
    console.log('✅ WhatsApp module loaded successfully');
} catch (error) {
    console.warn('⚠️  WhatsApp module not available:', error.message);
    console.log('💡 Install whatsapp-web.js to enable WhatsApp notifications');
}

// Send Telegram message (FREE)
async function sendTelegramMessage(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('📱 Telegram message (not configured):\n' + message);
        return false;
    }

    try {
        const https = require('https');
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const data = JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        });
        
        return new Promise((resolve) => {
            const options = {
                hostname: 'api.telegram.org',
                path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log('✅ Telegram message sent successfully');
                        resolve(true);
                    } else {
                        console.log('⚠️ Telegram message sent but got status:', res.statusCode);
                        if (body) {
                            try {
                                const errorData = JSON.parse(body);
                                console.log('📋 Telegram Error Details:', errorData);
                            } catch (e) {
                                console.log('📋 Telegram Response:', body);
                            }
                        }
                        resolve(false);
                    }
                });
            });

            req.on('error', (error) => {
                console.error('❌ Telegram error:', error.message);
                resolve(false);
            });

            req.write(data);
            req.end();
        });
    } catch (error) {
        console.error('❌ Error sending Telegram message:', error.message);
        return false;
    }
}

console.log('📱 Using Telegram + WhatsApp notification services');

// Send order notification via Telegram (FREE)
async function sendOrderTelegram(orderDetails) {
    try {
        // Build product list with full details
        let productsList = '';
        if (orderDetails.products && Array.isArray(orderDetails.products)) {
            orderDetails.products.forEach((product, index) => {
                const productName = product.name || 'Product';
                const productId = product.productId || 'N/A';
                const productPrice = product.price || 0;
                const quantity = product.quantity || 1;
                const total = (productPrice * quantity).toFixed(2);
                
                productsList += `${index + 1}. ${productName}\n   ID: ${productId}\n   Price: Rs.${productPrice}\n   Qty: ${quantity}\n   Total: Rs.${total}\n\n`;
            });
        }

        // Create detailed message with product information
        const message = `Order Confirmed!\n\nOrder ID: ${orderDetails.orderId}\nCustomer: ${orderDetails.customerName}\nPhone: ${orderDetails.customerPhone}\n\nPRODUCTS:\n${productsList}\nTotal Amount: Rs.${orderDetails.amount}\nPayment: ${orderDetails.paymentMethod}\nStatus: Pending\n\nDelivery Address:\n${orderDetails.address}\n\nTrack: Use Order ID and Mobile on track-order.html`;
        
        console.log('📱 Sending Telegram order notification to Chat ID:', TELEGRAM_CHAT_ID);
        const result = await sendTelegramMessage(message);
        
        if (result) {
            console.log('✅ Telegram order notification sent successfully');
        } else {
            console.log('⚠️ Telegram notification may not have been delivered');
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error formatting Telegram order notification:', error.message);
        return false;
    }
}

// Send order notification via WhatsApp
async function sendOrderWhatsApp(orderDetails) {
    if (!whatsappModule) {
        console.warn('⚠️  WhatsApp module not available - skipping WhatsApp notification');
        console.warn('💡 Make sure whatsapp-web.js is installed and WhatsApp is initialized');
        return false;
    }

    try {
        // Check if client is ready
        const isReady = whatsappModule.isClientReady ? whatsappModule.isClientReady() : false;
        if (!isReady) {
            console.warn('⚠️  WhatsApp client not ready yet - notification will be skipped');
            console.warn('💡 WhatsApp: Waiting for QR code scan or device link');
            console.warn('💡 Check server logs for QR code. It may take 20-30 seconds to initialize.');
            return false;
        }

        // Validate required fields
        if (!orderDetails.phone) {
            console.error('❌ WhatsApp Error: Customer phone number is missing');
            return false;
        }

        // Format data for WhatsApp notification - match expected structure
        const whatsappData = {
            customerName: orderDetails.customerName || 'Customer',
            phone: orderDetails.phone,
            items: (orderDetails.items || []).map(p => ({
                title: p.name || p.productName || p.title || 'Product',
                qty: p.quantity || 0,
                price: p.price || 0
            })),
            totalAmount: orderDetails.totalAmount || orderDetails.amount || 0,
            paymentMethod: orderDetails.paymentMethod || 'Not specified',
            shippingAddress: {
                address: orderDetails.shippingAddress?.address || '',
                city: orderDetails.shippingAddress?.city || '',
                pincode: orderDetails.shippingAddress?.pincode || ''
            }
        };

        console.log('📱 [WhatsApp] Preparing to send order notification...');
        console.log('📱 [WhatsApp] Customer: ' + whatsappData.customerName);
        console.log('📱 [WhatsApp] Phone: +91' + whatsappData.phone.replace(/\D/g, '').slice(-10));
        console.log('📱 [WhatsApp] Items: ' + whatsappData.items.length);
        
        await whatsappModule.sendOrderNotification(whatsappData);
        console.log('✅ WhatsApp order notification sent successfully');
        return true;
    } catch (error) {
        console.error('❌ Error sending WhatsApp order notification:', error.message);
        console.error('📋 Error details:', error.toString());
        if (error.stack) {
            console.error('📋 Stack trace:', error.stack);
        }
        return false;
    }
}

// Send user message via WhatsApp
async function sendUserMessageWhatsApp(senderName, senderPhone, messageText) {
    if (!whatsappModule) {
        console.warn('⚠️  WhatsApp module not available');
        return false;
    }

    try {
        // Check if client is ready
        const isReady = whatsappModule.isClientReady ? whatsappModule.isClientReady() : false;
        if (!isReady) {
            console.warn('⚠️  WhatsApp client not ready yet - user message will be skipped');
            return false;
        }

        await whatsappModule.sendUserMessage(senderName, senderPhone, messageText);
        console.log('✅ WhatsApp user message sent to admin');
        return true;
    } catch (error) {
        console.error('❌ Error sending WhatsApp user message:', error.message);
        console.error('📋 Error stack:', error.stack);
        return false;
    }
}

module.exports = {
    sendOrderTelegram,
    sendOrderWhatsApp,
    sendUserMessageWhatsApp,
    sendTelegramMessage,
    ADMIN_PHONE
};
