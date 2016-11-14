var db;
var courseSet = { "CPSC340": true };
var orderedCourseList = [];
var wizardHistory = ["CPSC340"];
var page = 0;
var currentCourse = "CPSC340";
var currentPR = 1;
var toAdd = [];

$(document).ready(function () {
    $.getJSON("db.json", function (data) {
        db = data;
        parse(db, "CPSC340");
        if (data[currentCourse].prereqs !== null) {
            updateInstructions();
            $("#dropdown").html(dropdown(data[currentCourse].prereqs, 3));
        } else {
            $("#dropdown").html("<br>");
        }
        sortCourses();
        updateCourseList();
    });
});

function updateInstructions() {
    $("#wizard_instructions").html("<p>Pre-reqs " + currentPR + "/" + db[currentCourse].prereqs.length + "</p>");
}

function parse(data, course) {
    if (course !== null) {
        var course_data = data[course];
        $('#courseTitle').text(course_data.title);
        $('#courseCredits').text("Credits: " + course_data.credits);
        $('#courseInfo').text(course_data.info);
        $('#coursePrereqs').html(display_reqs(course_data.prereqs));
        $('#courseCoreqs').html(display_reqs(course_data.coreqs));
    } else {
        $('#courseTitle').text("Not Found");
        $('#courseCredits').text("Credits: N/A");
        $('#courseInfo').text("Sorry! This course is not in the database");
        $('#coursePrereqs').html("N/A");
        $('#courseCoreqs').html("N/A");
    }
}

function back() {
    if (page > 0) {
        parse(db, wizardHistory[page - 1]);
        page--;
    }
}

function forward() {
    if (page < (wizardHistory.length - 1)) {
        parse(db, wizardHistory[page + 1]);
        page++;
    }
}

function updateCourseList() {
    $('#courseList').html(getCourseList());
}

function display_reqs(r) {
    var reqs = "";
    if (r !== null) {
        for (var i = 0; i < r.length; i++) {
            if (r[i].courses.length !== 1) {
                reqs += r[i].n_of + " of: | "
            } else {
                reqs += " | ";
            }
            for (var j = 0; j < r[i].courses.length; j++) {
                reqs += "<strong>" + r[i].courses[j] + " | </strong>";
            };
            if (r[i].or !== null) {
                reqs += " OR " + display_reqs(r[i].or)
            }
            if (i < r.length - 1) {
                reqs += "<br>and "
            }
        }
    } else {
        reqs = "none";
    }
    return (reqs);
}

function goToCourse(c) {
    if (c in db) {
        parse(db, c);
    } else {
        parse(db, null)
    }
}

function navigate(c) {
    parse(db, c);
}

function addCourse(c) {
    courseSet[c] = true;
    sortCourses();
    updateCourseList();
}

function nextPR() {
    if (currentPR < db[currentCourse].prereqs.length) {
        currentPR++;
    }
    console.log("currentPR: " + currentPR);
    $("#dropdown").html(dropdown(db[currentCourse].prereqs, (currentPR - 1)));
    updateInstructions();
}

function sortCourses() {
    orderedCourseList = [];
    for (var course in courseSet) {
        orderedCourseList.push(course);
    }
    for (var course in courseSet) {
        if (db[course].prereqs !== null) {
            for (var i = 0; i < db[course].prereqs.length; i++) {
                for (var j = 0; j < db[course].prereqs[i].courses.length; j++) {
                    if (db[course].prereqs[i].courses[j] in courseSet) {
                        var childIndex = orderedCourseList.indexOf(db[course].prereqs[i].courses[j]);
                        orderedCourseList.splice(childIndex, 1);
                        var parentIndex = orderedCourseList.indexOf(course);
                        orderedCourseList.splice(parentIndex, 0, db[course].prereqs[i].courses[j]);
                        console.log("New List: " + JSON.stringify(orderedCourseList));
                    }
                }
            }
        }
    }
}

function getCourseList() {
    var list = "";
    for (var i = 0; i < orderedCourseList.length; i++) {
        list += "<a href='#' class='list-group-item'>" + orderedCourseList[i] + "</a>"
    }
    return list;
}

function newCourseBtn(course, id) {
    return "<button class='course-btn' onmouseover=goToCourse('" + course + "') onclick=selectCourse('" + course + "','" + id + "')>" + course + "</button>";
}

function selectCourse(course, id) {
    $("#" + id + "").html(course + " " + "<span class='caret'></span>");
    $("#" + id + "").data("course", course);
    toAdd.push(course);
    goToCourse(course);
}

function addToPlan() {
    var pr = db[currentCourse].prereqs;
    for (var i = 0; i < toAdd.length; i++) {
        addCourse(toAdd[i]);
    }
    nextPR();
}

function dropdowns(r) {
    var dd_html = "";
    for (var i = 0; i < r.length; i++) {
        dd_html += dropdown(r, i);
    }
    return dd_html;
}

function dropdown(r, n) {
    var pr_id = "prdrop" + n;
    var rtn = "<div class='dropdown'><button onmouseover=ddPreviewCourse('" + pr_id + "') class='whiteBtn' type='button' data-toggle='dropdown'"
        + "id='" + pr_id + "'>"
        + "Choose One <span class='caret'></span>"
        + "</button><ul class='dropdown-menu center-dropdown'>"
    for (var i = 0; i < r[n].courses.length; i++) {
        rtn += "<li>" + newCourseBtn(r[n].courses[i], pr_id) + "</li>";
    }
    rtn += "</ul></div>"
    return rtn;
}

function ddPreviewCourse(id) {
    console.log("preview " + id + ": " + $('#' + id).data("course"));
    var course = $('#' + id).data("course");
    if (course !== undefined) {
        goToCourse(course)
    }
}