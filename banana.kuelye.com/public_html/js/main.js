var currentLessonId;

init = function() {
  getData();

  // var matches = window.location.href.match(/#(.*)$/);location.pathname.match(/#(.*)$/);
  // if (matches.length > 1) {
  //   scrollToElement(document.getElementById("lesson" + matches[1] + "-container"));
  // }
};

getData = function() {
  $.getJSON("main.json", function(data) {
    fillPage(data);
  });
};

fillPage = function(data) {
  this.data = data;
  var groupTitle = getUrlParam("groupTitle");
  var groupId;
  for (var i = 0; i < data.length; ++i) {
    if (data[i]["title"] === groupTitle) {
      groupId = i;
      break;
    }
  }

  if (groupId === undefined) {
    showGroups(data)
  } else {
    showLessons(data[groupId]["diary"], data[groupId]["lessons"], data[groupId]["years"]);
  }

  var scrollTo = getUrlParam("scrollTo");
  if (scrollTo !== undefined) {
    scrollToElement(document.getElementById("lesson" + scrollTo + "-container"));
  }
};

/* -GROUPS--------------------------------------------------------- */

showGroups = function(groups) {
  for (var i = 0; i < groups.length; ++i) {
    addGroup(groups[i]);
  }
};

addGroup = function(group) {
  var $groupA = $("<a>", {
    href: addUrlParam("groupTitle", group["title"]),
    text: group["title"]
  });
  $("#content_container").append($("<div>").append($groupA).addClass("group-title"));
};

/* -LESSONS-------------------------------------------------------- */

showLessons = function(diary, lessons, years) {
  // find current lesson
  var now = Date.now();
  for (var i = 0; i < lessons.length; ++i) {
    lessons[i]["_id"] = i;
    if (lessons[i]["type"] !== "holidays") {
      if (now > new Date(lessons[i]["date"])) {
        currentLessonId = i;
      } else {
        break;
      }
    }
  }

  // fill header with titles
  var groupTitle = getUrlParam("groupTitle");
  var module = getUrlParam("module");
  var $headerContainer = $("#header_container");
  $headerContainer.append($("<div>").append(groupTitle).addClass("group-title"));
  var plan = module === undefined ? "План" : ("План " + module);
  $headerContainer.append($("<div>").append(plan).addClass("header-title"));

  // fill header with modules
  var $modulesContainer = $("<div class=\"modules-container\">");
  var modules = getModules(lessons);
  for (i = 0; i < years.length; ++i) {
    $modulesContainer.append(years[i]["title"] + ": ");
    var modulesInYear = years[i]["modules"];
    for (var j = 0; j < modulesInYear.length; ++j) {
      if (modules.indexOf(modulesInYear[j]) !== -1) {
        if (modulesInYear[j] === module) {
          $modulesContainer.append("<a href=\"" + removeUrlParam(["module", "scrollTo"]) + "\">x</a> ").addClass("module-title");
        } else {
          var url = removeUrlParamFromUrl(addUrlParam("module", modulesInYear[j]), "scrollTo");
          $modulesContainer.append("<a href=\"" + url + "\">" + modulesInYear[j] + "</a> ").addClass("module-title");
        }
      }
    }
    if (j !== (modulesInYear.length - 1)) {
      $modulesContainer.append("\n");
    }
  }
  $headerContainer.append($modulesContainer);

  // fill header with additional links
  var mode = getUrlParam("mode");
  if (mode !== undefined) {
    $headerContainer.append("<a href=\"" + removeUrlParam("mode") + "\">📅</a> ").addClass("module-title");
  }
  if (mode !== "encyclopedia") {
    $headerContainer.append("<a href=\"" + addUrlParam("mode", "encyclopedia") + "\">📔</a> ").addClass("module-title");
  }
  if (mode !== "diary") {
    $headerContainer.append("<a href=\"" + addUrlParam("mode", "diary") + "\">🎮</a> ").addClass("module-title");
  } else {
    if (getUrlParam("onlyWorks") === "true") {
      $headerContainer.append("<a href=\"" + removeUrlParam("onlyWorks") + "\">❕</a> ").addClass("module-title");
    } else {
      $headerContainer.append("<a href=\"" + addUrlParam("onlyWorks", true) + "\">❗</a> ").addClass("module-title");
    }
  }

  // fill content
  var filteredLessons = [];
  for (i = 0; i < lessons.length; ++i) {
    if (module === undefined || lessons[i]["module"] === module) {
      filteredLessons.push(lessons[i]);
    }
  }
  if (mode === "encyclopedia") {
    showEncyclopedia(filteredLessons);
  } else if (mode === "diary") {
    showDiary(diary, filteredLessons);
  } else {
    showLessonsPlan(filteredLessons);
  }
};

