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

// 5️⃣ Funcții utile
function formatNumber(num) {
  try { 
    return num.toLocaleString(); 
  } catch { 
    return "0"; 
  }
}

function formatDuration(ms) {
  let sec = Math.floor(ms / 1000);
  let min = Math.floor(sec / 60);
  let hr = Math.floor(min / 60);
  sec %= 60;
  min %= 60;
  return `${hr}h ${min}m ${sec}s`;
}

// 5.1️⃣ Uptime Monitor Config
let lastUpTime = null;
let lastStatus = null; // "UP" sau "DOWN"
const STATUS_CHANNEL_ID = "1436098432413597726";
const MAIN_SITE_URL = "https://www.logged.tg/auth/corrupt";
const MAIN_SITE_NAME = "MAIN SITE";

// Auto-check site la fiecare 30 sec
setInterval(async () => {
  try {
    const start = Date.now();
    let res, ping;

    try {
      const response = await fetch(MAIN_SITE_URL);
      res = { ok: response.ok };
      ping = Date.now() - start;
    } catch {
      res = { ok: false };
      ping = null;
    }

    let currentStatus = res.ok ? "UP" : "DOWN";

    if (res.ok && !lastUpTime) lastUpTime = Date.now();
    if (!res.ok) lastUpTime = null;

    if (currentStatus !== lastStatus) {
      const channel = client.channels.cache.get(STATUS_CHANNEL_ID);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setThumbnail("https://cdn.discordapp.com/emojis/1431059075826712656.png")
          .setDescription(`@everyone
<a:corrupt_crown:1434729237545222287> SITE STATUS

<a:corrupt_arrow:1434730936880332840> **${MAIN_SITE_NAME}**
<a:corrupt_arrow:1434730936880332840> ${currentStatus === "UP" ? "Main site is up, go use it" : "Main site is down, use the backup sites for now"}

Response Time: ${ping ? ping + "ms" : "N/A"}
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

  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // ===== !stats =====
  if (message.content.startsWith('!stats')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();

      if (!data.success || !data.Normal) {
        message.reply("❌ No stats found for this user.");
        return;
      }

      const normal = data.Normal;
      const profile = data.Profile || {};

      const hits = normal.Totals?.Accounts || 0;
      const visits = normal.Totals?.Visits || 0;
      const clicks = normal.Totals?.Clicks || 0;

      const biggestSummary = normal.Highest?.Summary || 0;
      const biggestRap = normal.Highest?.Rap || 0;
      const biggestRobux = normal.Highest?.Balance || 0;

      const totalSummary = normal.Totals?.Summary || 0;
      const totalRap = normal.Totals?.Rap || 0;
      const totalRobux = normal.Totals?.Balance || 0;

      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(`─── <a:shine:1434729237545222287> **NORMAL INFO** <a:shine:1434729237545222287> ───

<:dot:1434739765240135811> **User:** **${userName}**

<:dot:1434739765240135811> **TOTAL STATS:**
\`\`\`
Hits:     ${formatNumber(hits)}
Visits:   ${formatNumber(visits)}
Clicks:   ${formatNumber(clicks)}
\`\`\`

<:dot:1434739765240135811> **BIGGEST HIT:**
\`\`\`
Summary:  ${formatNumber(biggestSummary)}
RAP:      ${formatNumber(biggestRap)}
Robux:    ${formatNumber(biggestRobux)}
\`\`\`

<:dot:1434739765240135811> **TOTAL HIT STATS:**
\`\`\`
Summary:  ${formatNumber(totalSummary)}
RAP:      ${formatNumber(totalRap)}
Robux:    ${formatNumber(totalRobux)}
\`\`\``)
        .setImage("https://i.pinimg.com/originals/67/b1/ef/67b1ef05eb08b416b90323b73e6cf1c5.gif")
        .setFooter({ text: "Stats Bot" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error('Error fetching stats:', err);
      message.reply("❌ Error fetching stats. Please try again later.");
    }
  }

  // ===== !daily =====
  if (message.content.startsWith('!daily')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();

      if (!data.success) {
        message.reply("❌ No stats found for this user.");
        return;
      }

      const daily = data.Daily || data.Normal;
      const profile = data.Profile || {};

      if (!daily) {
        message.reply("❌ No daily stats available for this user.");
        return;
      }

      const dailyHits = daily.Totals?.Accounts || 0;
      const dailyVisits = daily.Totals?.Visits || 0;
      const dailyClicks = daily.Totals?.Clicks || 0;

      const biggestSummary = daily.Highest?.Summary || 0;
      const biggestRap = daily.Highest?.Rap || 0;
      const biggestRobux = daily.Highest?.Balance || 0;

      const dailySummary = daily.Totals?.Summary || 0;
      const dailyRap = daily.Totals?.Rap || 0;
      const dailyRobux = daily.Totals?.Balance || 0;

      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(`─── <a:shine:1434729237545222287> **DAILY STATS** <a:shine:1434729237545222287> ───

<:dot:1434739765240135811> **User:** **${userName}**

<:dot:1434739765240135811> **DAILY STATS:**
\`\`\`
Hits:     ${formatNumber(dailyHits)}
Visits:   ${formatNumber(dailyVisits)}
Clicks:   ${formatNumber(dailyClicks)}
\`\`\`

<:dot:1434739765240135811> **BIGGEST HIT:**
\`\`\`
Summary:  ${formatNumber(biggestSummary)}
RAP:      ${formatNumber(biggestRap)}
Robux:    ${formatNumber(biggestRobux)}
\`\`\`

<:dot:1434739765240135811> **DAILY HIT STATS:**
\`\`\`
Summary:  ${formatNumber(dailySummary)}
RAP:      ${formatNumber(dailyRap)}
Robux:    ${formatNumber(dailyRobux)}
\`\`\``)
        .setImage("https://i.pinimg.com/originals/67/b1/ef/67b1ef05eb08b416b90323b73e6cf1c5.gif")
        .setFooter({ text: "Stats Bot Daily" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error('Error fetching daily stats:', err);
      message.reply("❌ Error fetching daily stats. Please try again later.");
    }
  }

  // ===== ✅ !check =====
  if (message.content.startsWith('!check')) {
    try {
      const start = Date.now();
      let res, ping;

      try {
        const response = await fetch(MAIN_SITE_URL);
        res = { ok: response.ok };
        ping = Date.now() - start;
      } catch {
        res = { ok: false };
        ping = null;
      }

      let statusText = "";
      let uptimeText = "";

      if (res.ok) {
        if (!lastUpTime) lastUpTime = Date.now();
        uptimeText = `UP for **${formatDuration(Date.now() - lastUpTime)}**`;
        statusText = "<a:corrupt_crown:1434729237545222287> **ONLINE**";
      } else {
        lastUpTime = null;
        uptimeText = "❌ No uptime data (offline)";
        statusText = "<a:corrupt_crown:1434729237545222287> OFFLINE";
      }

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setThumbnail("https://cdn.discordapp.com/emojis/1431059075826712656.png")
        .setDescription(`<a:corrupt_crown:1434729237545222287> SITE STATUS

<a:corrupt_arrow:1434730936880332840> **${MAIN_SITE_NAME}**
<a:corrupt_arrow:1434730936880332840> **STATUS:** ${statusText}
<a:corrupt_arrow:1434730936880332840> **UPTIME:** ${uptimeText}

\`\`\`
Response Time: ${ping ? ping + "ms" : "N/A"}
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

<a:corrupt_arrow:1434730936880332840> **${MAIN_SITE_NAME}**
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
