class EllipsisVectorLayer extends L.LayerGroup {

    constructor(blockId, layerId, selectFeature, token, 
        styleId, filter, centerPoints, maxZoom, pageSize, maxMbPerTile, 
        maxTilesInCache, maxFeaturesPerTile, radius, lineWidth) {
        super();

        this.blockId = blockId;
        this.layerId = layerId;
        this.maxZoom = maxZoom;
        this.selectFeatureParam = selectFeature;
        this.token = token;
        this.styleId = styleId;
        this.filter = filter;
        this.centerPoints = centerPoints;
        this.pageSize = Math.min(pageSize, 3000);
        this.maxMbPerTile = maxMbPerTile;
        this.maxTilesInCache = maxTilesInCache;
        this.maxFeaturesPerTile = maxFeaturesPerTile;
        this.radius = radius;
        this.lineWidth = lineWidth;

        this.tiles = [];
        this.geometryLayer = { tiles: [] };
        this.zoom = 1;
        this.changed = false;

        this.on("add", async (x) => {

            this.registerViewportUpdate();

            this.gettingVectorsInterval = setInterval(async () => {
                let loadedSomething = await this.getVectors();
                this.updateView(loadedSomething);
            }, 100);

            this._map.on("zoom", (x) => {
                this.registerViewportUpdate();
                this.viewPortRefreshed = true;
            });

            this._map.on("moveend", (x) => {
                this.registerViewportUpdate();
                this.viewPortRefreshed = true;
            });

            this._map.on("remove", (x) => {
                clearInterval(this.gettingVectorsInterval);
            });
        });
    }
    
    registerViewportUpdate = () => {
        const viewport = getLeafletMapBounds(this._map);
        if (!viewport) return;
        this.zoom = Math.max(Math.min(this.maxZoom, viewport.zoom - 2), 0);
        this.tiles = boundsToTiles(viewport.bounds, this.zoom);
    }

    getVectors = async () => {
        if(this.gettingVectors) return true;
        this.gettingVectors = true;
        const now = Date.now();

        //clear cache
        const keys = Object.keys(this.geometryLayer.tiles);
        if (keys.length > this.maxTilesInCache) {
            let dates = keys.map(
                (k) => this.geometryLayer.tiles[k].date
            );
            dates.sort();
            let clipValue = dates[9];
            keys.forEach(key => {
                if (this.geometryLayer.tiles[key].date <= clipValue) {
                    delete this.geometryLayer.tiles[key];
                }
            })
        }

        //prepare tiles parameter
        let tilesParam = [...this.tiles];
        tilesParam = tilesParam.map((t) => {
            const tileId = `${t.zoom}_${t.tileX}_${t.tileY}`;

            let pageStart;
            if (this.geometryLayer.tiles[tileId]) {
                pageStart = this.geometryLayer.tiles[tileId].nextPageStart;
            }
            if (!this.geometryLayer.tiles[tileId] ||
                (pageStart &&
                    this.geometryLayer.tiles[tileId].amount <
                        this.maxFeaturesPerTile &&
                    this.geometryLayer.tiles[tileId].size <
                        this.maxMbPerTile)
            ) {
                return { tileId: t, pageStart };
            }

            return null;
        });

        tilesParam = tilesParam.filter((x) => x);
        //prepare other parameters

        if (tilesParam.length > 0) {
            //get addtional elements
            await getGeoJsons(
                this.geometryLayer,
                tilesParam,
                this.token,
                this.blockId,
                Math.min(3000, this.pageSize),
                this.layerId,
                this.styleId,
                this.lineWidth,
                this.radius,
                this.selectFeature,
                this.filter,
                now,
                this.centerPoints
            );
            this.gettingVectors = false;
            return true;
        }
        this.gettingVectors = false;
        return false;

    };

