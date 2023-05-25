const axios = require('axios');

async function tiktok_downloader(url) {
  try {
    const options = {
      method: 'GET',
      url: 'https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/vid/index',
      params: {
        url: url
      },
      headers: {
        'X-RapidAPI-Key': '1d8c875e10msh8a0d491d78f0dc5p1ffffejsn677cd3fb970e',
        'X-RapidAPI-Host': 'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    const tiktok_link = response.data.video[0];
    return tiktok_link;
  } catch (error) {
  }
}

module.exports = {
  tiktok_downloader
};
