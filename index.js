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

// ENV
const PANEL_CHANNEL = process.env.CHANNEL_ID;        // contoh: #ts / #test
const ORDER_CHANNEL = process.env.ORDER_CHANNEL_ID;  // contoh: #order-vip
const QRIS_IMAGE = process.env.QRIS_IMAGE_URL;       // link gambar QRIS

// Simpan pilihan durasi per user (sementara)
const userChoice = new Map();

client.once("ready", async () => {
  console.log("✅ Bot Online!");

  if (!PANEL_CHANNEL || !ORDER_CHANNEL) {
    console.log("❌ ENV kurang. Pastikan CHANNEL_ID & ORDER_CHANNEL_ID sudah di set.");
    return;
  }

  const channel = await client.channels.fetch(PANEL_CHANNEL);

  // Panel store (tanpa list harga)
  const embed = new EmbedBuilder()
    .setTitle("🚀 DN VIP SCRIPTS")
    .setDescription(`
💎 Script Roblox Premium  
⚡ Auto Process 24/7  
🔒 Aman & Terpercaya  

🛒 **Cara Order:**
1️⃣ Pilih Durasi Script  
2️⃣ Klik **BELI SEKARANG**  
3️⃣ Scan QRIS  
4️⃣ Klik **BUAT TICKET** dan kirim bukti bayar
`)
    .setColor(0x00ff99);

  // Dropdown durasi (harga gak ditulis)
  const menu = new StringSelectMenuBuilder()
    .setCustomId("paket_menu")
    .setPlaceholder("▼ Pilih Durasi Script")
    .addOptions(
      { label: "1 Hari", value: "1 Hari" },
      { label: "7 Hari", value: "7 Hari" },
      { label: "14 Hari", value: "14 Hari" },
      { label: "30 Hari", value: "30 Hari" }
    );

  const rowMenu = new ActionRowBuilder().addComponents(menu);

  // Button beli
  const rowBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("buy_now")
      .setLabel("🛒 BELI SEKARANG")
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({ embeds: [embed], components: [rowMenu, rowBtn] });
  console.log("✅ Panel terkirim!");
});

client.on("interactionCreate", async (interaction) => {
  try {
    // Dropdown dipilih
    if (interaction.isStringSelectMenu() && interaction.customId === "paket_menu") {
      userChoice.set(interaction.user.id, interaction.values[0]);

      await interaction.reply({
        content: `✅ Kamu pilih durasi: **${interaction.values[0]}**`,
        ephemeral: true,
      });
      return;
    }

    // Klik BELI SEKARANG => munculin QRIS + tombol BUAT TICKET
    if (interaction.isButton() && interaction.customId === "buy_now") {
      const paket = userChoice.get(interaction.user.id) || "Belum pilih durasi";

      const payEmbed = new EmbedBuilder()
        .setTitle("💳 Pembayaran QRIS")
        .setDescription(`
Paket: **${paket}**

✅ Scan QRIS di bawah  
Setelah bayar klik tombol **BUAT TICKET**
`)
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

    // Klik BUAT TICKET => kirim ke #order-vip (langsung, anti stuck)
    if (interaction.isButton() && interaction.customId === "buat_ticket") {
      // respon cepat dulu biar gak "thinking..."
      await interaction.reply({
        content: "✅ Ticket sedang dibuat...",
        ephemeral: true,
      });

      const orderChannel = await client.channels.fetch(ORDER_CHANNEL);
      const paket = userChoice.get(interaction.user.id) || "Tidak pilih durasi";

      await orderChannel.send(`
🎫 **ORDER MASUK**
User: <@${interaction.user.id}>
Durasi: **${paket}**

✅ Silakan kirim:
- Username Roblox
- Bukti bayar QRIS
`);

      await interaction.editReply({
        content: "✅ Ticket berhasil dikirim ke channel **#order-vip**!",
      });
      return;
    }
  } catch (err) {
    console.log("ERROR:", err);

    // kalau sudah reply, edit; kalau belum, reply
    if (interaction.replied) {
      await interaction.editReply("❌ Bot error. Cek ORDER_CHANNEL_ID & izin bot di #order-vip.");
    } else {
      await interaction.reply({
        content: "❌ Bot error. Cek ORDER_CHANNEL_ID & izin bot di #order-vip.",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.TOKEN);