    updateView = (loading) => {
        if(!this.tiles || this.tiles.length === 0) return;
        
        if(!this.viewPortRefreshed && !loading) {
            console.log('no need to refresh view');
            return;
        }

        const layerElements = this.tiles.flatMap(t => {
            const geoTile = this.geometryLayer.tiles[t.zoom + "_" + t.tileX + "_" + t.tileY];
            return geoTile ? geoTile.elements : [];
        });

        if(this.viewPortRefreshed) {
            //if still loading, only display new features when there are more
            //than already in the view.
            console.log(`loading: ${loading} -- ${layerElements.length}/${this.getLayers().length}`);
            
            //## 2 different options:
            //1) load double elements when certain percentage is not loaded
            //2) wait with showing newly loaded elements until certain percentage is loaded
            
            // ## option 1
            // if(!loading || this.getLayers().length/2 <= layerElements.length) {
            //     console.log('refreshing tiles');
            //     this.viewPortRefreshed = false;
            //     this.clearLayers();
            // }

            // ## option 2
            if(loading && this.getLayers().length/2 > layerElements.length)
                return;
            console.log('refreshing tiles');
            this.viewPortRefreshed = false;
            this.clearLayers();
        }

        layerElements.forEach(x => {
            if(!this.hasLayer(x))
                this.addLayer(x);
        })
    };

    selectFeature = async (feature) => {
        let body = {
            mapId: this.blockId,
            layerId: this.layerId,
            geometryIds: [feature.properties.id],
            returnType: "all",
        };
        try {
            let result = await EllipsisApi.post(
                "/geometry/ids",
                body,
                this.token
            );
            this.selectFeature({
                size: result.size,
                feature: result.result.features[0],
            });
        } catch (e) {
            console.log(e);
        }
    };
}

const createGeoJsonLayerStyle = (color, fillOpacity, weight) => {
    return {
        color: color ? color : "#3388ff",
        weight: weight ? weight : 5,
        fillOpacity: fillOpacity ? fillOpacity : 0.06,
    };
};

const boundsToTiles = (bounds, zoom) => {
    const xMin = Math.max(bounds.xMin, -180);
    const xMax = Math.min(bounds.xMax, 180);
    const yMin = Math.max(bounds.yMin, -85);
    const yMax = Math.min(bounds.yMax, 85);

    const zoomComp = Math.pow(2, zoom);
    const comp1 = zoomComp / 360;
    const pi = Math.PI;
    const comp2 = 2 * pi;
    const comp3 = pi / 4;

    const tileXMin = Math.floor((xMin + 180) * comp1);
    const tileXMax = Math.floor((xMax + 180) * comp1);
    const tileYMin = Math.floor(
        (zoomComp / comp2) *
        (pi - Math.log(Math.tan(comp3 + (yMax / 360) * pi)))
    );
    const tileYMax = Math.floor(
        (zoomComp / comp2) *
        (pi - Math.log(Math.tan(comp3 + (yMin / 360) * pi)))
    );

    let tiles = [];
    for(let x = Math.max(0, tileXMin - 1); x <= Math.min(2 ** zoom - 1, tileXMax + 1); x++) {
        for(let y = Math.max(0, tileYMin - 1); y <= Math.min(2 ** zoom - 1, tileYMax + 1); y++) {
            tiles.push({ zoom, tileX: x, tileY: y });
        }
    }
    return tiles;
};

const getGeoJsons = async (
    geometryLayer,
    tiles,
    token,
    mapId,
    pageSize,
    layerId,
    styleId,
    lineWidth,
    radius,
    selectFeature,
    filter,
    date,
    showLocation
) => {
    let returnType = showLocation ? "center" : "geometry";
    filter = filter ? (filter.length > 0 ? filter : null) : null;
    // console.log(layerId)
    let body = {
        mapId: mapId,
        returnType: returnType,
        layerId: layerId,
        zip: true,
        pageSize: pageSize,
        styleId: styleId,
        propertyFilter: filter,
    };

    let result = [];

    let chunkSize = 10;
    for (let k = 0; k < tiles.length; k += chunkSize) {
        body.tiles = tiles.slice(k, k + chunkSize);
        try {
            let res = await EllipsisApi.post("/geometry/tile", body, token);
            result = result.concat(res);
        } catch {
            return null;
        }
    }

    for (let j = 0; j < tiles.length; j++) {
        let t = tiles[j];
        let tileId =
            t.tileId.zoom + "_" + t.tileId.tileX + "_" + t.tileId.tileY;

        if (!geometryLayer.tiles[tileId]) {
            geometryLayer.tiles[tileId] = {
                size: 0,
                amount: 0,
                elements: [],
                nextPageStart: null,
            };
        }
        let tileInfo = geometryLayer.tiles[tileId];

        tileInfo.date = date;
        tileInfo.size = tileInfo.size + result[j].size;
        tileInfo.amount = tileInfo.amount + result[j].result.features.length;
        tileInfo.nextPageStart = result[j].nextPageStart;

        let elements = [];
        for (let l = 0; l < result[j].result.features.length; l++) {
            let feature = result[j].result.features[l];
            let newElements = featureToGeoJson(
                feature,
                feature.properties.color,
                lineWidth,
                radius,
                500,
                selectFeature
            );
            elements = elements.concat(newElements);
        }

        tileInfo.elements = tileInfo.elements.concat(elements);
    }
};

