// 1️⃣ Importuri
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionsBitField 
} = require('discord.js');
const fetch = require('node-fetch');
const keepAlive = require('./keep_alive'); 
keepAlive(); 

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

// 2️⃣ Token și rol admin
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const ADMIN_ROLE_ID = '1433970414706622504';

// 3️⃣ Ticket counter
let ticketCount = 1;
let lastUpTime = null;
let lastStatus = null; // pentru !check

// 4️⃣ Ready
client.once('ready', () => {
  console.log(`✅ Bot online ca ${client.user.tag}`);
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

// 6️⃣ Ticket panel
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === '!ticket panel set') {
    const embed = new EmbedBuilder()
      .setTitle('<a:emoji_23:1437165438315532431> SUPPORT TICKET SYSTEM')
      .setDescription(
        `<a:emoji_21:1437163698161717468> Need Help? Click below to create a support ticket.\n` +
        `<a:emoji_21:1437163698161717468> Staff will assist you soon.\n` +
        `<a:emoji_21:1437163698161717468> Describe your issue clearly.\n` +
        `<a:emoji_21:1437163698161717468> Available 24/7`
      )
      .setColor('#89CFF0')
      .setThumbnail('https://cdn.discordapp.com/emojis/1437165310775132160.gif')
      .setImage('https://i.imgur.com/rCQ33gA.gif');

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Create Ticket')
      .setEmoji('1437155312527347915')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(button);
    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// 7️⃣ Interaction listener
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'create_ticket') {
    await interaction.deferReply({ ephemeral: true });
    try {
      const channelName = `ticket-${String(ticketCount).padStart(3, '0')}`;
      ticketCount++;

      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ] },
          { id: ADMIN_ROLE_ID, allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ] }
        ]
      });

      const ticketEmbed = new EmbedBuilder()
        .setTitle('<a:emoji_23:1437165438315532431> TICKET CREATED')
        .setDescription(
          `<a:emoji_21:1437163698161717468> <@${interaction.user.id}> created this ticket!\n` +
          `<a:emoji_21:1437163698161717468> Describe your issue.\n` +
          `<a:emoji_21:1437163698161717468> Staff will respond shortly.`
        )
        .setColor('#89CFF0')
        .setThumbnail('https://cdn.discordapp.com/emojis/1437165310775132160.gif')
        .setImage('https://i.imgur.com/rCQ33gA.gif')
        .setTimestamp();

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger);

      const row2 = new ActionRowBuilder().addComponents(closeButton);
      await ticketChannel.send({ embeds: [ticketEmbed], components: [row2] });

      await interaction.editReply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌ Error creating ticket.', ephemeral: true });
    }
  }

  if (interaction.customId === 'close_ticket') {
    await interaction.reply({ content: '🔒 Closing ticket...', ephemeral: true });
    setTimeout(async () => { await interaction.channel.delete().catch(() => {}); }, 2000);
  }
});

