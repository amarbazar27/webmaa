const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/orders/page.js', 'utf8');

const target = `        await updateDoc(orderRef, {
           returnNote: customNote[orderId] || '',
           deliveryCountdownFormatted: formattedCountdown.trim()
        });`;

const replacement = `        // Calculate actual ETA timestamp
        let etaMillis = 0;
        if (d) etaMillis += parseInt(d) * 24 * 60 * 60 * 1000;
        if (h) etaMillis += parseInt(h) * 60 * 60 * 1000;
        if (m) etaMillis += parseInt(m) * 60 * 1000;

        await updateDoc(orderRef, {
           returnNote: customNote[orderId] || '',
           deliveryCountdownFormatted: formattedCountdown.trim(),
           deliveryETA: etaMillis > 0 ? new Date(Date.now() + etaMillis) : null
        });`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync('src/app/dashboard/orders/page.js', c, 'utf8');
  console.log('Successfully updated orders dashboard delivery ETA calculation');
} else {
  console.log('Failed to find target block in orders page');
}
