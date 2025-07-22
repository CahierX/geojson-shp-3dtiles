<!--
 * @Descripttion:
 * @Author: cbz
 * @Date: 2021-01-25 10:34:28
 * @LastEditors: cbz
 * @LastEditTime: 2021-01-25 10:51:48
-->
先看效果图
![image](https://user-images.githubusercontent.com/31394482/121152676-ff9bdc00-c877-11eb-89ec-1305e6e7ec80.png)
https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9c0b6ac1892d4f08ab997de3432f55bc~tplv-k3u1fbpfcp-watermark.image
https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/72ed70f6dc834a91944e4eda9948e313~tplv-k3u1fbpfcp-watermark.image
# 3d-buildings-geojson

Obtain 3d buildings data in this area by drawing the area frame on the map to generate geojson, shp, 3dtiles format data<br>
通过在地图上绘制区域框获取此区域内 3d buildings 数据 生成 geojson, shp, 3dtiles 格式数据

## Doc

#### 1. Clone remote codes to local, then use the `yarn` command to install the project in local directory.

#### 2. Execute `mkdir dist` and dist/shp in the project root directory (do not need to do this if the directory already exists).

#### 3. Incoming map data GET.

```
lnglatRange: Pass in the latitude and longitude of the upper left and lower right corners of the rectangle drawn on the map
zoom: map zoom
http://127.0.0.1:3000/getData?lnglatRange=lng,lat,lng1,lat1&zoom=15
```

#### 4. Execute `yarn start` in the project root directory, the retrieved data will be stored in the `dist` directory as a `.geojson` file.

## 说明

#### 1. clone 代码到本地，根目录使用 `yarn` 命令安装项目

#### 2. 项目根目录下执行 新建 dist 文件夹和 dist/shp 文件夹 （若目录已存在则不需要）

#### 3. 传入地图数据 get 请求：

```
lnglatRange: 传入在地图上绘制矩形边框的矩形左上角和右下角经纬度
zoom: 地图缩放级别
http://127.0.0.1:3000/getData?lnglatRange=lng,lat,lng1,lat1&zoom=15
```

#### 4. 项目根目录下执行 `node index.js`，爬取的 `.geojson shp 3dtiles` 数据将存储到 `dist` 目录下
