const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const TelegramBot = require('node-telegram-bot-api');
const SpotifyWebApi = require('spotify-web-api-node');
const { DownloaderMethod } = require('./requestIG');
const { tiktok_downloader } = require('./requestTT');
require('dotenv').config();

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

app.use(express.json());

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get(`/bot${token}`, (req, res) => {
  res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    '👋 Assalomu Alaykum! Ushbu bot orqali Instagram va TikTok dan videolarni va musiqalar yuklab olishingiz mumkin. Videoning havolasini (linkini) yuboring musiqa uchun /music deb musiqani nomini yozing:'
  ).then(() => {
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "➕ Obuna Bo'lish", url: 't.me/Sara_Xabarlar' }],
          [{ text: "➕ Obuna Bo'lish", url: 't.me/Tilla_Prikol' }],
          [{ text: "✅ Tasdiqlash", callback_data: 'confirm' }]
        ]
      }
    };
    bot.sendMessage(chatId, "Iltimos, quyidagi kanallarimizga obuna boʻling, keyin botni ishlatishingiz mumkin.", options);
  });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Botdan foydalanish uchun quyidagi buyruqlardan foydalaning:\n\nInstagram yoki TikTokdan videoning URL havolasini yuboring, keyin video yuklanadi.'
  );
});

bot.on('message', async (message) => {
  try {
    const chatId = message.chat.id;
    const text = message.text.toLowerCase();

    if (text === '/start' || text === '/help') {
      return;
    }

    const urlRegex = /(http(s)?:\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?/;
    if (!urlRegex.test(text)) {
      bot.sendMessage(chatId, 'Noto\'g\'ri URL, iltimos, qaytadan urinib ko\'ring.');
      return;
    }

    let videoUrl, caption = '';

    if (text.includes('tiktok.com')) {
      const tiktokData = await tiktok_downloader(message.text);
      videoUrl = tiktokData;
      caption = tiktokData.caption;
    } else if (text.includes('instagram.com')) {
      const igData = await DownloaderMethod(message.text); // Corrected function name
      videoUrl = igData.videoUrl;
      caption = igData.caption;
    } else {
      bot.sendMessage(chatId, 'Qo\'llanilmaydigan URL, iltimos, qaytadan urinib ko\'ring.');
      return;
    }

    await bot.sendVideo(chatId, videoUrl, {
      caption: caption + "\n @Yuklovchi_IG_TT_bot orqali yuklab olindi 📥"
    }).then(() => {
      const options = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "➕ Obuna Bo'lish", url: 't.me/Prikollar_qiziqarli_kulguli' }],
            [{ text: "➕ Obuna Bo'lish", url: 'https://t.me/Farzand_tarbiyasi_uzb' }],
            [{ text: "✅ Tasdiqlash", callback_data: 'confirm' }]
          ]
        }
      };
      bot.sendMessage(chatId, "Iltimos, quyidagi kanallarimizga obuna boʻling, keyin botni ishlatishingiz mumkin.", options);
    });
  } catch (error) {
  }
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'confirm') {
    bot.sendMessage(chatId, 'Botni ishlatavering✅');
  }
});

// Obtain and set the access token
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

spotifyApi.clientCredentialsGrant().then((data) => {
  spotifyApi.setAccessToken(data.body.access_token);
}).catch((error) => {
  console.error('Access token retrieval error:', error);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Botdan foydalanish uchun quyidagi buyruqlardan foydalaning:\n\n/music <musiqani nomi> - Musiqani Spotifydan qidirib olish'
  );
});

bot.onText(/\/music (.+)/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const searchQuery = match[1];

    const response = await spotifyApi.searchTracks(searchQuery, { limit: 5 });
    const tracks = response.body.tracks.items;

    if (tracks.length === 0) {
      bot.sendMessage(chatId, 'Musiqani topa olmadim.');
      return;
    }

    const options = {
      reply_markup: {
        inline_keyboard: tracks.map((track, index) => ([
          {
            text: `${index + 1}. ${track.name} - ${track.artists[0].name}`,
            callback_data: `spotify:${index}:${track.id}:${track.name}`,
          }
        ])),
      },
    };

    bot.sendMessage(chatId, `Quyidagi variantlar topildi:\n${tracks.map((track, index) => `${index + 1}. ${track.name} - ${track.artists[0].name}`).join('\n')}`, options);

    // Add ad message
    bot.sendMessage(chatId, '📣 Check out our sponsor for the best music deals and discounts! 🎶');
  } catch (error) {
    console.error('Spotify search error:', error);
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const [spotifyPrefix, index, trackId, trackName] = query.data.split(':');

  if (spotifyPrefix === 'spotify') {
    try {
      const response = await spotifyApi.getTrack(trackId);
      const track = response.body;

      if (track.preview_url) {
        // Send the preview picture
        if (track.album && track.album.images && track.album.images.length > 0) {
          const previewImageUrl = track.album.images[0].url;
          bot.sendPhoto(chatId, previewImageUrl, {
            caption: `${index}. ${trackName} - ${track.artists[0].name}`,
          });
        }

        // Send the audio message
        bot.sendAudio(chatId, track.preview_url, {
          caption: `${index}. ${trackName} - ${track.artists[0].name}`,
        });

        // Add ad message
        bot.sendMessage(chatId, '📣 Check out our sponsor for the best music deals and discounts! 🎶');
      } else {
        bot.sendMessage(chatId, 'No audio preview available for this track.');
      }
    } catch (error) {
      console.error('Spotify track retrieval error:', error);
    }
  }
});

app.listen(port, () => {
  console.log(`Server ishga tushdi va port ${port}da tinglashni boshladi`);
});
