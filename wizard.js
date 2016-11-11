var db;
var courseSet = { "CPSC340": true };
var orderedCourseList = [];
var wizardHistory = ["CPSC340"];
var page = 0;

$(document).ready(function () {
    $.getJSON("db.json", function (data) {
        db = data;
        parse(db, "CPSC340");
        sortCourses();
        updateCourseList();
    });
});

function parse(data, course) {
    var course_data = data[course];
    $('#courseTitle').text(course_data.title);
    $('#courseCredits').text("Credits: " + course_data.credits);
    $('#courseInfo').text(course_data.info);
    $('#coursePrereqs').html(display_reqs(course_data.prereqs));
    $('#courseCoreqs').html(display_reqs(course_data.coreqs));
    if (course_data.prereqs !== null) {
        $("#dropdown").html(dropdown(course_data.prereqs, 0));
    } else {
        $("#dropdown").html("<br>");
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
                reqs += r[i].n_of + " of: "
            }
            for (var j = 0; j < r[i].courses.length; j++) {
                reqs += newCourseBtn(r[i].courses[j]);
            };
            if (r[i].or !== null) {
                reqs += " OR " + display_reqs(r[i].or)
            }
            if (i < r.length - 1) {
                reqs += " and "
            };
        }
    }
    return (reqs);
}

function goToCourse(c) {
    if (c in db) {
        console.log("goto " + c);
        addCourse(c);
        parse(db,c);
        wizardHistory.push(c);
        page++;
    } else {
        alert("Sorry, that course is not in the database");
    }
}

function navigate(c) {
    parse(db,c);
}

function addCourse(c) {
    courseSet[c] = true;
    sortCourses();
    updateCourseList();
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
        list += "<li>" + orderedCourseList[i] + "</li>"
    }
    return list;
}

function newCourseBtn(course) {
    return "<button class='btn-primary' onclick=goToCourse('" + course + "')>" + course + "</button>";
}

function dropdown(r, n) {
    var rtn = "<div><button class='btn btn-primary dropdown-toggle' type='button' data-toggle='dropdown'>"
        + "Choose One:"
        + "</button><ul class='dropdown-menu'>"
    for (var i = 0; i < r[n].courses.length; i++) {
        rtn += "<li>" + newCourseBtn(r[n].courses[i]) + "</li>";
    }
    rtn += "</ul></div>"
    return rtn;
}
