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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Railway Variables
const PANEL_CHANNEL = process.env.CHANNEL_ID;        // channel panel (misal #tes)
const ORDER_CHANNEL = process.env.ORDER_CHANNEL_ID;  // channel ticket/order (misal #order-vip)
const QRIS_IMAGE = process.env.QRIS_IMAGE_URL;       // link gambar QRIS

// Simpan pilihan paket per user
const userChoice = new Map();

const PACKAGES = {
  "1hari": { durasi: "1 Hari", harga: "Rp 5.000" },
  "7hari": { durasi: "7 Hari", harga: "Rp 20.000" },
  "14hari": { durasi: "14 Hari", harga: "Rp 35.000" },
  "30hari": { durasi: "30 Hari", harga: "Rp 60.000" },
};

function paketInfo(key) {
  return PACKAGES[key] || { durasi: "Belum pilih", harga: "-" };
}

async function sendPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("🚀 DN VIP SCRIPTS")
    .setDescription(`
💎 Script Roblox Premium  
⚡ Auto Process 24/7  
🔒 Aman & Terpercaya  

🛒 **Cara Order:**
1️⃣ Pilih Durasi + Harga  
2️⃣ Klik **BELI SEKARANG**  
3️⃣ Scan QRIS  
4️⃣ Klik **BUAT TICKET** lalu buka channel ticket
`)
    .setColor(0x00ff99);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("paket_menu")
    .setPlaceholder("▼ Pilih Durasi + Harga")
    .addOptions(
      { label: "1 Hari", description: "Rp 5.000", value: "1hari" },
      { label: "7 Hari", description: "Rp 20.000", value: "7hari" },
      { label: "14 Hari", description: "Rp 35.000", value: "14hari" },
      { label: "30 Hari", description: "Rp 60.000", value: "30hari" }
    );

  const rowMenu = new ActionRowBuilder().addComponents(menu);

  const rowBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("buy_now")
      .setLabel("🛒 BELI SEKARANG")
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({ embeds: [embed], components: [rowMenu, rowBtn] });
}

client.once("ready", async () => {
  console.log("✅ Bot Online:", client.user.tag);
  console.log("ENV CHANNEL_ID =", PANEL_CHANNEL || "(kosong)");
  console.log("ENV ORDER_CHANNEL_ID =", ORDER_CHANNEL || "(kosong)");

  // Auto kirim panel jika CHANNEL_ID ada
  if (PANEL_CHANNEL) {
    try {
      const ch = await client.channels.fetch(PANEL_CHANNEL);
      await sendPanel(ch);
      console.log("✅ Panel auto terkirim!");
    } catch (e) {
      console.log("❌ Gagal kirim panel auto:", e?.message || e);
    }
  } else {
    console.log("⚠️ CHANNEL_ID kosong. Pakai perintah !panel di Discord.");
  }
});

// Manual panel kalau perlu
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (msg.content === "!panel") {
    try {
      await sendPanel(msg.channel);
      await msg.reply("✅ Panel dikirim!");
    } catch (e) {
      await msg.reply("❌ Gagal kirim panel. Cek izin bot (Send Messages/Embed Links).");
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    // Pilih paket
    if (interaction.isStringSelectMenu() && interaction.customId === "paket_menu") {
      userChoice.set(interaction.user.id, interaction.values[0]);
      const { durasi, harga } = paketInfo(interaction.values[0]);

      await interaction.reply({
        content: `✅ Paket: **${durasi}** (${harga})`,
        ephemeral: true,
      });
      return;
    }

    // Klik BELI SEKARANG -> QRIS + tombol BUAT TICKET
    if (interaction.isButton() && interaction.customId === "buy_now") {
      const { durasi, harga } = paketInfo(userChoice.get(interaction.user.id));

      const payEmbed = new EmbedBuilder()
        .setTitle("💳 Pembayaran QRIS")
        .setDescription(`Paket: **${durasi}**\nHarga: **${harga}**\n\nScan QRIS lalu klik **BUAT TICKET**`)
        .setColor(0x00ff99);

      if (QRIS_IMAGE) payEmbed.setImage(QRIS_IMAGE);

      const rowTicket = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("buat_ticket")
          .setLabel("🎫 BUAT TICKET")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({
        embeds: [payEmbed],
        components: [rowTicket],
        ephemeral: true,
      });
      return;
    }

    // Klik BUAT TICKET -> kirim ke #order-vip + kasih tombol buka channel
    if (interaction.isButton() && interaction.customId === "buat_ticket") {
      await interaction.reply({
        content: "✅ Ticket sedang dibuat...",
        ephemeral: true,
      });

      if (!ORDER_CHANNEL) {
        await interaction.editReply("❌ ORDER_CHANNEL_ID belum di-set di Railway.");
        return;
      }

      const orderCh = await client.channels.fetch(ORDER_CHANNEL);
      const { durasi, harga } = paketInfo(userChoice.get(interaction.user.id));

      // kirim order ke channel ticket
      await orderCh.send(`
🎫 **ORDER MASUK**
User: <@${interaction.user.id}>
Paket: **${durasi}** (${harga})

✅ Silakan kirim:
- Username Roblox
- Bukti bayar QRIS
`);

      // tombol link langsung ke channel ticket
      const rowLink = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("➡️ BUKA CHANNEL TICKET")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${interaction.guild.id}/${ORDER_CHANNEL}`)
      );

      await interaction.editReply({
        content: "✅ Ticket berhasil dikirim! Klik tombol di bawah untuk langsung ke channel ticket.",
        components: [rowLink],
      });
      return;
    }
  } catch (e) {
    console.log("❌ ERROR:", e?.message || e);

    const msg = `❌ Error: ${e?.code || "-"} | ${e?.message || e}`;

    if (interaction.replied) {
      await interaction.editReply(msg);
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
