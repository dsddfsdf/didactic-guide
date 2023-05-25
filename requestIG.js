const axios = require('axios');

async function DownloaderMethod(insta_url){
  try {
    const options = {
      method: 'GET',
      url: 'https://instagram-media-downloader.p.rapidapi.com/rapid/post.php',
      params: {
        url: insta_url
      },
      headers: {
        'X-RapidAPI-Key': '1d8c875e10msh8a0d491d78f0dc5p1ffffejsn677cd3fb970e',
        'X-RapidAPI-Host': 'instagram-media-downloader.p.rapidapi.com'
      }
    };
    const response = await axios.request(options);
    const result = {
      videoUrl: response.data.video,
      caption: response.data.caption
    }
    return result;
  } catch (error) {
  }
}

module.exports = {
  DownloaderMethod
};