// 8️⃣ Comanda !stats / !stats @user
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // ===== !stats =====
  if (message.content.startsWith('!stats')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();
      if (!data.success || !data.Normal) return message.reply('❌ No stats found.');

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
        .setColor('#89CFF0')
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(
          `<a:emoji_22:1437165310775132160> NORMAL INFO\n` +
          `<a:emoji_21:1437163698161717468> User: **${userName}**\n\n` +
          `<a:emoji_21:1437163698161717468> TOTAL STATS:\nHits: ${formatNumber(hits)}\nVisits: ${formatNumber(visits)}\nClicks: ${formatNumber(clicks)}\n\n` +
          `<a:emoji_21:1437163698161717468> BIGGEST HIT:\nSummary: ${formatNumber(biggestSummary)}\nRAP: ${formatNumber(biggestRap)}\nRobux: ${formatNumber(biggestRobux)}\n\n` +
          `<a:emoji_21:1437163698161717468> TOTAL HIT STATS:\nSummary: ${formatNumber(totalSummary)}\nRAP: ${formatNumber(totalRap)}\nRobux: ${formatNumber(totalRobux)}`
        )
        .setImage('https://i.imgur.com/rCQ33gA.gif')
        .setFooter({ text: 'Stats Bot' });

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      message.reply('❌ Error fetching stats.');
    }
  }

  // ===== !daily =====
  if (message.content.startsWith('!daily')) {
    try {
      const res = await fetch('https://api.injuries.lu/v2/daily?type=0x2&cs=3&ref=corrupteds');
      const data = await res.json();
      if (!data.success) return message.reply('❌ No daily stats found.');

      const daily = data.Daily || {};
      const profile = data.Profile || {};
      const hits = daily.Totals?.Accounts || 0;
      const visits = daily.Totals?.Visits || 0;
      const clicks = daily.Totals?.Clicks || 0;
      const biggestSummary = daily.Highest?.Summary || 0;
      const biggestRap = daily.Highest?.Rap || 0;
      const biggestRobux = daily.Highest?.Balance || 0;
      const totalSummary = daily.Totals?.Summary || 0;
      const totalRap = daily.Totals?.Rap || 0;
      const totalRobux = daily.Totals?.Balance || 0;
      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor('#89CFF0')
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(
          `<a:emoji_22:1437165310775132160> DAILY INFO\n` +
          `<a:emoji_21:1437163698161717468> User: **${userName}**\n\n` +
          `<a:emoji_21:1437163698161717468> DAILY STATS:\nHits: ${formatNumber(hits)}\nVisits: ${formatNumber(visits)}\nClicks: ${formatNumber(clicks)}\n\n` +
          `<a:emoji_21:1437163698161717468> BIGGEST HIT:\nSummary: ${formatNumber(biggestSummary)}\nRAP: ${formatNumber(biggestRap)}\nRobux: ${formatNumber(biggestRobux)}\n\n` +
          `<a:emoji_21:1437163698161717468> TOTAL HIT STATS:\nSummary: ${formatNumber(totalSummary)}\nRAP: ${formatNumber(totalRap)}\nRobux: ${formatNumber(totalRobux)}`
        )
        .setImage('https://i.imgur.com/rCQ33gA.gif')
        .setFooter({ text: 'Stats Bot Daily' });

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      message.reply('❌ Error fetching daily stats.');
    }
  }

  // ===== !check =====
  if (message.content.startsWith('!check')) {
    try {
      const start = Date.now();
      let res, ping;

      try {
        const response = await fetch('https://www.logged.tg/auth/corrupteds');
        res = { ok: response.ok };
        ping = Date.now() - start;
      } catch {
        res = { ok: false };
        ping = null;
      }

      let statusText = res.ok ? "<a:emoji_22:1437165310775132160> ONLINE" : "<a:emoji_22:1437165310775132160> OFFLINE";
      if (res.ok && !lastUpTime) lastUpTime = Date.now();
      if (!res.ok) lastUpTime = null;
      const uptimeText = res.ok ? `UP for **${formatDuration(Date.now() - lastUpTime)}**` : "❌ No uptime data";

      const embed = new EmbedBuilder()
        .setColor('#89CFF0')
        .setThumbnail('https://cdn.discordapp.com/emojis/1437165310775132160.gif')
        .setDescription(
          `<a:emoji_22:1437165310775132160> SITE STATUS\n` +
          `<a:emoji_21:1437163698161717468> **STATUS:** ${statusText}\n` +
          `<a:emoji_21:1437163698161717468> **UPTIME:** ${uptimeText}\n` +
          `\`\`\`Response Time: ${ping ? ping + "ms" : "N/A"}\`\`\``
        )
        .setImage('https://i.imgur.com/rCQ33gA.gif')
        .setFooter({ text: 'Site Uptime Monitor' });

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      lastUpTime = null;
      const embed = new EmbedBuilder()
        .setColor('#89CFF0')
        .setThumbnail('https://cdn.discordapp.com/emojis/1437165310775132160.gif')
        .setDescription(
          `<a:emoji_22:1437165310775132160> SITE STATUS\n` +
          `<a:emoji_21:1437163698161717468> **STATUS:** OFFLINE\n` +
          `<a:emoji_21:1437163698161717468> **UPTIME:** No uptime data`
        )
        .setImage('https://i.imgur.com/rCQ33gA.gif')
        .setFooter({ text: 'Site Uptime Monitor' });

      await message.channel.send({ embeds: [embed] });
    }
  }
});

// 9️⃣ Login
client.login(TOKEN);
