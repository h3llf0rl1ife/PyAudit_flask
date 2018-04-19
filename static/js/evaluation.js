$(function() {
    $('select').material_select();
    $("#i-Site").on("change", function() {
        removeOptions("Zone")
        removeOptions("Unit")
        removeOptions("LocationType")
        removeOptions("Location")
        
        getData($(this).val(), "Zone")
    })
    
    $("#i-Zone").on("change", function() {
        removeOptions("Unit")
        removeOptions("LocationType")
        removeOptions("Location")
        
        getData($(this).val(), "Unit")
    })
    
    $("#i-Unit").on("change", function() {
        removeOptions("LocationType")
        removeOptions("Location")
    
        getData($(this).val(), "LocationType")
    })
    
    $("#i-LocationType").on("change", function() {
        removeOptions("Location")
        let value = {
            LocationTypeID: $(this).val(),
            UnitID: $("#i-Unit").val()
        }
        getData(JSON.stringify(value), "Location")
    })
    
    $("#i-Criteria").on("change", function() {
        removeOptions("Category")
        getData($(this).val(), "Category")
    })
    
    $("#Send").on("click", function() {
        let value = {
            LocationID: $("#i-Location").val(),
            CategoryID: $("#i-Category").val(),
            Validation: $("#i-Validation").val(),
            Comment: $("#i-Comment").val()
        }
    })
});



/*$(".btn-modifier").on("click", function() {
    $(".btn-ajouter").addClass("hide")
    $(".btn-enregistrer").removeClass("hide")
    $(".btn-modifier").addClass("hide")
    $(".btn-annuler").removeClass("hide")
    
    $("#i-EvaluationID").remove()
    //removeOptions("Site")
    $("#i-Site").val("")
    removeOptions("Zone")
    removeOptions("Unit")
    removeOptions("Location")
    removeOptions("Criteria")
    removeOptions("Category")
    removeOptions("Validation")
    $('#i-Comment').val("")
    $('#i-File').val("")
    $('#i-File-Path').val("")

    $("#evaluationID-wrapper").append(
        $("<select>").attr({
            id: "i-EvaluationID",
            class: "center-align col s2 m1 l1 browser-default",
            required: true
        }).append(
            "<option value='' selected disabled>Selectionner</option>"
        )
    )

    getData("NoValue", "EvaluationID")

    var btn_supprimer = $(".btn-supprimer")

    $("#i-EvaluationID").on("change", function() {
        if (btn_supprimer.hasClass("disabled")) {
            btn_supprimer.removeClass("disabled")
        }

        var index_val = $(this).val()
        
        btn_supprimer.on("click", function() {
            
            if (index_val != "") {
                $("#i-EvaluationID option[value='" + index_val + "']").remove()
                btn_supprimer.addClass("disabled")
                postData(index_val, "deleteEvaluation")
            }
        })

        getData(index_val, "Evaluation")
    })
})*/

function getData(value, field) {
    $.getJSON("/evaluation/api", {
        value: value,
        field: field
    }, function(data) {
        console.log(data.result)
        
        if (field === "Category" || field === "LocationType") {
            removeOptions(field)
            $.each(data.result, function(key, val) {
                $('#i-' + field).append(
                    $("<option></option>")
                    .attr("value", val[field + "ID"])
                    .text(val["Description"]));
            });
        /*} else if (field === "EvaluationID") {
            $.each(data.result, function(key, val) {
                $('#i-' + field).append(
                    $("<option></option>")
                    .attr("value", val)
                    .text(val));
            })
        } else if (field === "Evaluation") {*/
            
        } else {
            removeOptions(field)
            $.each(data.result, function(key, val) {
                $('#i-' + field).append(
                    $("<option></option>")
                    .attr("value", val[field + "ID"])
                    .text(val[field + "Name"]));
            });
        }
    })
}

function removeOptions(field) {
    $('#i-' + field)[0].selectedIndex = 0
    $('#i-' + field).children("option:not(:first)").remove()
}

/*function postData(value, field) {
    $.post("/evaluation/api", {
        value: value,
        field: field
    }, function(data) {
        console.log(data.result)
    if (field === "deleteEvaluation") {
        console.log("deleted")
    }
    })
}*/
