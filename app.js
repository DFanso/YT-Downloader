const express = require("express");
const ytdl = require("ytdl-core");
const youtubePlaylist = require("youtube-playlist");
const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/download", async (req, res) => {
  const url = req.body.url;

  try {
    if (ytdl.validateURL(url)) {
      const videoInfo = await ytdl.getInfo(url);
      const videoFormat = ytdl.chooseFormat(videoInfo.formats, {
        quality: "highestvideo",
      });

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${videoInfo.videoDetails.title}.mp4"`
      );

      ytdl(url, { format: videoFormat })
        .on("progress", (chunkLength, downloaded, total) => {
          const progress = (downloaded / total) * 100;
          console.log(`Downloading: ${progress.toFixed(2)}%`);
        })
        .pipe(res);
    } else if (youtubePlaylist.validateURL(url)) {
      const playlist = await youtubePlaylist(url, "url");
      const playlistFolder = `./downloads/${Date.now()}`;

      if (!fs.existsSync(playlistFolder)) {
        fs.mkdirSync(playlistFolder, { recursive: true });
      }

      res.setHeader("Content-Type", "text/html");
      res.write(`<p>Downloading playlist to ${playlistFolder}</p>`);

      let completed = 0;
      for (const videoUrl of playlist) {
        const videoInfo = await ytdl.getInfo(videoUrl);
        const videoFormat = ytdl.chooseFormat(videoInfo.formats, {
          quality: "highestvideo",
        });

        await new Promise((resolve) => {
          ytdl(videoUrl, { format: videoFormat })
            .on("progress", (chunkLength, downloaded, total) => {
              const progress = (downloaded / total) * 100;
              console.log(`Downloading: ${progress.toFixed(2)}%`);
            })
            .pipe(
              fs.createWriteStream(
                `${playlistFolder}/${videoInfo.videoDetails.title}.mp4`
              )
            )
            .on("finish", () => {
              completed++;
              console.log(
                `Completed downloading ${completed}/${playlist.length} videos`
              );
              resolve();
            });
        });
      }

      res.end(`<p>Finished downloading playlist to ${playlistFolder}</p>`);
    } else {
      res.status(400).send("Invalid YouTube URL");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error: " + error.message);
  }
});

app.listen(3000, () => {
  console.log("App listening on port 3000");
});
