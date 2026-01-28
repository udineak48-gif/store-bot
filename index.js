const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

/*
✅ ENV Railway Variables:
TOKEN = Token Bot
CHANNEL_ID = Channel Panel Store
TICKET_CHANNEL_ID = Channel Ticket/Order
*/

const PANEL_CHANNEL = process.env.CHANNEL_ID;
const TICKET_CHANNEL = process.env.TICKET_CHANNEL_ID;

client.once("ready", async () => {
  console.log("✅ Bot Online!");

  // ✅ Ambil channel panel store
  const channel = await client.channels.fetch(PANEL_CHANNEL);

  // ✅ EMBED STORE PANEL
  const embed = new EmbedBuilder()
    .setTitle("🚀 DN VIP SCRIPTS")
    .setDescription(`
**Pembelian Otomatis & Cepat**

💎 Script Roblox Premium  
⚡ Auto Process 24/7  
🔒 Aman & Terpercaya  

💰 **Harga Script:**  
💠 1 Hari — Rp 5.000  
💠 7 Hari — Rp 20.000  
💠 14 Hari — Rp 35.000  
💠 30 Hari — Rp 60.000  

🛒 **Cara Order:**  
1️⃣ Klik **BELI SEKARANG**  
2️⃣ Bayar via **QRIS**  
3️⃣ Kirim username Roblox + bukti bayar di ticket  

✅ Auto Process • 24/7 Online
`)
    .setColor(0x00ff99);

  // ✅ DROPDOWN MENU + HARGA
  const menu = new StringSelectMenuBuilder()
    .setCustomId("paket_menu")
    .setPlaceholder("▼ Pilih Durasi Script")
    .addOptions(
      { label: "1 Hari", description: "Rp 5.000", value: "1hari" },
      { label: "7 Hari", description: "Rp 20.000", value: "7hari" },
      { label: "14 Hari", description: "Rp 35.000", value: "14hari" },
      { label: "30 Hari", description: "Rp 60.000", value: "30hari" }
    );

  const rowMenu = new ActionRowBuilder().addComponents(menu);

  // ✅ BUTTON BELI SEKARANG
  const rowBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("buy_now")
      .setLabel("🛒 BELI SEKARANG")
      .setStyle(ButtonStyle.Success)
  );

  // ✅ Kirim panel ke Discord
  await channel.send({
    embeds: [embed],
    components: [rowMenu, rowBtn],
  });

  console.log("✅ Panel Store berhasil dikirim!");
});

// ✅ INTERACTION HANDLER
client.on("interactionCreate", async (interaction) => {
  // ✅ Dropdown dipilih
  if (interaction.isStringSelectMenu() && interaction.customId === "paket_menu") {
    await interaction.reply({
      content: `✅ Paket dipilih: **${interaction.values[0]}**\nKlik tombol **BELI SEKARANG** untuk lanjut.`,
      ephemeral: true,
    });
  }

  // ✅ Button BELI SEKARANG
  if (interaction.isButton() && interaction.customId === "buy_now") {
    const ticketChannel = await client.channels.fetch(TICKET_CHANNEL);

    // ✅ Kirim order ke channel ticket
    await ticketChannel.send(
      `🛒 **ORDER BARU!**\nDari: <@${interaction.user.id}>\nSilakan kirim username Roblox + bukti bayar.`
    );

    await interaction.reply({
      content: "✅ Order berhasil! Cek channel ticket untuk lanjut.",
      ephemeral: true,
    });
  }
});

// ✅ Login bot
client.login(process.env.TOKEN);