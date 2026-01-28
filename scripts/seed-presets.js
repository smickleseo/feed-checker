// Run this after deploying to seed feed presets into KV
// Usage: node scripts/seed-presets.js https://your-app.pages.dev

const BASE_URL = process.argv[2];

if (!BASE_URL) {
    console.error('Usage: node scripts/seed-presets.js <your-deployed-url>');
    console.error('Example: node scripts/seed-presets.js https://feed-checker.pages.dev');
    process.exit(1);
}

const presets = [
    {
        clientName: 'Surf & Turf',
        feedName: 'Meta Feed',
        feedUrl: 'https://surfturf.co.uk/wp-content/uploads/woo-product-feed-pro/xml/Qo5NbmlZSq2dTbEQ8Skt8MqZXm6w0fXH.xml'
    },
    {
        clientName: 'Surf & Turf',
        feedName: 'Google Shopping',
        feedUrl: 'https://surfturf.co.uk/wp-content/uploads/woo-product-feed-pro/xml/EN3F0DReRR5Zfuj48N7mbDWdd9KIkIwU.xml'
    },
    {
        clientName: 'Instashade',
        feedName: 'Meta Feed',
        feedUrl: 'https://www.instashade.co.uk/wp-content/uploads/woo-product-feed-pro/xml/qkpl120donkso39sm2q0z9zomtnsaqxi.xml'
    },
    {
        clientName: 'Instashade',
        feedName: 'Google Shopping',
        feedUrl: 'https://www.instashade.co.uk/wp-content/uploads/woo-product-feed-pro/xml/iabvyqrymtew19vxvwnmsgbuyyqlsldq.xml'
    }
];

async function seedPresets() {
    console.log(`Seeding presets to ${BASE_URL}...\n`);

    for (const preset of presets) {
        try {
            const response = await fetch(`${BASE_URL}/api/feed-presets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preset)
            });

            if (response.ok) {
                console.log(`Added: ${preset.clientName} - ${preset.feedName}`);
            } else {
                const error = await response.text();
                console.error(`Failed: ${preset.clientName} - ${preset.feedName}: ${error}`);
            }
        } catch (error) {
            console.error(`Error: ${preset.clientName} - ${preset.feedName}: ${error.message}`);
        }
    }

    console.log('\nDone!');
}

seedPresets();
