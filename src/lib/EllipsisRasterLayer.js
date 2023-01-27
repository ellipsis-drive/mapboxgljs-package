import getEllipsisUtilObject from "./getEllipsisUtilObject";
const RasterLayerUtil = getEllipsisUtilObject("RasterLayerUtil");

class EllipsisRasterLayer {
  constructor(options) {
    if (options.url) {
      this.url = options.url;
    } else {
      this.url = RasterLayerUtil.getSlippyMapUrl(options);
    }
    if (options.id) {
      this.id = options.id;
    } else {
      this.id = RasterLayerUtil.getLayerId(options);
    }
    this.options = options;
    console.log(this);
  }

  addTo(map) {
    this.source = `${this.id}_source`;
    map.addSource(this.source, {
      type: "raster",
      tiles: [this.url],
      tileSize: 256,
    });

    map.addLayer({
      id: this.id,
      type: "raster",
      source: `${this.id}_source`,
      maxZoom: this.options.zoom,
    });
    return this;
  }
}

export default EllipsisRasterLayer;
