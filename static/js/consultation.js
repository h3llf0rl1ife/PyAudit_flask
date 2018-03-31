function makeLineChart(canvas, ZoneName) {
    var ctx = canvas.getContext('2d')
    let chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Nombre d\'anomlies',
                data: [],
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 0, 1)',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                pointBackgroundColor: 'rgba(0, 0, 0, 1)'
            }]
        },
        options: {
            title: {
                display: true,
                position: 'top',
                text: ZoneName
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: {
                display: false,
                position: 'right'
            },
            elements: {
                line: {
                    tension: 0,
                }
            }
        }
    })
}

function getData(value, field) {
    $.getJSON("/consultation/api", {
        value: value,
        field: field
    }, function(data) {
        console.log(data.result)
        //var canvas_list = $("#" + String(value))[0]
        makeLineChart($("#Zone" + value)[0], data.result.ZoneName)
        
    })
}

//$(getData(1, "Zone"))

$.each($("#LineCharts canvas"), function(key, value) {
    getData(value.id.replace("Zone", ""), "Zone")
})