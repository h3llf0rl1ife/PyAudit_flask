$(function() {
    $('select').material_select();
    selectChangeHandler();
});


function getData(value, field) {
    $.getJSON("/evaluation/api", {
        value: value,
        field: field
    }, function(data) {
        removeOptions(field);

        for (let i = 0, l = data.result.length; i < l; i++) {
            let text_f = data.result[i][field + "Name"];
            
            if (field === "Category" || field === "LocationType") {
                text_f = data.result[i]["Description"];
            };

            let inputField = $('#i-' + field);

            inputField.append(
                $("<option></option>")
                .attr("value", data.result[i][field + "ID"])
                .text(text_f)
            );
        };
    })
}

function removeOptions(field) {
    $('#i-' + field)[0].selectedIndex = 0;
    $('#i-' + field).children("option:not(:first)").remove();
}

function selectChangeHandler() {
    let siteInputs = ["Zone", "Unit", "LocationType", "Location"];
    let zoneInputs = siteInputs.slice(1, siteInputs.length);
    let unitInputs = siteInputs.slice(2, siteInputs.length);
    let locationTypeInputs = siteInputs.slice(3, siteInputs.length);
    let selectHandlerArgs = [
        [$("#i-Site"), siteInputs],
        [$("#i-Zone"), zoneInputs],
        [$("#i-Unit"), unitInputs],
        [$("#i-LocationType"), locationTypeInputs],
        [$("#i-Criteria"), ["Category"]],
    ];

    for (let i = 0, l = selectHandlerArgs.length; i < l; i++) {
        let selectObject = selectHandlerArgs[i][0],
            inputs = selectHandlerArgs[i][1];

        let inputArray = inputs.slice(0, inputs.length);
        
        selectObject.on("change", function() {
            for (let i = 0, l = inputArray.length; i < l; i++) {
                removeOptions(inputArray[i]);
            };

            let dataValue = $(this).val();

            if (inputArray[0] == "Location") {
                let unit = $("#i-Unit")
                
                let value = {
                    LocationTypeID: $(this).val(),
                    UnitID: unit.val()
                };

                dataValue = JSON.stringify(value);
            };
            getData(dataValue, inputArray[0]);
        });
    };
};
