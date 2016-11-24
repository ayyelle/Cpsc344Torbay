var db;
var myDegree = {};
var currentCourse = null;
var currentPR = 1;
var autoAdd = { "default": [], "alt_a": { "all": [], "dropdowns": [] }, "alt_b": { "all": [], "dropdowns": [] } }
var fixedCourses = { "CPSC340": true };
var options = [];
var dropDownSet = {};
var orderedSet = {
    "1": {
        "sem1": {},
        "sem2": {}
    },
    "2": {
        "sem1": {},
        "sem2": {}
    },
    "3": {
        "sem1": {},
        "sem2": {}
    }
}

var secondCourseExists = false;
var secondCourse = null;

$(document).ready(function () {
    $.getJSON("db.json", function (data) {
        db = data;
        parse(db, currentCourse);
        if (data[currentCourse].prereqs !== null) {
            $("#dropdown").html(dropdowns(data[currentCourse].prereqs));
        } else {
            $("#dropdown").html("<br>");
        }
        addToMyDegree("CPSC340");
        updateDropdowns();
        updateCourseList();
    });
    $("#addToPlanButton").hide();
    $("#labelForChoosePreReq").hide();
    $("#resetButton").hide();
    $("#courseInfoBox").hide();
    $("#courseListBox").hide();
    // $("#addToPlanButton").prop("disabled", true);
    $("#outro").hide();
});

function enterKeyInput(e) {
    if (e.keyCode == 13) {
	       getCourse();
    };

};

function showSecondBox() {
    $("#courseToLookUp2").show();
    $("#hideSecondBoxButton").show();
    $("#showSecondBoxButton").hide();

}

function hideSecondBox() {
    $("#courseToLookUp2").hide();
    $("#hideSecondBoxButton").hide();
    $("#showSecondBoxButton").show();
    $("#courseToLookUp2").val('');

}

function getCourse() {
    $("#courseInfoBox").show();
    $("#courseListBox").show();
	   $.getJSON("db.json", function (data) {
        db = data;

        var courseEntered = $('#courseToLookUp').val().replace(/ /g, '');
        courseEntered = courseEntered.toUpperCase();
        var secondCourse = $('#courseToLookUp2').val().replace(/ /g, '');
        secondCourseEntered = secondCourse.toUpperCase();
        if (courseEntered != null) {
            currentCourse = courseEntered;
            addToMyDegree(courseEntered);
            fixedCourses[courseEntered] = true;
            addToPlan();
            parse(db, courseEntered);
            if (data[courseEntered].prereqs !== null) {
                $('#courseToLookUp').hide();
                $("#labelForCourseToLookUp").hide();
                $("#courseToLookUpButton").hide();
                $("#introGreeting").hide();
                $("#showSecondBoxButton").hide();
                $("#courseToLookUp2").hide();
                $("#hideSecondBoxButton").hide();
                $("#dropdown").html(dropdowns(data[courseEntered].prereqs));
            } else {
                $("#dropdown").html("<br>");
            }

            if (secondCourseEntered != "" && secondCourseEntered != courseEntered) {
                secondCourseExists = true;
                secondCourse = secondCourseEntered;
                addToMyDegree(secondCourseEntered);
                fixedCourses[secondCourseEntered] = true;
                addToPlan();
                $("#dropdown").html(dropdowns(data[courseEntered].prereqs));
            };
            updateCourseList();
            updateDropdowns();
            $("#labelForChoosePreReq").show();
            $("#addToPlanButton").show();
            $("#resetButton").show();
        };
    });
};

function countCredits() {
    var credits = 0;
    var upper = 0;
    var lower = 0;
    for (var course in myDegree) {
        if (db[course].yr > 2) {
            upper += db[course].credits
        } else {
            lower += db[course].credits
        }
    }
    $("#credit-count").text(upper + lower);
    $("#upper-cr").text(upper);
    $("#lower-cr").text(lower);
}

function updateDropdowns() {
    for (var dd in dropDownSet) {
        if (dropDownSet[dd].options.length > 0) {
            for (var i = 0; i < dropDownSet[dd].options.length; i++) {
                if (dropDownSet[dd].options[i] in myDegree) {
                    updateDropdown(dropDownSet[dd].options[i], dd);
                }
            }
        }
    }
    if (myDegree[currentCourse].auto !== "default") {
        $("#" + myDegree[currentCourse].auto).prop("checked", true);
        enable(myDegree[currentCourse].auto);
    }
}

function addToMyDegree(course) {
    if (!myDegree.hasOwnProperty(course)) {
        myDegree[course] = {
            "reqsMet": false,
            "prereqs": {},
            "auto": "default"
        }
    }
    if (reqsMet(course)) {
        myDegree[course].reqsMet = true;
    }
}

