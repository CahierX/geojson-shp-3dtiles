/*
 * @Descripttion: 
 * @Author: cbz
 * @Date: 2021-01-18 18:11:26
 * @LastEditors: cbz
 * @LastEditTime: 2021-01-25 10:37:59
 */
const fs = require('fs');
const path = require('path');
const Axios = require('axios');
const chunk = require('lodash').chunk;
const TileLnglatTransform = require('tile-lnglat-transform');
var progress = require('child_process');
const StreamZip = require('node-stream-zip');
const { convert } = require('geojson2shp')
var express = require('express');

var app = express();
const url = require("url");

//设置跨域访问
app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", ' 3.2.1');
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});
// get 获取数据接口
app.get('/getData', function (req, res) {
  // 需要爬取的经纬度范围（左上角、右下角）
  var params = url.parse(req.url, true).query
  const paramsLnglatRange = params.lnglatRange.split(',')
  const zoom = params.zoom
  const lnglatRange = [[Number(paramsLnglatRange[0]), Number(paramsLnglatRange[1])], [Number(paramsLnglatRange[2]), Number(paramsLnglatRange[3])],]

  // 单个请求的瓦片数量

  const lnglatToTilesRange = lnglat =>
    TileLnglatTransform.TileLnglatTransformGaode.lnglatToTile(
      lnglat[0],
      lnglat[1],
      zoom
    );

  const tilesRange = {
    minX: lnglatToTilesRange(lnglatRange[0]).tileX,
    minY: lnglatToTilesRange(lnglatRange[0]).tileY,
    maxX: lnglatToTilesRange(lnglatRange[1]).tileX,
    maxY: lnglatToTilesRange(lnglatRange[1]).tileY,
  };


  const tileList = [];
  const area = {
    x: tilesRange.minX,
    y: tilesRange.minY,
  };
  while (area.x <= tilesRange.maxX && area.y <= tilesRange.maxY) {
    area.x += 1;
    tileList.push([area.x, area.y]);
    if (area.x === tilesRange.maxX) {
      area.x = tilesRange.minX;
      area.y += 1;
    }
  }
  const reqQueue = chunk(tileList).map(chunk => {
    const tileStr = chunk.map(tile => {
      // https://c-data.3dbuildings.com/tile/13/6859/3347.pbf?token=dixw8kmb
      // return `https://data.osmbuildings.org/0.2/anonymous/tile/${zoom}/${tile[0]}/${tile[1]}.json`
      return `https://d-data.onegeo.co/maps/tiles/${zoom}/${tile[0]}/${tile[1]}.json?token=b0ce721f1d4a4f29`
    });
    return tileStr;
  });

  const writeGeoJsonFile = async features => {
    const geojson = {
      type: 'FeatureCollection',
      features,
    };
    const BASRHEIGHT = 60; // 基础高度
    for (let item of geojson.features) {
      if (item) {
        if (item.properties) {
          item.properties.height = BASRHEIGHT + Number(item.properties.height || 0)
        } else {
          item.properties = {
            height: BASRHEIGHT
          }
        }
      }

    }
    await fs.writeFile(
      path.join(__dirname, './dist/buildings.geojson'),
      JSON.stringify(geojson),
      'utf-8',
      async err => {
        if (err) {
          throw err;
        }
        const options = {
          layer: 'my-layer',
          schema: [{ name: 'name', type: 'character', length: 80 },
          { name: 'type', type: 'character', length: 80 },
          { name: 'height', type: 'number' },
          { name: 'levels', type: 'number' },
          { name: 'date', type: 'number' }]
        }
        console.log('geojson生成完毕！');
        await convert('./dist/buildings.geojson', './dist/shp/buildings-shp.zip', options)
        console.log('geojson转shp成功!');
        const zip = new StreamZip({
          file: './dist/shp/buildings-shp.zip',
          storeEntries: true
        });
        await zip.on('ready', async () => {
          await zip.extract(null, './dist/shp', async (err, count) => {
            console.log(err ? 'Extract error' : `Extracted ${count} entries`);
            console.log('解压shp.zip成功!');
            await zip.close();
            var cmd = `${path.resolve('./')}./3dtiles/3dtile.exe -f shape -i ./dist/shp/my-layer.shp -o ./dist/3dtilesFiles --height height`;
            await progress.exec(cmd, function (err, stdout, stderr) {
              if (err) throw err
              console.log("生成3dtiles数据成功!");
              setTimeout(() => {
                res.write(JSON.stringify({
                  code: 200,
                  data: {
                    geojson: `http://127.0.0.1:3000/dist/buildings.geojson`,
                    shp: `http://127.0.0.1:3000/dist/shp/my-layer.shp`,
                    tiles: `http://127.0.0.1:3000/dist/3dtilesFiles/tileset.json`
                  }
                }));
                res.end();
              }, 1000);

            });

          });
        });
      }
    );

  };

  let fullFeatures = [];
  const execQueue = async () => {
    const urlList = reqQueue
    for (let item of urlList) {
      for (let url of item) {
        console.log(`爬取瓦片源：${url}`);
        const res = await Axios.get(url, {
          headers: {
            'Accept': '*/*',
            'Cache-Control': 'no-cache',
            'Referer': 'https://onegeo.co/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        })
        if (res.data.features) {
          fullFeatures = fullFeatures.concat(res.data.features)
        }
      }
    }

    writeGeoJsonFile(fullFeatures);

  };

  execQueue();
});

//配置服务端口
var server = app.listen(3000, function () {

  var host = server.address().address;

  var port = server.address().port;

  console.log(`app listening at http://${host}:${port}`);
})
app.use('/dist', express.static('./dist'));

