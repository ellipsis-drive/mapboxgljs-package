class EllipsisRasterLayer {

    constructor(blockId, captureId, visualizationId, maxZoom = 18, token) {
        this.id = `${blockId}_${captureId}_${visualizationId}`;
        this.source = this.id;
        this.type = 'raster';
        this.url = `${EllipsisApi.apiUrl}/tileService/${blockId}/${captureId}/${visualizationId}/{z}/{x}/{y}`;
        if (token) {
            url += '?token=' + token;
        }
        
    }
    addTo(map) {
        map.addSource(this.id, {
            type: 'raster',
            tiles: [
                this.url
            ],
            tileSize: 128 //TODO check what the tile size is
        });

        map.addLayer(this);
    }
}

