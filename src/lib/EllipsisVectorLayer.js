import getEllipsisUtilObject from "./getEllipsisUtilObject";
const VectorLayerUtil = getEllipsisUtilObject("VectorLayerUtil");
const EllipsisApi = getEllipsisUtilObject("EllipsisApi");

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
    return this.map.getStyle().layers.filter((x) => x.id.startsWith(this.id));
  }

  /**
   * Add the ellipsisvectorlayer to the map. This'll create all layers and add all hooks necessary.
   * @param {mapboxgl.Map} map
   * @returns {this} a reference to this layer
   */
  async addTo(map) {
    this.map = map;

    let timestampId = this.options.timestampId;

    const res = await EllipsisApi.getPath(
      this.options.pathId,
      this.options.token
    );

    if (!this.options.timestampId) {
      const defaultTimestampId = res?.vector?.timestamps
        ?.reverse()
        .find(
          (timestamp) =>
            !timestamp.trashed &&
            !timestamp.availability.blocked &&
            timestamp.status === "active"
        )?.id;
      timestampId = defaultTimestampId;
    }
    let style = this.options.style;
    if (!this.options.style) {
      style = res?.vector.styles.find((s) => s.default)?.id;
    }

    let vectorTileInfo = { hasTiles: false, zoom: 0 };

    if (timestampId) {
      const t = res?.vector?.timestamps.find((x) => x.id === timestampId);
      const styleParam =
        typeof style === "string" || style instanceof String
          ? style
          : JSON.stringify(style);
      if (t.precompute.hasVectorTiles) {
        const zoomFrom =
          this.options.zoom && this.options.zoom <= t.precompute.vectorTileZoom
            ? 24
            : t.precompute.vectorTileZoom;
        vectorTileInfo = {
          hasTiles: true,
          zoom: t.precompute.vectorTileZoom,
          zoomFrom: zoomFrom,
        };
        let url = `/ogc/mvt/${this.options.pathId}/styleSheet?timestampId=${timestampId}&style=${styleParam}&zoom=21`;

        const styleSheet = await EllipsisApi.get(url, null, {
          token: this.options.token,
        });
        console.log("styleSheet", styleSheet);

        //add the vector layers

        let mvtUrl = `${EllipsisApi.apiUrl}/ogc/mvt/${this.options.pathId}/{z}/{x}/{y}?zipTheResponse=true&style=${styleParam}&timestampId=${timestampId}`;

        if (this.options.token) {
          url = url + "&token=" + this.options.token;
        }

        map.addSource(this.id + "-tiles", {
          type: "vector",
          tiles: [mvtUrl],
          maxzoom: vectorTileInfo.zoom,
        });

        const sourceLoads = styleSheet.layers;
        for (let j = 0; j < sourceLoads.length; j++) {
          const sourceLoad = sourceLoads[j];
          let LOAD = {
            ...sourceLoad,
            source: this.id + "-tiles",
            id: this.id + "_tiles_" + sourceLoad.id,
            minzoom: 0,
            maxzoom: vectorTileInfo.zoomFrom,
          };
          map.addLayer(LOAD);
          if (this.options.onFeatureClick) {
            map.on(
              "mouseenter",
              this.id + "_tiles_" + sourceLoad.id,
              () => (map.getCanvas().style.cursor = "pointer")
            );
            map.on(
              "mouseleave",
              this.id + "_tiles_" + sourceLoad.id,
              () => (map.getCanvas().style.cursor = "default")
            );
          }
        }
      }
    }

    console.log("tile info", vectorTileInfo);

    map.addSource(this.sourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
    map.addLayer({
      id: `${this.id}_fill`,
      type: "fill",
      interactive: this.options.onFeatureClick ? true : false,
      source: this.sourceId,
      layout: {},
      minzoom: vectorTileInfo.zoomFrom,
      paint: {
        "fill-color": ["get", "fillColor", ["get", "compiledStyle"]],
        "fill-opacity": ["get", "fillOpacity", ["get", "compiledStyle"]],
      },
      filter: ["any", ["==", "$type", "Polygon"]],
    });
    map.addLayer({
      id: `${this.id}_outline`,
      type: "line",
      minzoom: vectorTileInfo.zoomFrom,
      interactive: this.options.onFeatureClick ? true : false,
      source: this.sourceId,
      layout: {},
      paint: {
        "line-color": ["get", "borderColor", ["get", "compiledStyle"]],
        "line-opacity": ["get", "borderOpacity", ["get", "compiledStyle"]],
        "line-width": ["get", "width", ["get", "compiledStyle"]],
      },
      filter: [
        "any",
        ["==", "$type", "Polygon"],
        ["==", "$type", "LineString"],
      ],
    });

    map.addLayer({
      id: `${this.id}_points`,
      type: "circle",
      minzoom: vectorTileInfo.zoomFrom,
      interactive: this.options.onFeatureClick ? true : false,
      source: this.sourceId,
      layout: {
        "circle-sort-key": ["get", "sortIndex", ["get", "compiledStyle"]],
      },
      paint: {
        "circle-radius": ["get", "radius", ["get", "compiledStyle"]],
        "circle-color": ["get", "fillColor", ["get", "compiledStyle"]],
        "circle-opacity": ["get", "fillOpacity", ["get", "compiledStyle"]],
        "circle-stroke-color": ["get", "borderColor", ["get", "compiledStyle"]],
        "circle-stroke-opacity": [
          "get",
          "borderOpacity",
          ["get", "compiledStyle"],
        ],
        "circle-stroke-width": ["get", "width", ["get", "compiledStyle"]],
      },
      filter: ["any", ["==", "$type", "Point"]],
    });

    //Handle feature clicks and mouse styling
    if (this.options.onFeatureClick) {
      this.getLayers().forEach((x) => {
        map.on("click", x.id, (e) =>
          this.options.onFeatureClick(
            {
              geometry: e.features[0].geometry,
              properties: e.features[0].properties,
            },
            x
          )
        );
      });
      map.on(
        "mouseenter",
        `${this.id}_fill`,
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        `${this.id}_fill`,
        () => (map.getCanvas().style.cursor = "default")
      );
      map.on(
        "mouseenter",
        `${this.id}_points`,
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        `${this.id}_points`,
        () => (map.getCanvas().style.cursor = "default")
      );

      map.on(
        "mouseenter",
        `${this.id}_outline`,
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        `${this.id}_outline`,
        () => (map.getCanvas().style.cursor = "default")
      );
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

    this.getSource().setData({
      type: "FeatureCollection",
      features: features,
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
