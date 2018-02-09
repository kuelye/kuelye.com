var currentLessonId;

init = function() {
  getData();

  // var matches = window.location.href.match(/#(.*)$/);location.pathname.match(/#(.*)$/);
  // if (matches.length > 1) {
  //   scrollToElement(document.getElementById("lesson" + matches[1] + "-container"));
  // }
};

getData = function() {
  $.getJSON("../main.json", function(data) {
    fillPage(data);
  });
};

fillPage = function(data) {
  this.data = data;
  var groupTitle = getUrlParam("groupTitle");
  console.log("fillPage: groupTitle=" + groupTitle);
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
    showLessons(data[groupId]["lessons"]);
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

showLessons = function(lessons) {
  // find current lesson
  var now = Date.now();
  for (var i = 0; i < lessons.length; ++i) {
    if (now > new Date(lessons[i]["date"])) {
      currentLessonId = i;
    } else {
      break;
    }
  }
  console.log("showLessons: currentLessonId=" + currentLessonId);

  // fill header
  var groupTitle = getUrlParam("groupTitle");
  var $headerContainer = $("#header_container");
  $headerContainer.append($("<div>").append(groupTitle).addClass("group-title"));
  $headerContainer.append($("<div>").append("План").addClass("header-title"));
  var $modulesContainer = $("<div>");
  var modules = getModules(lessons);
  for (i = 0; i < modules.length; ++i) {
    var url = addUrlParam("module", modules[i]);
    $modulesContainer.append("<a href=\"" + url + "\">" + modules[i] + "</a> ").addClass("module-title");
  }
  $headerContainer.append($modulesContainer);

  // fill content
  var module = getUrlParam("module");
  if (module !== undefined) {
    lessons = filterByModule(lessons, module);
  }
  for (i = 0; i < lessons.length; ++i) {
    addLesson(i, lessons[i]);
  }
};

addLesson = function(lessonId, lesson) {
  // add lesson title and date
  var lessonNumber = lesson["index"].padStart(2, "0");
  var $titleDiv = $("<div>")
    .append("<a href=\"" + addUrlParam("scrollTo", lessonNumber) + "\">" + lesson["module"] + "." + lessonNumber + "</a> " + lesson["title"])
    .addClass("lesson-title");
  var $dateDiv = $("<div>")
    .append(getFormattedDate(lesson))
    .addClass("lesson-date");

  // add sections
  if (lesson["sections"] !== undefined) {
    var $sectionsOl = $("<ol>");
    addSections($sectionsOl, lesson["sections"]);
  }

  // add homework
  if (lesson["homework"] !== undefined) {
    var $homeworkOl = $("<ol>");
    addHomework($homeworkOl, lesson["homework"]);
  }

  // fill lesson div
  var $lessonDiv = $("<div id=\"lesson" + lessonNumber + "-container\" class=\"lesson-container\">")
    .append($titleDiv)
    .append($dateDiv);
  if ($sectionsOl !== undefined) {
    $lessonDiv.append($('<div class="lesson-sections-title">План</div>'))
      .append($sectionsOl);
  }
  if ($homeworkOl !== undefined) {
    $lessonDiv.append($('<div class="lesson-homework-title">Домашка</div>'))
      .append($homeworkOl);
  }
  if (currentLessonId !== lessonId) {
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

addHomework = function($homeworkOl, homework) {
  for (var i = 0; i < homework.length; ++i) {
    var $homeworkLi = $("<li>")
      .append(homework[i]["title"] + " ");
    if (homework[i]["comment"] !== undefined) {
      $homeworkLi.append('<span class="lesson-homework-comment"> // ' + homework[i]["comment"] + '</span>');
    }
    if (homework[i]["sections"] !== undefined) {
      var $homeworkSectionsOl = $("<ol type=\"a\">");
      addHomeworkSections($homeworkSectionsOl, homework[i]["sections"]);
      $homeworkLi.append($homeworkSectionsOl);
    }
    $homeworkOl.append($homeworkLi);
  }
};

addHomeworkSections = function($homeworkSectionsOl, homeworkSections) {
  for (var i = 0; i < homeworkSections.length; ++i) {
    var $homeworkSectionLi = $("<li>")
      .append(homeworkSections[i]["title"] + " ");
    if (homeworkSections[i]["comment"] !== undefined) {
      $homeworkSectionLi.append('<span class="lesson-homework-comment"> // ' + homeworkSections[i]["comment"] + '</span>');
    }
    $homeworkSectionsOl.append($homeworkSectionLi);
  }
};

showError = function() {
  // TODO
};

/* -UTILS---------------------------------------------------------- */

getFormattedDate = function(lesson) {
  var options = { month: 'long', day: 'numeric' };
  var date = new Date(lesson["date"]);
  return date.toLocaleDateString("en-EN", options);
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

addUrlParam = function(key, value) {
  var url = decodeURIComponent(window.location.search.substring(1));
  var urlParts = url.split('&');
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
    if (!modules.includes(lesson["module"])) {
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