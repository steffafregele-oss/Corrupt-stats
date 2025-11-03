// 1️⃣ Importuri
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const express = require('express');

// 2️⃣ Server Express pentru keep-alive (Render)
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("✅ Bot is alive and running"));
app.listen(PORT, () => console.log(`🚀 Server online on port ${PORT}`));

// 3️⃣ Configurare client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// 4️⃣ Ready event
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`📊 Connected to ${client.guilds.cache.size} servers`);
});

// 5️⃣ Funcție utilă pentru formatare
function formatNumber(num) {
  return Number(num || 0).toLocaleString();
}

// 6️⃣ Comenzi principale
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ====== !stats ======
  if (message.content.startsWith('!stats')) {
    const targetUser = message.mentions.users.first() || message.author;
    const targetId = targetUser.id;

    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();

      if (!data.success || !data.Normal) {
        return message.reply("❌ No stats found for this user.");
      }

      const normal = data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      // 🔹 Totaluri
      const hits = normal.Totals?.Visits || 0;
      const visits = normal.Totals?.Visits || 0;
      const clicks = normal.Totals?.Clicks || 0;

      // 🔹 Cel mai mare hit
      const biggestSummary = normal.Highest?.Summary || 0;
      const biggestRap = normal.Highest?.Rap || 0;
      const biggestRobux = normal.Highest?.Balance || 0;

      // 🔹 Total hit stats
      const totalSummary = normal.Totals?.Summary || 0;
      const totalRap = normal.Totals?.Rap || 0;
      const totalRobux = normal.Totals?.Balance || 0;

      // 🔹 Embed
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(
`─── <a:shine:1434729237545222287> **NORMAL INFO** <a:shine:1434729237545222287> ───

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
\`\`\``
        )
        .setImage("https://i.pinimg.com/originals/67/b1/ef/67b1ef05eb08b416b90323b73e6cf1c5.gif")
        .setFooter({ text: "Stats Bot" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error("❌ Error fetching stats:", err);
      message.reply("⚠️ Error fetching stats. Please try again later.");
    }
  }

  // ====== !daily ======
  if (message.content.startsWith('!daily')) {
    const targetUser = message.mentions.users.first() || message.author;
    const targetId = targetUser.id;

    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();

      if (!data.success || !data.Normal) {
        return message.reply("❌ No stats found for this user.");
      }

      const daily = data.Daily || data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const dailyHits = daily.Totals?.Visits || 0;
      const dailyVisits = daily.Totals?.Visits || 0;
      const dailyClicks = daily.Totals?.Clicks || 0;

      const biggestSummary = daily.Highest?.Summary || 0;
      const biggestRap = daily.Highest?.Rap || 0;
      const biggestRobux = daily.Highest?.Balance || 0;

      const dailySummary = daily.Totals?.Summary || 0;
      const dailyRap = daily.Totals?.Rap || 0;
      const dailyRobux = daily.Totals?.Balance || 0;

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(
`─── <a:shine:1434729237545222287> **DAILY STATS** <a:shine:1434729237545222287> ───

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
\`\`\``
        )
        .setImage("https://i.pinimg.com/originals/67/b1/ef/67b1ef05eb08b416b90323b73e6cf1c5.gif")
        .setFooter({ text: "Stats Bot Daily" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error("❌ Error fetching daily stats:", err);
      message.reply("⚠️ Error fetching daily stats. Please try again later.");
    }
  }
});

// 7️⃣ Error handling
client.on('error', (err) => console.error("⚠️ Discord client error:", err));

// 8️⃣ Token
if (!TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN missing in environment variables!");
  process.exit(1);
}

// 9️⃣ Login
client.login(TOKEN);