showLessonsPlan = function(lessons) {
  for (var i = 0; i < lessons.length; ++i) {
    if (lessons[i]["type"] === "holidays") {
      addHolidays(lessons[i]);
    } else {
      addLesson(lessons[i]);
    }
  }
};

addHolidays = function(holidays) {
  var $holidaysDiv = $("<div class=\"holidays-container\">")
    .append("<div class=\"holidays-title\">" + holidays["title"] + "</div>")
    .append("<div class=\"holidays-comment\">" + holidays["comment"] + "</div>");

  if (currentLessonId !== holidays["_id"]) {
    $holidaysDiv.addClass("inactive-lesson");
  }

  $("#content_container").append($holidaysDiv);
};

addLesson = function(lesson) {
  // add lesson title and date
  var lessonNumber = lesson["index"].padStart(2, "0");
  var $titleDiv = $("<div>")
    .append("<a href=\"" + addUrlParam("scrollTo", lessonNumber) + "\">" + lesson["module"] + "." + lessonNumber + "</a> " + lesson["title"])
    .addClass("lesson-title");
  var $dateDiv = $("<div>")
    .append(getLessonDisplayedDate(lesson))
    .addClass("lesson-date");

  // add commit info
  var $commitInfoDiv = $("<div>").addClass("lesson-commit");
  if (lesson["commit"] !== undefined) {
    $commitInfoDiv.append("<a href=\"" + lesson["commit"] + "\">📟</a>").append(" ")
  }
  if (lesson["commit_description"] !== undefined) {
    $commitInfoDiv.append("<a href=\"" + lesson["commit_description"] + "\">📑</a>")
  }

  // add sections
  if (lesson["sections"] !== undefined) {
    var $sectionsOl = $("<ol>");
    addSections($sectionsOl, lesson["sections"]);
  }

  // add classwork
  if (lesson["classwork"] !== undefined) {
    var $classworkOl = $("<ol>");
    addWork($classworkOl, lesson["classwork"], "classwork");
  }

  // add homework
  if (lesson["homework"] !== undefined) {
    var $homeworkOl = $("<ol>");
    addWork($homeworkOl, lesson["homework"], "homework");
  }

  // fill lesson div
  var $lessonDiv = $("<div id=\"lesson" + lessonNumber + "-container\" class=\"lesson-container\">")
    .append($titleDiv)
    .append($dateDiv)
    .append($commitInfoDiv);
  if ($sectionsOl !== undefined) {
    $lessonDiv.append($('<div class="lesson-sections-title">Конспект</div>'))
      .append($sectionsOl);
  }
  if ($classworkOl !== undefined) {
    $lessonDiv.append($('<div class="lesson-work-title">Контрольная</div>'))
      .append($classworkOl);
  }
  if ($homeworkOl !== undefined) {
    $lessonDiv.append($('<div class="lesson-work-title">Домашка</div>'))
      .append($homeworkOl);
  }
  if (currentLessonId !== lesson["_id"]) {
    $lessonDiv.addClass("inactive-lesson");
  }

  $("#content_container").append($lessonDiv);
};

addSections = function($sectionsOl, sections) {
  for (var i = 0; i < sections.length; ++i) {
    var $sectionLi = $("<li>")
      .append(sections[i]["title"] + " ")
      .append('<span class="lesson-section-themes"> // ' + sections[i]["themes"] + '</span>');
    $sectionsOl.append($sectionLi);
  }
};

addWork = function($workOl, work, type) {
  for (var i = 0; i < work.length; ++i) {
    var $workLi = $("<li>")
      .append(work[i]["title"] + " ");
    if (work[i]["comment"] !== undefined) {
      $workLi.append('<span class="lesson-work-comment"> // ' + work[i]["comment"] + '</span>');
    }
    if (work[i]["sections"] !== undefined) {
      var $workSectionsOl = $("<ol type=\"a\">");
      addWorkSections($workSectionsOl, work[i]["sections"]);
      $workLi.append($workSectionsOl);
    }
    $workOl.append($workLi);
  }
};

addWorkSections = function($homeworkSectionsOl, workSections) {
  for (var i = 0; i < workSections.length; ++i) {
    var $workSectionLi = $("<li>")
      .append(workSections[i]["title"] + " ");
    if (workSections[i]["comment"] !== undefined) {
      $workSectionLi.append('<span class="lesson-work-comment"> // ' + workSections[i]["comment"] + '</span>');
    }
    $homeworkSectionsOl.append($workSectionLi);
  }
};

