// 1️⃣ Importuri
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const express = require('express');

// 2️⃣ Server Express pentru keep-alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is alive ✅"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 3️⃣ Creezi clientul Discord
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// 4️⃣ Eveniment ready
client.once('ready', () => {
  console.log(`✅ Bot ready as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
});

// 5️⃣ Funcție utilă
function formatDuration(ms) {
  let sec = Math.floor(ms / 1000);
  let min = Math.floor(sec / 60);
  let hr = Math.floor(min / 60);
  sec %= 60;
  min %= 60;
  return `${hr}h ${min}m ${sec}s`;
}

// 5.1️⃣ Uptime Monitor Config
const SITE_URL = "https://www.logged.tg/auth/corrupt";
let lastUpTime = null;
let lastStatus = null; // "UP" sau "DOWN"
const STATUS_CHANNEL_ID = "1436098432413597726";

// Auto-check site la fiecare 30 sec
setInterval(async () => {
  try {
    const start = Date.now();
    const res = await fetch(SITE_URL);
    const ping = Date.now() - start;

    let currentStatus = res.ok ? "UP" : "DOWN";

    if (res.ok && !lastUpTime) lastUpTime = Date.now();
    if (!res.ok) lastUpTime = null;

    // Trimite mesaj doar dacă status s-a schimbat
    if (currentStatus !== lastStatus) {
      const channel = client.channels.cache.get(STATUS_CHANNEL_ID);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 128 }))
          .setDescription(`@everyone
<a:corrupt_crown:1434729237545222287> SITE STATUS

<a:corrupt_arrow:1434730936880332840> **MAIN SITE:** \`${SITE_URL}\`
<a:corrupt_arrow:1434730936880332840> ${currentStatus === "UP" ? "Main site is up, go use it" : "Main site is down, use the backup sites for now"}

Response Time: ${res.ok ? ping + "ms" : "N/A"}
`)
          .setImage("https://i.pinimg.com/originals/67/b1/ef/67b1ef05eb08b416b90323b73e6cf1c5.gif")
          .setFooter({ text: "Site Uptime Monitor" });

        channel.send({ embeds: [embed] });
      }
      lastStatus = currentStatus;
    }

  } catch (err) {
    console.error("Error checking site:", err);
  }
}, 30000);

// 6️⃣ Event listener pentru mesaje
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ===== ✅ !check (manual) cu MAIN SITE, thumbnail fix, fără alte emoji-uri)
  if (message.content.startsWith('!check')) {
    try {
      const start = Date.now();
      const res = await fetch(SITE_URL);
      const ping = Date.now() - start;

      let statusText = "";
      let uptimeText = "";

      if (res.ok) {
        if (!lastUpTime) lastUpTime = Date.now();
        uptimeText = `UP for **${formatDuration(Date.now() - lastUpTime)}**`;
        statusText = "<a:corrupt_crown:1434729237545222287> **ONLINE**";
      } else {
        lastUpTime = null;
        uptimeText = "❌ No uptime data (offline)";
        statusText = `<a:corrupt_crown:1434729237545222287> OFFLINE`;
      }

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setThumbnail("https://cdn.discordapp.com/emojis/1431059075826712656.png")
        .setDescription(`<a:corrupt_crown:1434729237545222287> SITE STATUS

<a:corrupt_arrow:1434730936880332840> **MAIN SITE:** \`${SITE_URL}\`
<a:corrupt_arrow:1434730936880332840> **STATUS:** ${statusText}
<a:corrupt_arrow:1434730936880332840> **UPTIME:** ${uptimeText}

\`\`\`
Response Time: ${ping}ms
\`\`\``)
        .setImage("https://i.pinimg.com/originals/67/b1/ef/67b1ef05eb08b416b90323b73e6cf1c5.gif")
        .setFooter({ text: "Site Uptime Monitor" });

      await message.channel.send({ embeds: [embed] });

    } catch {
      lastUpTime = null;

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setThumbnail("https://cdn.discordapp.com/emojis/1431059075826712656.png")
        .setDescription(`<a:corrupt_crown:1434729237545222287> SITE STATUS

<a:corrupt_arrow:1434730936880332840> **MAIN SITE:** \`${SITE_URL}\`
<a:corrupt_arrow:1434730936880332840> **STATUS:** OFFLINE
<a:corrupt_arrow:1434730936880332840> **UPTIME:** No uptime data
`)
        .setImage("https://i.pinimg.com/originals/67/b1/ef/67b1ef05eb08b416b90323b73e6cf1c5.gif")
        .setFooter({ text: "Site Uptime Monitor" });

      await message.channel.send({ embeds: [embed] });
    }
  }

});

// 7️⃣ Error handler
client.on('error', (error) => console.error('Discord client error:', error));

// 8️⃣ Verificare token
if (!TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN is not set!');
  process.exit(1);
}

// 9️⃣ Login bot
client.login(TOKEN);
