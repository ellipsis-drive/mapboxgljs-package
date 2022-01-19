import getEllipsisUtilObject from './getEllipsisUtilObject';
const RasterLayerUtil = getEllipsisUtilObject('RasterLayerUtil');

class EllipsisRasterLayer {

    constructor(options = { maxZoom: 21 }) {
        this.url = RasterLayerUtil.getSlippyMapUrl(options);
        this.id = RasterLayerUtil.getLayerId(options);
        this.options = options;
    }

    addTo(map) {

        this.source = `${this.id}_source`;
        map.addSource(this.source, {
            type: 'raster',
            tiles: [
                this.url
            ],
            tileSize: 128,
        });

        map.addLayer({
            id: this.id,
            type: 'raster',
            source: `${this.id}_source`,
            maxZoom: this.options.maxZoom
        });
        return this;
    }
}

export default EllipsisRasterLayer;
