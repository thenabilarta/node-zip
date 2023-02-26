const express = require("express");
const app = express();
const path = require("path");

const fs = require("fs");
const archiver = require("archiver");

const axios = require("axios");

const asyncHandler = require("express-async-handler");

const moment = require("moment");

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get(
  "/download",
  asyncHandler(async (req, res) => {
    const name = moment().format("YYYY-MM-DD-HH-mm-ss");

    const output = fs.createWriteStream(__dirname + `/${name}.zip`);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on("close", function () {
      console.log(archive.pointer() + " total bytes");
      console.log(
        "archiver has been finalized and the output file descriptor has closed."
      );

      res.download(`./${name}.zip`, `${name}.zip`);

      setTimeout(() => {
        fs.rmSync(`./${name}.zip`, {
          force: true,
        });
      }, 10000);
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on("end", function () {
      console.log("Data has been drained");
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on("warning", function (err) {
      if (err.code === "ENOENT") {
        // log warning
      } else {
        // throw error
        throw err;
      }
    });

    archive.on("error", function (err) {
      throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);

    const url = [
      "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/assortment-of-colorful-ripe-tropical-fruits-top-royalty-free-image-995518546-1564092355.jpg",
      "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/assortment-of-colorful-ripe-tropical-fruits-top-royalty-free-image-995518546-1564092355.jpg",
      "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/assortment-of-colorful-ripe-tropical-fruits-top-royalty-free-image-995518546-1564092355.jpg",
      "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/assortment-of-colorful-ripe-tropical-fruits-top-royalty-free-image-995518546-1564092355.jpg",
      "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/assortment-of-colorful-ripe-tropical-fruits-top-royalty-free-image-995518546-1564092355.jpg",
    ];

    const promiseArray = [];

    url.forEach((u, i) => {
      promiseArray.push(
        new Promise(async (resolve, reject) => {
          const response = await axios.get(u, { responseType: "arraybuffer" });

          const buffer = Buffer.from(response.data, "binary");

          const fileName = u.split("/").pop();

          if (i < 2) {
            archive.append(buffer, {
              name: moment().valueOf() + fileName,
            });
          } else {
            archive.append(buffer, { name: moment().valueOf() + fileName });
          }

          resolve();
        })
      );
    });

    Promise.all(promiseArray).then(async (values) => {
      await archive.finalize();
    });
  })
);

app.get("/delete", (req, res) => {
  fs.rmSync("./test.zip", {
    force: true,
  });

  res.send("ok");
});

app.listen(9999, () => {
  console.log("Listening to port http://localhost:9999");
});
