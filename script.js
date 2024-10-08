const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";

class DeezerSearch {
  async searchArtist(artist) {
    const response = await this.fetchWithProxy(`https://api.deezer.com/search/artist?order=RANKING&q=artist:"${artist}"`);
    return response.data[0];
  }

  async searchAlbum(albumTitle, artist) {
    const response = await this.fetchWithProxy(`https://api.deezer.com/search/album?order=RANKING&q=artist:"${artist}" album:"${albumTitle}"`);
    return response.data[0];
  }

  async searchSong(trackTitle, artist) {
    let query = `track:"${trackTitle}"`;
    if (artist) {
      query += ` artist:"${artist}"`;
    }
    const response = await this.fetchWithProxy(`https://api.deezer.com/search/track?order=RANKING&q=${encodeURIComponent(query)}`);
    return response.data[0];
  }

  async searchPlaylist(playlistName) {
    const response = await this.fetchWithProxy(`https://api.deezer.com/search/playlist?strict=on&q=${playlistName}`);
    return response.data[0];
  }

  async fetchWithProxy(url) {
    const response = await fetch(CORS_PROXY + url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return await response.json();
  }
}

const deezer = new DeezerSearch();

function convertLink() {
  const spotifyLink = document.getElementById("spotifyLink").value;
  const resultDiv = document.getElementById("result");
  const outputContainer = document.querySelector(".output-container");
  const outputLink = document.getElementById("outputLink");

  outputContainer.style.display = "none";
  resultDiv.textContent = "Converting...";

  if (!spotifyLink.includes("open.spotify.com")) {
    resultDiv.textContent = "Please enter a valid Spotify link.";
    return;
  }

  const [, type, id] = spotifyLink.match(/open\.spotify\.com\/(track|artist|album|playlist)\/([a-zA-Z0-9]+)/);

  switch (type) {
    case "track":
      fetchTrackInfo(id);
      break;
    case "artist":
      fetchArtistInfo(id);
      break;
    case "album":
      fetchAlbumInfo(id);
      break;
    case "playlist":
      fetchPlaylistInfo(id);
      break;
  }
}

function handleCORSError() {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML =
    "CORS error detected. Please request temporary access to the demo server:<br>" +
    '<a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank">https://cors-anywhere.herokuapp.com/corsdemo</a><br>' +
    "After granting access, please try converting again.";
}

async function fetchTrackInfo(id) {
  try {
    // Fetch oembed data
    const oembedResponse = await fetch(`${CORS_PROXY}https://open.spotify.com/oembed?url=https://open.spotify.com/track/${id}`);
    const oembedData = await oembedResponse.json();

    // Extract iframe URL
    const iframeUrl = oembedData.iframe_url;

    // Fetch iframe content
    const iframeResponse = await fetch(CORS_PROXY + iframeUrl);
    const iframeHtml = await iframeResponse.text();

    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(iframeHtml, "text/html");

    // Extract track and artist information
    const trackTitle = doc.querySelector('.TitleAndSubtitle_title__Nwyku [data-encore-id="textLink"]').textContent;
    const artist = doc.querySelector('.TitleAndSubtitle_subtitle__P1cxq [data-encore-id="textLink"]').textContent;

    console.log(`Track: ${trackTitle}, Artist: ${artist}`);

    // Search for the song on Deezer
    const song = await deezer.searchSong(trackTitle, artist);
    if (song) {
      displayResult(song.link);
    } else {
      throw new Error("Track not found");
    }
  } catch (error) {
    if (error.message === "Network response was not ok") {
      handleCORSError();
    } else {
      document.getElementById("result").textContent = "Track not found on Deezer.";
    }
  }
}

function fetchArtistInfo(id) {
  fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/artist/${id}`)
    .then((response) => response.json())
    .then((data) => {
      deezer
        .searchArtist(data.title)
        .then((artist) => {
          if (artist) {
            displayResult(artist.link);
          } else {
            throw new Error("Artist not found");
          }
        })
        .catch((error) => {
          if (error.message === "Network response was not ok") {
            handleCORSError();
          } else {
            document.getElementById("result").textContent = "Artist not found on Deezer.";
          }
        });
    });
}

function fetchAlbumInfo(id) {
  fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/album/${id}`)
    .then((response) => response.json())
    .then((data) => {
      const [album, artist] = data.title.split(" by ");
      deezer
        .searchAlbum(album, artist)
        .then((album) => {
          if (album) {
            displayResult(album.link);
          } else {
            throw new Error("Album not found");
          }
        })
        .catch((error) => {
          if (error.message === "Network response was not ok") {
            handleCORSError();
          } else {
            document.getElementById("result").textContent = "Album not found on Deezer.";
          }
        });
    });
}

function fetchPlaylistInfo(id) {
  fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/${id}`)
    .then((response) => response.json())
    .then((data) => {
      deezer
        .searchPlaylist(data.title)
        .then((playlist) => {
          if (playlist) {
            displayResult(playlist.link);
          } else {
            throw new Error("Playlist not found");
          }
        })
        .catch((error) => {
          if (error.message === "Network response was not ok") {
            handleCORSError();
          } else {
            document.getElementById("result").textContent = "Playlist not found on Deezer.";
          }
        });
    });
}

function displayResult(link) {
  const resultDiv = document.getElementById("result");
  const outputContainer = document.querySelector(".output-container");
  const outputLink = document.getElementById("outputLink");

  resultDiv.innerHTML = `<a href="${link}" target="_blank">Open in Deezer</a>`;
  outputLink.value = link;
  outputContainer.style.display = "flex";
}

function copyLink() {
  const outputLink = document.getElementById("outputLink");
  outputLink.select();
  document.execCommand("copy");
  alert("Link copied to clipboard!");
}
