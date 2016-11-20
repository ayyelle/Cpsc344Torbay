var db;
var myDegree = {};
var orderedCourseList = [];
var wizardHistory = ["CPSC340"];
var page = 0;
var currentCourse = null;
var currentPR = 1;
var next_pr = 2;
var autoAdd = { "default": [], "alt_a": [], "alt_b": [] }
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

$(document).ready(function () {
	 $("#addToPlanButton").hide();
	 $("#labelForChoosePreReq").hide();
	 $("#resetButton").hide();
});

function enterKeyInput(e){
	  if (e.keyCode == 13) {
	       getCourse();
	    };
	
};

function getCourse(){
	   $.getJSON("db.json", function (data) {
	        db = data;
	        
	        var courseEntered = $('#courseToLookUp').val().replace(/ /g,'');
	        console.log(courseEntered);
	        courseEntered = courseEntered.toUpperCase();
	        console.log(courseEntered);
	        if (courseEntered != null){
	        	currentCourse = courseEntered;
	        	addToMyDegree(courseEntered);
	        	addToPlan();
	        	 parse(db, courseEntered);
	 	        if (data[courseEntered].prereqs !== null) {
	 	        	$('#courseToLookUp').hide();
	 	        	$("#labelForCourseToLookUp").hide();
	 	        	$("#courseToLookUpButton").hide();
	 	            updateInstructions();
	 	            $("#dropdown").html(dropdowns(data[courseEntered].prereqs));
	 	        } else {
	 	            $("#dropdown").html("<br>");
	 	        }
	 	        
	 	       //addToMyDegree(courseEntered);
	 	       //addToPlan();
	 	        sortCourses();
		        updateCourseList();
		        $("#labelForChoosePreReq").show();
		        $("#addToPlanButton").show();
		        $("#resetButton").show();
	        };
	        
});
};

function updateInstructions() {
    $("#wizard_instructions").html("<p>Pre-reqs " + currentPR + "/" + db[currentCourse].prereqs.length + "</p>");
}

