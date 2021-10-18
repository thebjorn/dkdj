module.exports = function (api) {
    api.cache(true);
    
    const presets = [
        ["@babel/preset-env", {
            useBuiltIns: "usage",  // other option "entry"
            corejs: "3",
            // debug: true,
        }],
        ["@babel/preset-flow"]
    ];
    
    const plugins = [
        "@babel/plugin-transform-flow-strip-types",
        ["@babel/transform-runtime", {
            corejs: "3"
        }],
    ];

    return {
        presets,
        plugins,
        "ignore": [
            "node_modules"
        ],
        // sourceMap: 'inline',
        sourceMap: true,
    };
};
