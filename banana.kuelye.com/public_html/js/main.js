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
    showLessons(data[groupId]["lessons"], data[groupId]["years"]);
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

showLessons = function(lessons, years) {
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
  var encyclopediaMode = getUrlParam("encyclopediaMode");
  if (encyclopediaMode) {
    $headerContainer.append("<a href=\"" + removeUrlParam("encyclopediaMode") + "\">📑</a> ").addClass("module-title");
  } else {
    $headerContainer.append("<a href=\"" + addUrlParam("encyclopediaMode", true) + "\">📔</a> ").addClass("module-title");
  }

  // fill content
  var filteredLessons = [];
  for (i = 0; i < lessons.length; ++i) {
    if (module === undefined || lessons[i]["module"] === module) {
      filteredLessons.push(lessons[i]);
    }
  }
  if (encyclopediaMode) {
    showEncyclopedia(filteredLessons);
  } else {
    showLessonsPlane(filteredLessons);
  }
};

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

showLessonsPlane = function(lessons) {
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