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
    //https://api.ellipsis-drive.com/v1/tileService/01104b4f-85a7-482c-9ada-11dbce171982/0/01f63a0d-3f92-42d3-925d-b3bfaf6dd6a1/%7Bz%7D/%7Bx%7D/%7By%7D
    addTo(map) {
        map.addSource(this.id, {
            type: 'raster',
            tiles: [
                this.url
            ],
            tileSize: 128 //TODO check what the tile size is
        });

        map.addLayer(this);

        this.on('add', () => console.log('added'));

        // map.on('zoomend', () => {
        //     console.log(map);
        // });

        // map.on('moveend', () => {
        //     console.log(map);
        //     console.log(this.boundsToTiles(map.getBounds(), map.getZoom()));
        // });

        
    }

    // boundsToTiles = (bounds, zoom) => {
    //     const xMin = Math.max(bounds.getWest(), -180);
    //     const xMax = Math.min(bounds.getEast(), 180);
    //     const yMin = Math.max(bounds.getSouth(), -85);
    //     const yMax = Math.min(bounds.getNorth(), 85);
    
    //     const zoomComp = Math.pow(2, zoom);
    //     const comp1 = zoomComp / 360;
    //     const pi = Math.PI;
    //     const comp2 = 2 * pi;
    //     const comp3 = pi / 4;
    
    //     const tileXMin = Math.floor((xMin + 180) * comp1);
    //     const tileXMax = Math.floor((xMax + 180) * comp1);
    //     const tileYMin = Math.floor(
    //         (zoomComp / comp2) *
    //         (pi - Math.log(Math.tan(comp3 + (yMax / 360) * pi)))
    //     );
    //     const tileYMax = Math.floor(
    //         (zoomComp / comp2) *
    //         (pi - Math.log(Math.tan(comp3 + (yMin / 360) * pi)))
    //     );
    
    //     let tiles = [];
    //     for(let x = Math.max(0, tileXMin - 1); x <= Math.min(2 ** zoom - 1, tileXMax + 1); x++) {
    //         for(let y = Math.max(0, tileYMin - 1); y <= Math.min(2 ** zoom - 1, tileYMax + 1); y++) {
    //             tiles.push({ zoom, tileX: x, tileY: y });
    //         }
    //     }
    //     return tiles;
    // };
}

