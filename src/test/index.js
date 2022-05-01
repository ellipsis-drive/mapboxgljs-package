import { EllipsisVectorLayer, EllipsisRasterLayer } from '../lib';
import token from './token';

mapboxgl.accessToken = token;
const map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/mapbox/streets-v11", // style URL
    center: [4.633205849096186, 52.373527706597514], // starting position [lng, lat]
    zoom: 16, // starting zoom
});

map.on("load", () => {
    map.addSource("portland", {
        type: "raster",
        url: "mapbox://examples.32xkp0wd",
    });

    map.addLayer({
        id: "portland",
        source: "portland",
        type: "raster",
    });

    //https://api.ellipsis-drive.com/v2/path/02da544b-1f11-4be4-9d4f-d549433893b7/raster/timestamp/83f0fa0e-ed9b-4357-a7c6-970da5f2fc89/tile/14/8395/5417?layer=f44896e2-ae65-48bc-8fb4-1fd6436d879b
    // const rotterdam = new EllipsisRasterLayer({
    //     blockId: '02da544b-1f11-4be4-9d4f-d549433893b7',
    //     captureId: '83f0fa0e-ed9b-4357-a7c6-970da5f2fc89',
    //     visualizationId: 'f44896e2-ae65-48bc-8fb4-1fd6436d879b',
    //     // maxZoom: 8
    // }).addTo(map);


    //Flevoland working v1 example
    //api.ellipsis-drive.com/v1/tileService/2057fd2a-66c5-46ef-9c71-bb8f7a180c44/6f4ae070-e084-427c-91d9-e24f97964eca/ea97778d-c454-4380-9ef5-94b15985b58e/11/1053/673?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiNTM1N2Y0YjktMWRhOC00NDU0LTliNDEtZjE2NmNlMmE4YzNhIiwiaWF0IjoxNjUxNDEzOTA5LCJleHAiOjE2NTQwOTIzMDl9.o_MaDspXecEWIuNGrQYhB0CfAHao5kzE2vBPlNZV8Dc

    //Flevoland equivalent v2 example
    //https://api.ellipsis-drive.com/v2/path/2057fd2a-66c5-46ef-9c71-bb8f7a180c44/raster/timestamp/6f4ae070-e084-427c-91d9-e24f97964eca/tile/11/1053/673?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiNTM1N2Y0YjktMWRhOC00NDU0LTliNDEtZjE2NmNlMmE4YzNhIiwiaWF0IjoxNjUxNDEzOTA5LCJleHAiOjE2NTQwOTIzMDl9.o_MaDspXecEWIuNGrQYhB0CfAHao5kzE2vBPlNZV8Dc


    const flevoland = new EllipsisRasterLayer({
        blockId: '2057fd2a-66c5-46ef-9c71-bb8f7a180c44',
        timestampId: '6f4ae070-e084-427c-91d9-e24f97964eca',
        layerId: 'ea97778d-c454-4380-9ef5-94b15985b58e',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiNTM1N2Y0YjktMWRhOC00NDU0LTliNDEtZjE2NmNlMmE4YzNhIiwiaWF0IjoxNjUxNDEzOTA5LCJleHAiOjE2NTQwOTIzMDl9.o_MaDspXecEWIuNGrQYhB0CfAHao5kzE2vBPlNZV8Dc'
    }).addTo(map);

    // const borders = new EllipsisVectorLayer({
    //     blockId: '1a24a1ee-7f39-4d21-b149-88df5a3b633a',
    //     layerId: '45c47c8a-035e-429a-9ace-2dff1956e8d9',
    //     onFeatureClick: (x) => console.log(x),
    //     loadAll: true
    // }).addTo(map);

    // const pointCloud = new EllipsisVectorLayer({
    //     blockId: 'b8468235-31b5-4959-91a4-0e52a1d4feb6',
    //     layerId: '44be2542-d20d-457b-b003-698d048d2c6c',
    //     // useMarkers: true,
    //     onFeatureClick: (x) => console.log(x),
    //     radius: 15
    // }).addTo(map);
});