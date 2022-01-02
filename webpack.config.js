const path = require('path');

module.exports = {
    entry: './src/test/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'src/test/dist'),
    },
    mode: 'development'
};