function addToMyDegree(course) {
    if (!myDegree.hasOwnProperty(course)) {
        myDegree[course] = {
            "leadsTo": 1,
            "reqsMet": false,
            "prereqs": {}
        }
    } else {
        myDegree[course].leadsTo++
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
}

function updateSemester(yrId, semId, id) {
    if (JSON.stringify(orderedSet[yrId][semId]) === "{}") {
        $(id).prop("hidden", true);
    } else {
        $(id).prop("hidden", false);
        $(id).html(getCourseList(yrId, semId));
    }
    // console.log("id: " + id + " yr: " + yrId + " sem: " + semId);
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

function addCourse(c) {
    sortCourses();
    updateCourseList();
}

function nextPR() {
    if (currentPR < db[currentCourse].prereqs.length) {
        currentPR++;
    }
    $("#dropdown").html(dropdown(db[currentCourse].prereqs, (currentPR - 1), false));
    updateInstructions();
}

function sortCourses() {
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
    console.log(JSON.stringify(orderedSet));
}

function getPrereq(c, semester) {
    // For each prereq in myDegree for course c ...
    for (var x in myDegree[c].prereqs) {
        // ...if found, return selected prereq of course that is also in given semester
        if (x in semester) {
            return true;
        }
    }
    return null;
}

function getCourseList(yr, sem) {
    var list = "";
    if (orderedSet[yr][sem] !== {}) {
        for (var course in orderedSet[yr][sem]) {
            list += "<div class='centered'><div class='in-plan plan-btn'>" + course + "</div></div>"
        }
    }
    return list;
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

function inPlan(c) {
    return true;
}

function selectCourse(course, id) {
    var lastCourse = $("#" + id + "").data("course");
    removeCourse(lastCourse);
    $("#" + id + "").html(course + " " + "<span class='caret'></span>");
    $("#" + id + "").data("course", course);
    addToMyDegree(course);
    goToCourse(course);
}

function removeCourse(course) {
    if (course !== undefined) {
        delete myDegree[course];
    }
}

function addToPlan() {
    var pr = db[currentCourse].prereqs;
    for (var c in myDegree) {
        addCourse(c);
    }
    if (reqsMet(currentCourse)) {
        myDegree[currentCourse].reqsMet = true;
        nextCourse();
    }
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
                console.log("req " + (i + 1) + " not met");
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
    autoAdd = { "default": [], "alt_a": [], "alt_b": [] };
    var nc = getNextCourse();
    if (nc !== null) {
        currentCourse = nc;
        parse(db, currentCourse);
        $("#dropdown").html(dropdowns(db[currentCourse].prereqs));
    } else {
        alert("You're done!");
    }
}

function getNextCourse() {
    for (var c in myDegree) {
        if (myDegree[c].reqsMet === false) {
            return c;
        }
    }
    return null;
}

function dropdowns(r) {
    //create dropdowns and course buttons for prereq selections
    var dd_html = "";
    for (var i = 0; i < r.length; i++) {
        dd_html += dropdown(r, i);
    }
    return dd_html;
}

function dropdown(r, n) {
    //create dropdown for prereq selection
    var pr_id = "prdrop" + n;
    var cl = "default";
    var rtn = "";
    if (r[n].or !== null) {
        cl = "alt_b";
        rtn = orDropDowns(r, n, pr_id);
    }
    else if (r[n].n_of === "one" && r[n].courses.length > 1) {
        rtn += "<div class='dropdown'><button onmouseout=goToCourse('" + currentCourse + "') onmouseover=ddPreviewCourse('" + pr_id + "') class='whiteBtn default' type='button' data-toggle='dropdown'"
            + "id='" + pr_id + "'>"
            + "Choose One <span class='caret'></span>"
            + "</button><ul class='dropdown-menu center-dropdown'>"
        for (var i = 0; i < r[n].courses.length; i++) {
            rtn += "<li>" + newCourseBtn(r[n].courses[i], pr_id, cl) + "</li>";
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
    var rtn = "<div class='radio'><label><input type='radio' name='optradio' onclick=enable('alt_a','alt_b')>A</label></div>"

    if (r[n].courses.length > 1) {
        rtn += "<div class='dropdown'><button disabled='true' onmouseover=ddPreviewCourse('" + id + "') class='whiteBtn alt_a' type='button' data-toggle='dropdown'"
            + "id='" + id + "'>"
            + "Choose One <span class='caret'></span>"
            + "</button><ul class='dropdown-menu center-dropdown'>"
    }

    for (var i = 0; i < r[n].courses.length; i++) {
        rtn += "<li>" + newCourseBtn(r[n].courses[i], id, "alt_a") + "</li>";
        if (r[n].courses.length === 1) {
            autoAdd.alt_a.push(r[n].courses[i]);
        }
    }
    rtn += "</ul></div>"
        + "<div class='radio'><label><input type='radio' onclick=enable('alt_b','alt_a') name='optradio'>B</label></div>"
    //     + dropdowns(r[n].or)
    for (var i = 0; i < r[n].or.length; i++) {
        rtn += orDropDown(r[n].or, i);
    }
    return rtn;
}

function orDropDown(r, n) {
    var pr_id = "prdrop" + n + "b";
    var cl = "alt_b";
    var rtn = "";
    if (r[n].n_of === "one" && r[n].courses.length > 1) {
        rtn += "<div class='dropdown'><button onmouseout=goToCourse('" + currentCourse + "') onmouseover=ddPreviewCourse('" + pr_id + "') class='whiteBtn alt_b' type='button' data-toggle='dropdown'"
            + "id='" + pr_id + "' disabled='true'>"
            + "Choose One <span class='caret'></span>"
            + "</button><ul class='dropdown-menu center-dropdown'>"
        for (var i = 0; i < r[n].courses.length; i++) {
            rtn += "<li>" + newCourseBtn(r[n].courses[i], pr_id, cl) + "</li>";
        }
        rtn += "</ul></div>"
    }
    else if (r[n].n_of === "all" || r[n].courses.length === 1) {
        rtn += "</ul>"
        for (var i = 0; i < r[n].courses.length; i++) {
            rtn += "<li>" + newCourseBtn(r[n].courses[i], pr_id, cl) + "</li>";
            autoAdd.alt_b.push(r[n].courses[i]);
        }
        rtn += "</ul>"
    }
    return rtn;
}

function enable(en, dis) {
    $('.' + en).prop("disabled", false);
    $('.' + dis).prop("disabled", true);
    for (var i = 0; i < autoAdd[en].length; i++) {
        addToMyDegree(autoAdd[en][i]);
    }
    for (var i = 0; i < autoAdd[dis].length; i++) {
        removeCourse(autoAdd[dis][i]);
    }
    console.log(JSON.stringify(myDegree));
}

function ddPreviewCourse(id) {
    var course = $('#' + id).data("course");
    if (course !== undefined) {
        goToCourse(course)
    }
}