/* -ENCYCLOPEDIA--------------------------------------------------- */

showEncyclopedia = function(lessons) {
  var encyclopedia = [];
  for (var i = 0; i < lessons.length; ++i) {
    var sections = lessons[i]["sections"];
    if (sections !== undefined) {
      for (var j = 0; j < sections.length; ++j) {
        var title = sections[j]["title"];
        var themes = sections[j]["themes"];
        if (encyclopedia[title] === undefined) {
          encyclopedia[title] = themes;
        } else {
          encyclopedia[title] = encyclopedia[title] + themes;
        }
      }
    }
  }

  for (title in encyclopedia) {
    var $sectionDiv = $("<div class=\"encyclopedia-section-container\">")
      .append(title)
      .append('<span class="lesson-section-themes"> // ' + encyclopedia[title] + '</span>');
    $("#content_container").append($sectionDiv) ;
  }
};

/* -DIARY---------------------------------------------------------- */

showDiary = function(diary, filteredLessons) {
  var $diaryDiv = $("<div class=\"diary-container\">");
  var $table = $("<table class=\"diary-table\">");
  var students = diary["students"];
  var reports = diary["reports"];
  var lessons = diary["lessons"];
  var onlyWorks = getUrlParam("onlyWorks");

  // add first row with dates
  var $firstTr = $("<tr>");
  $firstTr.append($("<td>"));
  for (var i = 0; i < lessons.length; i++) {
    // find real lesson by diary lesson date
    var diaryLesson = lessons[i];
    var type = diaryLesson["type"];
    if (!onlyWorks || type === "homework" || type === "classwork") {
      var lesson = undefined;
      for (var j = 0; j < filteredLessons.length; j++) {
        var filteredLesson = filteredLessons[j];
        if (filteredLesson["date"] === diaryLesson["date"]) {
          lesson = filteredLesson;
          break;
        }
      }

      var title = diaryLesson["type"] === "homework" ? "ДЗ"
          : diaryLesson["type"] === "classwork" ? "КР"
          : "#"; // getDiaryDisplayedDate(diaryLesson);
      var $lessonTd = $("<td>");
      if (lesson === undefined) {
        $lessonTd.append(title)
      } else {
        var lessonNumber = lesson["index"].padStart(2, "0");
        var url = removeUrlParamFromUrl(addUrlParamToUrl(addUrlParam("scrollTo", lessonNumber), "module", lesson["module"]), "mode");
        var hint = diaryLesson["hint"];
        if (hint === undefined && title === "#") {
          hint = getDiaryDisplayedDate(diaryLesson);
        }
        var a = "<a href=\"" + url + "\"";
        if (hint !== undefined) {
          a += " title=\"" + hint + "\"";
        }
        a += ">" + title + "</a>";
        $lessonTd.append(a);
      }
      $firstTr.append($lessonTd);
    }
  }
  $table.append($firstTr);

  // calculate points
  var points = [];
  var averageClassworkPoints = [];
  for (j = 0; j < lessons.length; j++) {
    type = lessons[j]["type"];
    if (type === "classwork") {
      var s = 0;
      var c = 0;
      for (i = 0; i < students.length; i++) {
        var v = lessons[j]["values"][i];
        if (v >= 0) { s += v; c++; }
      }
      console.log(j + " / " + s + " / " + c);
      averageClassworkPoints[j] = v === 0 ? 0 : s / c;
    }
  }
  console.log(averageClassworkPoints);
  for (i = 0; i < students.length; i++) {
    points[i] = 0;
    for (j = 0; j < lessons.length; j++) {
      type = lessons[j]["type"];
      var v = lessons[j]["values"][i];
      if (type === "homework") {
        if (v > 0) {
          points[i] = points[i] + 1;
        }
      } else if (type === "classwork") {
        if (v > 0 && averageClassworkPoints[j] > 0) {
          points[i] = points[i] + v / averageClassworkPoints[j];
        }
      }
    }
    points[i] = points[i] + reports[i];
  }
  for (i = 0; i < points.length; i++) {
    points[i] = [i, points[i]];
  }
  points = points.sort(function(a, b) {
    return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0;
  });
  console.log(points);

  // add students row
  for (var p = 0; p < points.length; p++) {
    i = points[p][0];
    var $tr = $("<tr>").append($("<td>").append(students[i] + "<span class='value-table-pints'> " + parseFloat(points[p][1]).toFixed(2) + "</span>"));
    var values = [];
    var minusesIndexes = [];
    var k = 0;
    for (j = 0; j < lessons.length; j++) {
      type = lessons[j]["type"];
      if (!onlyWorks || type === "homework" || type === "classwork") {
        var value;
        var maxValue = lessons[j]["maxValue"];
        if (maxValue !== undefined) {
          value = lessons[j]["values"][i];
        } else {
          value = lessons[j]["values"][i] > 0 ? "+" : "-";
        }
        if (type === "homework" || type === "classwork") {
          if (value === "-") {
            minusesIndexes.push(k);
          }
          k++;
        }
        values.push(value);
      }
    }

    if (minusesIndexes.length > 0) {
      for (j = 0; j < reports[i]; j++) {
        var l = Math.floor(Math.random() * minusesIndexes.length);
        values[minusesIndexes[l]] = "*";
        minusesIndexes.splice(l, 1);
      }
    }

    for (j = 0; j < values.length; j++) {
      $tr.append("<td class=\"value-table-item\">" + values[j] + "</td>");
    }
    $table.append($tr);
  }

  $diaryDiv.append($table);
  $("#content_container").append($diaryDiv);
};

