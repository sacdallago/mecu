module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2015
    },
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "backtick"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": [
            "warn",
            {
                "allow": ["always"]
            }
        ],
        "globals": [
            "HelperFunctions",
            "ModalService",
            "highChartsCurvesConfigObject",
            "highChartsHeatMapConfigObj",
            "TemperatureService",
            "ExperimentService",
            "ProteinService",
            "ComplexService",
            "ExternalService",

        ],
        "globals": {
            "HelperFunctions": false
        },
        "no-undef": [
            "warn"
        ]

    }
};
