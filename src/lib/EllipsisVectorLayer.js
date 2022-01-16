import { VectorLayerUtil } from 'ellipsis-js-util';

class EllipsisVectorLayer extends VectorLayerUtil.EllipsisVectorLayerBase {




    constructor(options = {}) {
        super(options);
        this.sourceId = `${this.id}_source`;
        //TODO add sorting options in base layer
        // this.loadOptions.onEachFeature = (f) => {
        //     f.properties.compiledStyle.sortIndex = parseInt((16 ** 6) - f.properties.compiledStyle.fillColor.substr(1), 16);
        // }
    }

    /**
     * @returns mapbox geojson source that the layer is using
     */
    getSource() {
        return this.source;
    }

    /**
     * @returns mapbox layers
     */
    getLayers() {
        if (!this.map) return [];
        if (!this.map.getStyle() || !this.map.getStyle().layers) return [];
        return this.map.getStyle().layers.filter(x => x.id.startsWith(this.id));
    }

    /**
     * Add the ellipsisvectorlayer to the map. This'll create all layers and add all hooks necessary.
     * @param {mapboxgl.Map} map
     * @returns {this} a reference to this layer
     */
    addTo(map) {
        this.map = map;

        map.addSource(this.sourceId, {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: []
            }
        });
        map.addLayer({
            id: `${this.id}_fill`,
            type: 'fill',
            interactive: this.options.onFeatureClick ? true : false,
            source: this.sourceId,
            layout: {},
            paint: {
                'fill-color': ['get', 'fillColor', ['get', 'compiledStyle']],
                'fill-opacity': ['get', 'fillOpacity', ['get', 'compiledStyle']]
            },
            filter: ['any',
                ['==', '$type', 'Polygon'],
            ]
        });
        map.addLayer({
            id: `${this.id}_outline`,
            type: 'line',
            interactive: this.options.onFeatureClick ? true : false,
            source: this.sourceId,
            layout: {},
            paint: {
                'line-color': ['get', 'borderColor', ['get', 'compiledStyle']],
                'line-opacity': ['get', 'borderOpacity', ['get', 'compiledStyle']],
                'line-width': ['get', 'width', ['get', 'compiledStyle']],
            },
            filter: ['any',
                ['==', '$type', 'Polygon'],
                ['==', '$type', 'LineString']
            ]
        });

        if (!this.options.useMarkers)
            map.addLayer({
                id: `${this.id}_points`,
                type: 'circle',
                interactive: this.options.onFeatureClick ? true : false,
                source: this.sourceId,
                layout: {
                    'circle-sort-key': ['get', 'sortIndex', ['get', 'compiledStyle']],
                },
                paint: {
                    'circle-radius': ['get', 'radius', ['get', 'compiledStyle']],
                    'circle-color': ['get', 'fillColor', ['get', 'compiledStyle']],
                    'circle-opacity': ['get', 'fillOpacity', ['get', 'compiledStyle']],
                    'circle-stroke-color': ['get', 'borderColor', ['get', 'compiledStyle']],
                    'circle-stroke-opacity': ['get', 'borderOpacity', ['get', 'compiledStyle']],
                    'circle-stroke-width': ['get', 'width', ['get', 'compiledStyle']]
                },
                filter: ['any',
                    ['==', '$type', 'Point']
                ]
            });

        //Handle feature clicks and mouse styling
        if (this.options.onFeatureClick) {
            this.getLayers().forEach(x => {
                map.on('click', x.id, (e) => this.options.onFeatureClick({ geometry: e.features[0].geometry, properties: e.features[0].properties }, x));
            });
            map.on('mouseenter', `${this.id}_fill`, () => map.getCanvas().style.cursor = 'pointer');
            map.on('mouseleave', `${this.id}_fill`, () => map.getCanvas().style.cursor = 'default');
            map.on('mouseenter', `${this.id}_points`, () => map.getCanvas().style.cursor = 'pointer');
            map.on('mouseleave', `${this.id}_points`, () => map.getCanvas().style.cursor = 'default');
        }

        this.source = map.getSource(this.sourceId);

        this.update();

        if (this.options.loadAll) return this;

        map.on("zoom", (x) => {
            this.update();
        });

        map.on("moveend", (x) => {
            this.update();
        });
        return this;
    }

    //Render all features that are cached in ellipsisLayer to the screen. 
    updateView = () => {
        const features = this.getFeatures();
        if (!features || !features.length) return;

        if (this.options.useMarkers) {
            let points = features.flatMap((x) => {
                if (x.geometry.type === 'Point') {
                    return new mapboxgl.Marker({ color: x.properties.compiledStyle.fillColor }).setLngLat(x.geometry.coordinates);
                } else if (x.geometry.type === 'MultiPoint') {
                    return x.geometry.coordinates.map(c => new mapboxgl.Marker({ color: x.properties.compiledStyle.fillColor }).setLngLat(c));
                }
                return [];
            });
            this.markers.forEach(x => x.remove());
            points.forEach(x => {
                if (this.options.onFeatureClick) {
                    x.getElement().addEventListener('click', this.options.onFeatureClick);
                }
                x.addTo(this.map);
                this.markers.push(x);
            });
        }
        this.getSource().setData({
            type: "FeatureCollection",
            features: features
        });
    };

    //Get the map bounds from the map.
    getMapBounds = () => {
        if (!this.map) return;

        const screenBounds = this.map.getBounds();
        const zoom = this.map.getZoom();
        let bounds = {
            xMin: screenBounds.getWest(),
            xMax: screenBounds.getEast(),
            yMin: screenBounds.getSouth(),
            yMax: screenBounds.getNorth(),
        };

        //Mapbox uses 512x512 tiles, and ellipsis uses 256x256 tiles. So increase zoom with 1. 'zoom256 = zoom512 + 1'
        return { bounds: bounds, zoom: parseInt(zoom + 1, 10) };
    };

}

export default EllipsisVectorLayer;