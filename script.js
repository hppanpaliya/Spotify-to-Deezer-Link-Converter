const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";

class DeezerSearch {
  searchArtist(artist) {
    return this.fetchWithProxy(`https://api.deezer.com/search/artist?order=RANKING&q=artist:"${artist}"`).then((response) => response.data[0]);
  }

  searchAlbum(albumTitle, artist) {
    return this.fetchWithProxy(`https://api.deezer.com/search/album?order=RANKING&q=artist:"${artist}" album:"${albumTitle}"`).then(
      (response) => response.data[0]
    );
  }

  searchSong(trackTitle, artist) {
    let query = `track:"${trackTitle}"`;
    if (artist) {
      query += ` artist:"${artist}"`;
    }
    return this.fetchWithProxy(`https://api.deezer.com/search/track?order=RANKING&q=${encodeURIComponent(query)}`).then(
      (response) => response.data[0]
    );
  }

  searchPlaylist(playlistName) {
    return this.fetchWithProxy(`https://api.deezer.com/search/playlist?strict=on&q=${playlistName}`).then((response) => response.data[0]);
  }

  fetchWithProxy(url) {
    return fetch(CORS_PROXY + url).then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    });
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

function fetchTrackInfo(id) {
  fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${id}`)
    .then((response) => response.json())
    .then((data) => {
      const title = data.title;
      let trackTitle, artist;

      const byMatch = title.match(/(.*) by (.*)/);
      if (byMatch) {
        [, trackTitle, artist] = byMatch;
      } else {
        const featMatch = title.match(/(.*) \(feat\. (.*)\)/);
        if (featMatch) {
          [, trackTitle, artist] = featMatch;
        } else {
          trackTitle = title;
          artist = null;
        }
      }

      deezer
        .searchSong(trackTitle, artist)
        .then((song) => {
          if (song) {
            displayResult(song.link);
          } else {
            throw new Error("Track not found");
          }
        })
        .catch((error) => {
          if (error.message === "Network response was not ok") {
            handleCORSError();
          } else {
            document.getElementById("result").textContent = "Track not found on Deezer.";
          }
        });
    });
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