/* -UTILS---------------------------------------------------------- */

showError = function() {
  // TODO
};

getLessonDisplayedDate = function(lesson) {
  var options = { month: 'long', day: 'numeric' };
  var date = new Date(lesson["date"]);
  return date.toLocaleDateString("en-EN", options);
};

getDiaryDisplayedDate = function(lesson) {
  var date = new Date(lesson["date"]);
  return date.getDate() + "." + ('0' + (date.getMonth() + 1)).slice(-2);
};

getUrlParam = function(key) {
  var url = decodeURIComponent(window.location.search.substring(1));
  var urlParts = url.split('&');
  var keyAndValue;
  for (var i = 0; i < urlParts.length; i++) {
    keyAndValue = urlParts[i].split('=');
    if (keyAndValue[0] === key) {
      return keyAndValue[1] === undefined ? true : keyAndValue[1];
    }
  }
};

removeUrlParamFromUrl = function(url, keys) {
  url = url.indexOf("?") !== -1 ? url.split('?')[1] : url;
  var urlParts = url.length === 0 ? [] : (url.indexOf("&") !== -1 ? url.split('&') : [url]);
  var keyAndValue;
  for (var i = 0; i < urlParts.length; i++) {
    keyAndValue = urlParts[i].split('=');
    if (keys.indexOf(keyAndValue[0]) !== -1) {
      urlParts.splice(i--, 1);
    }
  }

  return window.location.origin + window.location.pathname + "?" + urlParts.join('&');
};

removeUrlParam = function(keys) {
  var url = decodeURIComponent(window.location.search.substring(1));
  return removeUrlParamFromUrl(url, keys);
};

addUrlParamToUrl = function(url, key, value) {
  url = url.indexOf("?") !== -1 ? url.split('?')[1] : url;
  var urlParts = url.length === 0 ? [] : (url.indexOf("&") !== -1 ? url.split('&') : [url]);
  var keyAndValue;
  var isSet = false;
  for (var i = 0; i < urlParts.length; i++) {
    keyAndValue = urlParts[i].split('=');
    if (keyAndValue[0] === key) {
      keyAndValue[1] = value;
      urlParts[i] = keyAndValue.join("=");
      isSet = true;
      break;
    }
  }

  if (!isSet) {
    urlParts[urlParts.length] = [key, value].join('=');
  }

  return window.location.origin + window.location.pathname + "?" + urlParts.join('&');
};

addUrlParam = function(key, value) {
  var url = decodeURIComponent(window.location.search.substring(1));
  return addUrlParamToUrl(url, key, value);
};

scrollToElement = function(element) {
  var positionX = 0,
    positionY = 0;

  while(element != null){
    positionX += element.offsetLeft;
    positionY += element.offsetTop;
    element = element.offsetParent;
    window.scrollTo(positionX, positionY);
  }
};

getModules = function(lessons) {
  var modules = [];
  for (var i = 0; i < lessons.length; ++i) {
    var lesson = lessons[i];
    if (lesson["module"] !== undefined && !modules.includes(lesson["module"])) {
      modules.push(lesson["module"]);
    }
  }

  return modules;
};


filterByModule = function(lessons, module) {
  var filteredLessons = [];
  for (var i = 0; i < lessons.length; ++i) {
    if (lessons[i]["module"] === module) {
      filteredLessons.push(lessons[i]);
    }
  }

  return filteredLessons;
};

scrollToElement = function(element) {
  var positionX = 0,
    positionY = 0;

  while(element != null){
    positionX += element.offsetLeft;
    positionY += element.offsetTop;
    element = element.offsetParent;
    window.scrollTo(positionX, positionY);
  }
};

escapeBackslaches = function(s) {
  return s.replace(/\//g, "//")
};