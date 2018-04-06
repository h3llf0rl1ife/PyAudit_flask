function makeLineChart(canvas, ZoneName) {
    var charts = new Array
    $.each(canvas, function(key, value) {
        var ctx = value.getContext('2d')
        let chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                title: {
                    display: false,
                    position: 'top',
                    text: ZoneName
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            stepSize: 1
                        }
                    }],
                    xAxes: [{
                        type: 'time',
                        position: 'bottom',
                        time: {
                            minUnit: 'day',
                            stepSize: 1
                        },
                    }]
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                elements: {
                    line: {
                        tension: 0.1,
                    }
                }
            }
        })
        charts.push(chart)
    })
    return charts
}

function getData(value, field) {
    $.getJSON("/dashboard/api", {
        value: value,
        field: field
    }, function(data) {
        console.log(data.result)
        
        if (field === "Zone") {
            var charts = makeLineChart($(".Zone" + value), data.result.ZoneName)
            chartList.push([value, charts])

        } else if (field === "LineChartData") {
            $.each(data.result, function(rkey, rvalue) {
                $.each(chartList, function(ckey, cvalue) {
                    if (rkey === cvalue[0]) {
                        let chart_one = cvalue[1][0]
                        let chart_two = cvalue[1][1]
                        $.each(rvalue, function(skey, svalue) {
                            let label = skey
                            let data = new Array
                            $.each(svalue, function(dkey, dvalue) {
                                let point = {
                                    t: new Date(dkey),
                                    y: dvalue
                                }
                                data.push(point)
                            })
                            let dataset = {
                                label: label,
                                data: data,
                                borderWidth: 2,
                                borderColor: colors[label],
                                backgroundColor: 'rgba(0, 0, 0, 0)',
                                pointBackgroundColor: colors[label]
                            }
                            chart_one.data.datasets.push(dataset)
                            chart_two.data.datasets.push(dataset)
                        })
                        chart_one.update()
                        chart_two.update()
                    }
                })
            })
        }
        
    })
}

var chartList = new Array
const colors = {
    S1: "rgba(218, 58, 47, 1)",
    S2: "rgba(218, 207, 47, 1)",
    S3: "rgba(81, 218, 47, 1)",
    S4: "rgba(47, 130, 218, 1)",
    S5: "rgba(218, 47, 210, 1)"
}

$.each($("#LineCharts canvas"), function(key, value) {
    getData($(value).attr("class").replace("Zone", ""), "Zone")
})

$(getData("novalue", "LineChartData"))