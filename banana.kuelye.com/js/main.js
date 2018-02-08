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
};

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

showLessons = function(lessons) {
  for (var i = 0; i < lessons.length; ++i) {
    addLesson(i, lessons[i]);
  }
};

addLesson = function(lessonId, lesson) {
  // noinspection JSUnresolvedFunction
  var lessonNumber = String(lessonId).padStart(2, "0");
  var $titleDiv = $("<div>")
    .append(lessonNumber + " " + lesson["title"])
    .addClass("lesson-title");
  var $dateDiv = $("<div>")
    .append(getFormattedDate(lesson))
    .addClass("lesson-date");
  var $sectionsOl = $("<ol>");
  addSections($sectionsOl, lesson["sections"]);
  var $lessonDiv = $("<div id=\"lesson" + lessonNumber + "-container\" class="lesson-container">")
    .append($titleDiv)
    .append($dateDiv)
    .append($('<div class="lesson-sections-title">План</div>'))
    .append($sectionsOl);
  $("#content_container").append($lessonDiv);
};

addSections = function($sectionsOl, sections) {
  for (var i = 0; i < sections.length; ++i) {
    var $sectionLi = $("<li>")
      .append(sections[i]["title"] + " ")
      .append(sections)
      .append('<span class="lesson-section-themes"> // ' + sections[i]["themes"] + '</span>');
    $sectionsOl.append($sectionLi);
  }
};

showError = function() {
  // TODO
};

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