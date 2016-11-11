var db;
$(document).ready(function () {
    $.getJSON("db.json", function (data) {
        db = data;
        parse(db, "CPSC340");
    });
});

function parse(data, course) {
    var course_data = data[course];
    $('#courseTitle').text(course_data.title);
    $('#courseCredits').text("Credits: " + course_data.credits);
    $('#courseInfo').text(course_data.info);
    $('#coursePrereqs').html(display_reqs(course_data.prereqs));
    $('#courseCoreqs').html(display_reqs(course_data.coreqs));
    $('#testBtn').html("<button>test</button>");
}

function display_reqs(r) {
    var reqs = "";
    if (r !== null) {
        for (var i = 0; i < r.length; i++) {
            if (r[i].courses.length !== 1) {
                reqs += r[i].n_of + " of: "
            }
            for (var j = 0; j < r[i].courses.length; j++) {
                reqs += "<button>" + r[i].courses[j] + "</button>"
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
