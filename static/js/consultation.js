function makeLineChart(canvas, ZoneName) {
    $.each(canvas, function(key, value) {
        var ctx = value.getContext('2d')
        let chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'S1',
                    data: [{t: new Date(2018, 0, 3), y: 2}, {t: new Date(2018, 3, 2), y: 3}, {t: new Date(2018, 3, 6), y: 34}, {t: new Date(2018, 3, 9), y: 9}, {t: new Date(2018, 1, 3), y: 7}, {t: new Date(2018, 3, 14), y: 12}, {t: new Date(2018, 3, 11), y: 23}, {t: new Date(2018, 3, 10), y: 4}],
                    borderWidth: 2,
                    borderColor: 'rgba(47, 218, 124, 1)',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    pointBackgroundColor: 'rgba(47, 218, 124, 1)'
                },
                {
                    label: 'S2',
                    data: [{t: new Date(2018, 0, 3), y: 9}, {t: new Date(2018, 3, 2), y: 7}, {t: new Date(2018, 3, 6), y: 5}, {t: new Date(2018, 3, 9), y: 2}, {t: new Date(2018, 1, 3), y: 1}, {t: new Date(2018, 3, 14), y: 19}, {t: new Date(2018, 3, 11), y: 29}, {t: new Date(2018, 3, 10), y: 8}],
                    borderWidth: 2,
                    borderColor: 'rgba(218, 47, 47, 1)',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    pointBackgroundColor: 'rgba(218, 47, 47, 1)'
                }]
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
                            beginAtZero: true
                        }
                    }],
                    xAxes: [{
                        type: 'time',
                        position: 'bottom'
                    }]
                },
                legend: {
                    display: false,
                    position: 'right'
                },
                elements: {
                    line: {
                        tension: 0.1,
                    }
                }
            }
        })
    })
}

function getData(value, field) {
    $.getJSON("/consultation/api", {
        value: value,
        field: field
    }, function(data) {
        console.log(data.result)
        //var canvas_list = $("#" + String(value))[0]
        makeLineChart($(".Zone" + value), data.result.ZoneName)
        
    })
}

//$(getData(1, "Zone"))

$.each($("#LineCharts canvas"), function(key, value) {
    getData($(value).attr("class").replace("Zone", ""), "Zone")
})