function parse(data, course) {
    if (course !== null) {
        var course_data = data[course];
        $('#currentCourse').text(currentCourse);
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

function removeCourseTree(c) {
    if (c !== undefined) {
        cTree = getCourseTree(c, {});
        for (var course in cTree) {
            if (cTree[course] === true)
                removeCourse(course);
        }
    }
    updateCourseList();
}

function getCourseTree(c, toRemove) {
    var tr = toRemove;
    if (myDegree[c] !== undefined) {
        tr[c] = true;
        if (c in fixedCourses) {
            tr[c] = false;
        }
        if (reqsMet(c) === true) {
            for (var pr in myDegree[c].prereqs) {
                tr[pr] = true;
                tr = combineObjs(tr, getCourseTree(pr, tr));
            }
        }
    }
    return tr;
}

function combineObjs(o1, o2) {
    var rtn = o1;
    for (var i in o2) {
        rtn[i] = o2[i];
    }
    return rtn;
}

function updateCourseList() {
    sortCourses();
    for (var i = 1; i < 4; i++) {
        var id1 = "#yr" + i + "-1";
        var id2 = "#yr" + i + "-2";
        var yrId = "" + i;
        if (JSON.stringify(orderedSet[yrId]["sem1"]) === "{}"
            && JSON.stringify(orderedSet[yrId]["sem2"]) === "{}") {
            $("#yr" + i).prop("hidden", true);
        } else {
            $("#yr" + i).prop("hidden", false);
        }
        updateSemester(i, "sem1", id1);
        updateSemester(i, "sem2", id2);
    }
    countCredits();
    if (reqsMet(currentCourse)) {
        $("#addToPlanButton").prop("disabled", false);
    } else {
        $("#addToPlanButton").prop("disabled", true);
    }
}

function updateSemester(yrId, semId, id) {
    if (JSON.stringify(orderedSet[yrId][semId]) === "{}") {
        $(id).prop("hidden", true);
    } else {
        $(id).prop("hidden", false);
        $(id).html(getCourseList(yrId, semId));
    }
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
    updateCourseList();
}

function sortCourses() {
    orderedSet = {
        "1": {
            "sem1": {},
            "sem2": {}
        },
        "2": {
            "sem1": {},
            "sem2": {}
        },
        "3": {
            "sem1": {},
            "sem2": {}
        }
    }
    if (JSON.stringify(myDegree) !== "{}") {
        // For each course in myDegree ...
        for (var course in myDegree) {
            // ... add to an orderedSet, OS, by YEAR and SEMESTER (default to semester 1)
            orderedSet[db[course]["yr"]]["sem1"][course] = true;
        }
        // For each YEAR in the OS ...
        for (var yr in orderedSet) {
            if (orderedSet[yr].sem1 !== {}) {
                // For each course in semester 1 ...
                for (var course in orderedSet[yr].sem1) {

                    // ... get prereq if one exists in current semester block
                    if (getPrereq(course, orderedSet[yr].sem1)) {

                        delete orderedSet[yr].sem1[course];
                        orderedSet[yr].sem2[course] = true;
                    }

                }
            }
        }
    }
}

function getPrereq(c, semester) {
    if (myDegree[c].prereqs !== undefined) {
        // For each prereq in myDegree for course c ...
        for (var x in myDegree[c].prereqs) {
            // ...if found, return selected prereq of course that is also in given semester
            if (x in semester) {
                return true;
            }
        }
    }
    return null;
}

function getCourseList(yr, sem) {
    var list = "";
    if (orderedSet[yr][sem] !== {}) {
        for (var course in orderedSet[yr][sem]) {
            list += "<div class='centered'><button class='in-plan plan-btn' onclick=wizardPage('" + course + "') onmouseover=goToCourse('" + course + "')>"
                + course + "</button>"
            if (reqsMet(course)) {
                list += "<span class='checked'>&#x2713</span>"
            }
            list += "</div>"
        }
    }
    return list;
}

function wizardPage(course) {
    hideOutro();
    currentCourse = course;
    parse(db, currentCourse);
    $("#dropdown").html(dropdowns(db[currentCourse].prereqs))
    updateCourseList();
    updateDropdowns();
}

function newCourseBtn(course, id, cl) {
    var color = "not-in-plan";
    if (course in myDegree) {
        color = "in-plan"
    }
    var rtn = "<button class='course-btn " + cl + " " + color + "' onmouseout=goToCourse('" + currentCourse + "') onmouseover=goToCourse('" + course + "') onclick=selectCourse('" + course + "','" + id + "')"
    if (cl === "alt_b" || cl === "alt_a") {
        rtn += " disabled='true'";
    }
    rtn += ">" + course + "</button>";
    return rtn;
}

function selectCourse(course, id) {
    var lastCourse = $("#" + id + "").data("course");
    updateDropdown(course, id);
    removeCourseTree(lastCourse);
    delete myDegree[currentCourse].prereqs[lastCourse];
    addToMyDegree(course);
    goToCourse(course);
    updateCourseList();
}

function updateDropdown(course, id) {
    $("#" + id + "").html(course + " " + "<span class='caret'></span>");
    $("#" + id + "").data("course", course);
}

function removeCourse(course) {
    if (course !== undefined) {
        delete myDegree[course];
    }
}

function addToPlan() {
    updateCourseList();
    if (reqsMet(currentCourse)) {
        myDegree[currentCourse].reqsMet = true;
        nextCourse();
        updateCourseList();
    }
    updateDropdowns();
}

function reqsMet(c) {
    if (db[c].prereqs !== null) {
        for (var i = 0; i < db[c].prereqs.length; i++) {
            if (!reqMet(c, db[c].prereqs[i])) {
                myDegree[c].prereqs = {};
                return false;
            }
        }
    }
    /*
    if (db[c].coreqs !== null) {
        for (var i = 0; i < db[c].coreqs.length; i++) {
            if (!reqMet(db[c].coreqs[i])) {
                return false;
            }
        }
    }
    */
    return true;
}

function reqMet(c, r) {
    for (var j = 0; j < r.courses.length; j++) {
        if (r.courses[j] in myDegree) {
            myDegree[c].prereqs[r.courses[j]] = true;
            return true;
        }
    }
    if (r.or !== null && orReqsMet(c, r.or)) {
        return true;
    }
    return false;
}

function orReqsMet(c, r) {
    for (var i = 0; i < r.length; i++) {
        if (!reqMet(c, r[i])) {
            myDegree[c].prereqs = {};
            return false;
        }
    }
    return true;
}

function nextCourse() {
    autoAdd = { "default": [], "alt_a": { "all": [], "dropdowns": [] }, "alt_b": { "all": [], "dropdowns": [] } }
    var nc = getNextCourse();
    if (nc !== null) {
        currentCourse = nc;
        parse(db, currentCourse);
        $("#dropdown").html(dropdowns(db[currentCourse].prereqs));
    } else {
        updateCourseList();
        setOutro("1", "sem1");
        setOutro("1", "sem2");
        setOutro("2", "sem1");
        setOutro("2", "sem2");
        setOutro("3", "sem1");
        setOutro("3", "sem2");
        displayOutro();
    }
}

function getNextCourse() {
    for (var c in myDegree) {
        if (reqsMet(c) === false) {
            return c;
        }
    }
    return null;
}

function dropdowns(r) {
    //create dropdowns and course buttons for prereq selections
    var dd_html = "";
    if (r !== null) {
        for (var i = 0; i < r.length; i++) {
            dd_html += dropdown(r, i);
        }
    } else dd_html = "<em>No pre-reqs</em>"
    return dd_html;
}

function dropdown(r, n) {
    //create dropdown for prereq selection
    var pr_id = "prdrop" + n;
    var cl = "default";
    var rtn = "";
    if (r[n].or !== null) {
        cl = "alt_b";
        rtn = "<hr>" + orDropDowns(r, n, pr_id);
        // newOrDropDowns(r, n, pr_id);
    }
    else if (r[n].n_of === "one" && r[n].courses.length > 1) {
        dropDownSet[pr_id] = { "options": [] };
        rtn += "<div class='dropdown'><button onmouseout=goToCourse('" + currentCourse + "') onmouseover=ddPreviewCourse('" + pr_id + "') class='whiteBtn default' type='button' data-toggle='dropdown'"
            + "id='" + pr_id + "'>"
            + "Choose One <span class='caret'></span>"
            + "</button><ul class='dropdown-menu center-dropdown'>"
        for (var i = 0; i < r[n].courses.length; i++) {
            rtn += "<li>" + newCourseBtn(r[n].courses[i], pr_id, cl) + "</li>";
            dropDownSet[pr_id].options.push(r[n].courses[i]);
        }
        rtn += "</ul></div>"
    }
    else if (r[n].n_of === "all" || r[n].courses.length === 1) {
        rtn += "</ul>"
        for (var i = 0; i < r[n].courses.length; i++) {
            rtn += "<li>" + newCourseBtn(r[n].courses[i], pr_id, cl) + "</li>";
            autoAdd["default"].push(r[n].courses[i]);
            addToMyDegree(r[n].courses[i]);
        }
        rtn += "</ul>"
    }
    return rtn;
}

function orDropDowns(r, n, id) {
    //create dropdowns and course buttons for "OR" prereq selection
    var id_b = "prdrop1b"
    var rtn = "<div class='or-list'><h3>A</h3><div class='custom-radio'><input id='alt_a' type='radio' name='optradio' onclick=enable('alt_a')></div>"
    if (r[n].courses.length > 1) {
        dropDownSet[id] = { "options": [] };
        rtn += "<div class='dropdown'><button disabled='true' onmouseover=ddPreviewCourse('" + id + "') class='whiteBtn alt_a' type='button' data-toggle='dropdown'"
            + "id='" + id + "'>"
            + "Choose One <span class='caret'></span>"
            + "</button><ul class='dropdown-menu center-dropdown'>"
        autoAdd.alt_a.dropdowns.push(id);
    }
    for (var i = 0; i < r[n].courses.length; i++) {
        rtn += "<li>" + newCourseBtn(r[n].courses[i], id, "alt_a") + "</li>";
        if (r[n].courses.length === 1) {
            autoAdd.alt_a.all.push(r[n].courses[i]);
        } else {
            dropDownSet[id].options.push(r[n].courses[i]);
        }
    }
    rtn += "</ul></div></div>"
        + "<div id='or'><h4>OR</h4><div class='vr'></div></div><div class='or-list'><h3>B</h3><div class='custom-radio'><input id='alt_b' type='radio' onclick=enable('alt_b') name='optradio'></div>"
    //     + dropdowns(r[n].or)
    for (var i = 0; i < r[n].or.length; i++) {
        rtn += orDropDown(r[n].or, i);
    }
    rtn += "</div><br><hr>"
    return rtn;
}

function orDropDown(r, n) {
    var pr_id = "prdrop" + n + "b";
    var cl = "alt_b";
    var rtn = "";
    if (r[n].n_of === "one" && r[n].courses.length > 1) {
        dropDownSet[pr_id] = { "options": [] };
        rtn += "<div class='dropdown'><button onmouseout=goToCourse('" + currentCourse + "') onmouseover=ddPreviewCourse('" + pr_id + "') class='whiteBtn alt_b' type='button' data-toggle='dropdown'"
            + "id='" + pr_id + "' disabled='true'>"
            + "Choose One <span class='caret'></span>"
            + "</button><ul class='dropdown-menu center-dropdown'>"
        autoAdd.alt_b.dropdowns.push(pr_id);
        for (var i = 0; i < r[n].courses.length; i++) {
            rtn += "<li>" + newCourseBtn(r[n].courses[i], pr_id, cl) + "</li>";
            dropDownSet[pr_id].options.push(r[n].courses[i]);
        }
        rtn += "</ul></div>"
    }
    else if (r[n].n_of === "all" || r[n].courses.length === 1) {
        rtn += "</ul>"
        for (var i = 0; i < r[n].courses.length; i++) {
            rtn += "<li>" + newCourseBtn(r[n].courses[i], pr_id, cl) + "</li>";
            autoAdd.alt_b.all.push(r[n].courses[i]);
        }
        rtn += "</ul>"
    }
    return rtn;
}

function enable(en) {
    var dis;
    if (en === "alt_a") {
        dis = "alt_b"
    } else {
        dis = "alt_a"
    }
    if (en !== myDegree[currentCourse].auto) {
        myDegree[currentCourse].auto = en;
        $('.' + en).prop("disabled", false);
        $('.' + dis).prop("disabled", true);
        for (var i = 0; i < autoAdd[dis].all.length; i++) {
            if (autoAdd[dis].all[i] in myDegree) {
                removeCourseTree(autoAdd[dis].all[i]);
            }
        }
        for (var i = 0; i < autoAdd[dis].dropdowns.length; i++) {
            if ($("#" + autoAdd[dis].dropdowns[i]).data("course") !== undefined) {
                removeCourseTree($("#" + autoAdd[dis].dropdowns[i]).data("course"));
            }
        }
        for (var i = 0; i < autoAdd[en].all.length; i++) {
            addToMyDegree(autoAdd[en].all[i]);
        }
        for (var i = 0; i < autoAdd[en].dropdowns.length; i++) {
            if ($("#" + autoAdd[en].dropdowns[i]).data("course") !== undefined) {
                addToMyDegree($("#" + autoAdd[en].dropdowns[i]).data("course"));
            }
        }
        updateCourseList();
    }
}

function ddPreviewCourse(id) {
    var course = $('#' + id).data("course");
    if (course !== undefined) {
        goToCourse(course)
    }
}

function setOutro(yr, sem) {
    if (getCourseList(yr, sem) != "") {
        $("#outyr" + yr + "-" + sem.substr(3)).html(getCourseList(yr, sem));
    }
    else {
        $("#outyr" + yr + "-" + sem.substr(3)).hide();
    }
}

function displayOutro() {
    $("#wizardBox").hide();
    $("#courseInfoBox").hide();
    $("#courseListBox").hide();
    $("#outro").show();
}

function hideOutro() {
    $("#wizardBox").show();
    $("#courseInfoBox").show();
    $("#courseListBox").show();
    $("#outro").hide();
}