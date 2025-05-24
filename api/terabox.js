const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(require('cors')()); // Allow all CORS

app.get('/', (req, res) => {
    res.send('✅ Terabox API is running!');
});

app.get('/api/terabox', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });

    try {
        const page = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'
            }
        });

        const $ = cheerio.load(page.data);
        const script = $('script').toArray().map(el => $(el).html()).find(s => s.includes('window.playInfo'));

        if (!script) return res.status(404).json({ success: false, error: "No video info found" });

        const match = script.match(/window\.playInfo\s*=\s*(\{.*?\});/);
        if (!match) return res.status(404).json({ success: false, error: "No playInfo found" });

        const playInfo = JSON.parse(match[1]);
        const videoUrl = playInfo?.videoInfo?.urls?.[0]?.url;

        if (!videoUrl) return res.status(404).json({ success: false, error: "No direct video URL found" });

        res.json({
            success: true,
            developer: "pasindu",
            telegram: "https://t.me/yourchannel",
            direct_video_url: videoUrl,
            embed_html: `<video width="100%" height="auto" controls><source src="${videoUrl}" type="video/mp4"></video>`,
            linux_command: `wget "${videoUrl}" -O video.mp4`
        });

    } catch (err) {
        res.status(500).json({ success: false, error: "Error fetching video", detail: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Terabox API running on http://localhost:${PORT}`);
});
