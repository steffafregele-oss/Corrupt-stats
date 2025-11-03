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
function formatNumber(num) {
  try { 
    return num.toLocaleString(); 
  } catch { 
    return "0"; 
  }
}

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

      // Folosim Accounts pentru Hits
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

      // Folosim Accounts pentru Hits
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
