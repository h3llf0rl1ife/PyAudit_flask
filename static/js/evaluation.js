$(document).ready(function() {
    $('select').material_select();
});

$("#i-Site").on("change", function() {
    removeOptions("Zone")
    removeOptions("Unit")
    removeOptions("Workshop")
    removeOptions("Area")
    $('#i-Address').val("")
    
    getData($("#i-Site").val(), "Zone")
})

$("#i-Zone").on("change", function() {
    removeOptions("Unit")
    removeOptions("Workshop")
    removeOptions("Area")
    $('#i-Address').val("")
    
    getData($("#i-Zone").val(), "Unit")
})

$("#i-Unit").on("change", function() {
    removeOptions("Workshop")
    removeOptions("Area")
    $('#i-Address').val("")
    
    getData($("#i-Unit").val(), "Workshop")
})

$("#i-Workshop").on("change", function() {
    removeOptions("Area")
    $('#i-Address').val("")

    getData($("#i-Workshop").val(), "Area")
})

$("#i-Area").on("change", function() {
    $('#i-Address').val("")

    getData($("#i-Area").val(), "Address")
})

$("#i-Criteria").on("change", function() {
    removeOptions("Category")
    getData($("#i-Criteria").val(), "Category")
})

$(".btn-modifier").on("click", function() {
    $(".btn-ajouter").addClass("hide")
    $(".btn-enregistrer").removeClass("hide")
    $(".btn-modifier").addClass("hide")
    $(".btn-annuler").removeClass("hide")
    
    $("#i-EvaluationID").remove()
    //removeOptions("Site")
    $("#i-Site").val("")
    removeOptions("Zone")
    removeOptions("Unit")
    removeOptions("Workshop")
    removeOptions("Area")
    $('#i-Address').val("")
    removeOptions("Criteria")
    removeOptions("Category")
    removeOptions("Validation")
    $('#i-Comment').val("")
    $('#i-File').val("")
    $('#i-File-Path').val("")

    $("#evaluationID-wrapper").append(
        $("<select>").attr({
            "id": "i-EvaluationID",
            "class": "center-align col s2 m1 l1 browser-default"
        }).append(
            new Option("Selectionner", "", true, true)
        )
    )

    getData("NoValue", "EvaluationID")

    var btn_supprimer = $(".btn-supprimer")

    $("#i-EvaluationID").on("change", function() {
        if (btn_supprimer.hasClass("disabled")) {
            btn_supprimer.removeClass("disabled")
        }

        var index_val = $("#i-EvaluationID").val()
        
        btn_supprimer.on("click", function() {
            
            if (index_val != "") {
                $("#i-EvaluationID option[value='" + index_val + "']").remove()
                btn_supprimer.addClass("disabled")
                postData(index_val, "deleteEvaluation")
            }
        })

        getData(index_val, "Evaluation")
    })
})

function getData(value, field) {
    $.getJSON("/evaluation/api", {
        value: value,
        field: field
    }, function(data) {
        console.log(data.result)
        
        if (field === "Address") {
            $('#i-' + field).val(data.result)
        } else if (field === "Category") {
            removeOptions(field)
            $.each(data.result, function(key, val) {
                $('#i-' + field).append(
                    $("<option></option>")
                    .attr("value", val[field + "ID"])
                    .text(val["Description"]));
            });
        } else if (field === "EvaluationID") {
            $.each(data.result, function(key, val) {
                $('#i-' + field).append(
                    $("<option></option>")
                    .attr("value", val)
                    .text(val));
            })
        } else if (field === "Evaluation") {
            
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

function postData(value, field) {
    $.post("/evaluation/api", {
        value: value,
        field: field
    }, function(data) {
        console.log(data.result)
    if (field === "deleteEvaluation") {
        console.log("deleted")
    }
    })
}
