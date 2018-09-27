/**
 * Created by chdallago on 1/6/17.
 */
$('.dropdown').dropdown();

highChartsCurvesConfigObject = {
    chart: {
        title: undefined,
        backgroundColor: '#fbfbfb'
    },

    title: {
        text: ''
    },

    yAxis: {
        title: {
            text: ''
        }
        //     min: 0,
        //     max: 1.1
    },
    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
    },

    plotOptions: {
        series: {
            label: {
                connectorAllowed: false
            },
            animation: {
                duration: 1000
            }
        }
    },

    xAxis: {
        title: {
            text: ''
        },
        startOnTick: true,
        tickInterval: 1,
        min: 37,
        max: 64
    },

    responsive: {
        rules: [{
            condition: {
                maxWidth: 500
            },
            chartOptions: {
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                }
            }
        }]
    },

    //  shared but customized tooltip
    // https://stackoverflow.com/questions/25620299/highcharts-shared-tooltips-for-certain-serieses
    tooltip: {
        shared: true,
        crosshairs: true
    },

    credits: {
        enabled: false
    }
};

highChartsHeatMapConfigObj = {

    chart: {
        title: undefined,
        type: 'heatmap',
        marginTop: 40,
        marginBottom: 40,
        marginRight: 20,
        marginLeft: 20,
        plotBorderWidth: 1,
        backgroundColor: '#fbfbfb'
    },

    legend: {
        enabled: false
    },

    credits: {
        enabled: false
    }

};