const featureToGeoJson = (
    feature,
    color,
    width,
    radius,
    geometryLength,
    onFeatureClick,
    asMarker,
    forceColor = false
) => {
    let alpha;

    if (color) {
        if (!forceColor) {
            if (feature.properties && feature.properties.color) {
                let colorString = feature.properties.color;
                let valid = /^#?([A-Fa-f0-9]{2}){3,4}$/.test(colorString);

                if (valid) {
                    color = colorString;
                }
            }
        }

        if (color.length === 10) {
            alpha = color.substring(8, 10);
            alpha = parseFloat(parseInt(alpha, 16)) / 255;
        } else {
            alpha = 0.5;
        }
    }

    let element;
    const type = feature.geometry.type;
    
    if (type === "Polygon" || type === "MultiPolygon" || 
    type === "LineString" || type === "MultiLineString") {
        
        element = [
            L.geoJSON(feature, {
                style: color ? (x) => {
                    if(type === "Polygon" || type === "MultiPolygon")
                        return createGeoJsonLayerStyle(color, alpha, width)
                    else 
                        return createGeoJsonLayerStyle(color, 1, 8)
                } : null,
                onEachFeature: onFeatureClick ? (feature, layer) => {
                    layer.on({
                        click: () => onFeatureClick(feature),
                    });
                } : null,
                interactive: onFeatureClick ? true : false
            }),
        ];
    } else if (type === "Point" || type === "MultiPoint") {
        radius = Math.min(150 / geometryLength ** 0.5, radius);

        const coords = feature.geometry.coordinates;
        const isMultiMarker = Array.isArray(coords) && Array.isArray(coords[0]);
        if (isMultiMarker === true) {
            if (asMarker) {
                element = coords.map((coord) => (
                    L.marker([coord[1], coord[0]], {
                        interactive: onFeatureClick ? true : false
                    })
                    .on("click", onFeatureClick ? () => onFeatureClick(feature) : null)
                ));
            } else {
                element = coords.map((coord) => (
                    L.circleMarker([coord[1], coord[0]], {
                        radius: radius,
                        opacity: 1,
                        color: color,
                        weight: 2,
                        interactive: onFeatureClick ? true : false
                    }).on("click", onFeatureClick ? () => onFeatureClick(feature) : null)
                ));
            }
        } else {
            if (asMarker) {
                element = [ //TODO fix a wrong bracket here in react-leaflet package
                    L.marker([coords[1], coords[0]], {
                        interactive: onFeatureClick ? true : false
                    })
                    .on("click", onFeatureClick ? () => onFeatureClick(feature) : null)
                ];
            } else {
                element = [
                    L.circleMarker([coord[1], coord[0]], {
                        radius: radius,
                        opacity: 1,
                        color: color,
                        weight: 2,
                        interactive: onFeatureClick ? true : false
                    }).on("click", onFeatureClick ? () => onFeatureClick(feature) : null),
                ];
            }
        }
    }
    return element;
};

const getLeafletMapBounds = (leafletMap) => {
    if (!leafletMap || !leafletMap._zoom) return;

    const screenBounds = leafletMap.getBounds();

    let bounds = {
        xMin: screenBounds.getWest(),
        xMax: screenBounds.getEast(),
        yMin: screenBounds.getSouth(),
        yMax: screenBounds.getNorth(),
    };

    return { bounds: bounds, zoom: leafletMap._zoom };
};