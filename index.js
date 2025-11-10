// 1️⃣ Importuri
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const express = require('express');

// 2️⃣ Server Express pentru keep-alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Stats Bot is alive ✅"));
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

// 4️⃣ Funcții utile
function formatNumber(num) { return num?.toLocaleString() || "0"; }

// Retry cu timeout pentru fetch API
async function safeFetchWithRetry(url, retries = 3, timeoutMs = 100000) { // 100s
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        headers: {
          "User-Agent": "StatsBot/1.0",
          "Accept": "application/json",
          "Referrer": "https://www.logged.tg"
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) continue;
      return await res.json();
    } catch (err) {
      console.error(`Attempt ${i+1} failed:`, err);
    }
  }
  return null;
}

// 5️⃣ Event listener pentru mesaje
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // ===== !stats =====
  if (message.content.startsWith('!stats')) {
    const data = await safeFetchWithRetry(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);

    if (!data || !data.Normal) return message.reply("❌ Error fetching stats. API slow or unavailable.");

    const normal = data.Normal;
    const profile = data.Profile || {};
    const userName = profile.userName || targetUser.username;

    const embed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
      .setDescription(`─── <a:emoji_23:1437165438315532431> **NORMAL INFO** ───

<a:emoji_21:1437163698161717468> **User:** **${userName}**

<a:emoji_21:1437163698161717468> **TOTAL STATS:**
Hits: ${formatNumber(normal.Totals?.Accounts)}
Visits: ${formatNumber(normal.Totals?.Visits)}
Clicks: ${formatNumber(normal.Totals?.Clicks)}

<a:emoji_21:1437163698161717468> **BIGGEST HIT:**
Summary: ${formatNumber(normal.Highest?.Summary)}
RAP: ${formatNumber(normal.Highest?.Rap)}
Robux: ${formatNumber(normal.Highest?.Balance)}

<a:emoji_21:1437163698161717468> **TOTAL HIT STATS:**
Summary: ${formatNumber(normal.Totals?.Summary)}
RAP: ${formatNumber(normal.Totals?.Rap)}
Robux: ${formatNumber(normal.Totals?.Balance)}
`)
      .setImage("https://i.imgur.com/rCQ33gA.gif")
      .setFooter({ text: "Stats Bot" });

    await message.channel.send({ embeds: [embed] });
  }

  // ===== !daily =====
  if (message.content.startsWith('!daily')) {
    const data = await safeFetchWithRetry(`https://api.injuries.lu/v2/daily?type=0x2&cs=3&ref=corrupteds&userId=${targetId}`);

    if (!data || !data.Daily) return message.reply("❌ Error fetching daily stats. API slow or unavailable.");

    const daily = data.Daily || data.Normal;
    const profile = data.Profile || {};
    const userName = profile.userName || targetUser.username;

    const embed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
      .setDescription(`─── <a:emoji_23:1437165438315532431> **DAILY STATS** ───

<a:emoji_21:1437163698161717468> **User:** **${userName}**

<a:emoji_21:1437163698161717468> **DAILY STATS:**
Hits: ${formatNumber(daily.Totals?.Accounts)}
Visits: ${formatNumber(daily.Totals?.Visits)}
Clicks: ${formatNumber(daily.Totals?.Clicks)}

<a:emoji_21:1437163698161717468> **BIGGEST HIT:**
Summary: ${formatNumber(daily.Highest?.Summary)}
RAP: ${formatNumber(daily.Highest?.Rap)}
Robux: ${formatNumber(daily.Highest?.Balance)}

<a:emoji_21:1437163698161717468> **TOTAL HIT STATS:**
Summary: ${formatNumber(daily.Totals?.Summary)}
RAP: ${formatNumber(daily.Totals?.Rap)}
Robux: ${formatNumber(daily.Totals?.Balance)}
`)
      .setImage("https://i.imgur.com/rCQ33gA.gif")
      .setFooter({ text: "Stats Bot Daily" });

    await message.channel.send({ embeds: [embed] });
  }
});

// 6️⃣ Error handler
client.on('error', (error) => console.error('Discord client error:', error));

// 7️⃣ Login bot
if (!TOKEN) { console.error('❌ DISCORD_BOT_TOKEN is not set!'); process.exit(1); }
client.login(TOKEN);
