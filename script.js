jQuery.timeago.settings.allowFuture = true;

String.prototype.toDash = function () {
    return this.replace(/([A-Z])/g, function ($1) {
        return "-" + $1.toLowerCase();
    });
};

$(document).ready(function () {
    $("#remoteAddress").on("keydown", function (event) {
        if (event.keyCode === 13) {
            reloadRemote();
        }
    });

    $("#selectedTodo").on("change", function () {
        reloadSelectedTodo();
    });

    reloadTodos();
    reloadSelectedTodo();

    $(".pending-list").sortable({
        'connectWith': '.todo-list',
        receive: function (event, ui) {
            ui.item.find(".done-time").remove();
            ui.item.find(".start-date").remove();

            saveDetails();
        },
        stop: function () {
            saveDetails();
        }
    });

    $(".done-list").sortable({
        'connectWith': '.todo-list',
        receive: function (event, ui) {
            if (ui.item.find(".done-time").length === 0) {
                ui.item.find("time:last-of-type").after('<time class="timeago done-time" datetime="' + new Date().toISOString() + '"></time>');
                $("time.timeago").timeago();
            }
            ui.item.find(".start-date").remove();

            saveDetails();
        },
        stop: function () {
            saveDetails();
        }
    });

    $(".archive-list").sortable({
        'connectWith': '.todo-list',
        receive: function (event, ui) {
            ui.item.find(".start-date").remove();
            saveDetails();
        },
        stop: function () {
            saveDetails();
        }
    });

    $(".tomorrow-list").sortable({
        'connectWith': '.todo-list',
        receive: function (event, ui) {
            ui.item.find(".start-date").remove();
            ui.item.find(".done-time").remove();

            saveDetails();
        },
        stop: function () {
            saveDetails();
        }
    });

    $(".pool-list").sortable({
        'connectWith': '.todo-list',
        receive: function (event, ui) {
            saveDetails();
        },
        stop: function () {
            saveDetails();
        }
    });

    $(".upcoming-list").sortable({
        'connectWith': '.todo-list',
        receive: function (event, ui) {
            ui.item.find(".done-time").remove();
            ui.item.find(".start-date").remove();

            saveDetails();
        },
        stop: function () {
            saveDetails();
        }
    });


    $(".in-progress-list").sortable({
        'connectWith': '.todo-list',
        receive: function (event, ui) {
            ui.item.find(".done-time, .started-time").remove();
            ui.item.find(".start-date").remove();

            ui.item.find("time:first-of-type").before('<time class="timeago started-time" datetime="' + new Date().toISOString() + '"></time>');
            $("time.timeago").timeago();

            saveDetails();
        },
        stop: function () {
            saveDetails();
        }
    });

    $(".details-list").sortable();

    $("body").on("click", ".editable", function () {
        var editable = $(this);
        var value = editable.text();
        editable.parent().find(":not(input)").addClass('hidden');
        var editableInput = '<input class="editable-input" value="' + value + '">';
        editable.after(editableInput);
    });

    function getTime(taskText) {
        let chunks = taskText.split(" ");
        let hour, minute = -1;
        for (let i = 0; i < chunks.length; i++) {
            let chunk = chunks[i];
            //13:00 or 1:00 or 5:05 or 5:5
            if (chunk.match("^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]|1[0-5]|[0-9])$")) {
                let prevChunk = chunks[i - 1];
                if (prevChunk !== undefined && prevChunk.trim() === 'at') {
                    console.log(chunk);
                    let chunkSplits = chunk.split(":");
                    hour = (parseInt(chunkSplits[0]));
                    minute = (parseInt(chunkSplits[1]));
                }
            }
        }
        return {hour: hour, minute: minute};
    }

    function getStartDate(taskText) {
        const today = new Date();
        const {hour, minute} = getTime(taskText);
        if (hour > -1 && minute > -1) {
            today.setHours(hour);
            today.setMinutes(minute);
            today.setSeconds(0);
        }
        let dateNum = getDay(taskText);
        today.setDate(dateNum);
        return today;
    }

    function getDay(taskText) {
        let d = new Date();
        let chunks = taskText.split(" ");
        let weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (let i = 0; i < chunks.length; i++) {
            let chunk = chunks[i].toLowerCase();
            for (let j = 0; j < weekDays.length; j++) {
                let day = weekDays[j].toLowerCase();
                if (chunk === day || chunk === day.substring(0, 3) || chunk === day.substring(0, 4)) {
                    let prevChunk = chunks[i - 1];
                    if (prevChunk !== undefined && prevChunk.trim() === 'on') {
                        return d.getDate() + (7 + j - d.getDay()) % 7;
                    }
                }
            }
        }
        return d.getDate();
    }

    //Detect Task Text Changed
    var detectEditableInputChange = function (event) {
        let container = $("input.editable-input");
        if (!container.is(event.target) && container.has(event.target).length === 0 && container.is(":visible")) {
            let changedValue = container.val();
            let editable = container.parent().find('.editable');
            if (cleanTaskTitle(changedValue) != null && cleanTaskTitle(changedValue) !== '') {
                editable.text(changedValue);
                let startDate = getStartDate(changedValue);
                let time = '';
                const {hour, minute} = getTime(changedValue);
                if (hour > -1 && minute > -1) {
                    const tempDate = new Date();
                    tempDate.setHours(hour);
                    tempDate.setMinutes(minute);
                    time = tempDate.toLocaleTimeString('en-US');
                    time = time.split(':');
                    time = `${time[0]}:${time[1]} ${time[2].split(" ")[1]}`;
                    time = `<time class="task-time" datetime="${time}"></time>`;
                }

                if (!isNaN(startDate.getDay())) {
                    editable.parent().find('.start-date').remove();
                    editable.after(`<time class="timeago start-date" datetime="${startDate.toISOString()}"></time>${time}`);
                }
            }
            editable.parent().find(":not(input)").removeClass('hidden');
            container.remove();
            saveDetails();
            reloadSelectedTodo();
        }
    };
    $('body').on('mouseup keypress', function (event) {
        if (event.type == 'mouseup' || event.type == 'keypress' && event.which == 13) detectEditableInputChange(event);
    });

    $(".task-input").on("keydown", function (event) {
            if (event.keyCode !== 13) {
                return;
            }
            let value = $(this).val();
            if (cleanTaskTitle(value) === '' || cleanTaskTitle(value) === null)
                return;
            let startDate = getStartDate(value);
            const {hour, minute} = getTime(value);

            let time = '';
            if (hour > -1 && minute > -1) {
                const tempDate = new Date();
                tempDate.setHours(hour);
                tempDate.setMinutes(minute);
                time = tempDate.toLocaleTimeString('en-US');
                time = time.split(':');
                time = `${time[0]}:${time[1]} ${time[2].split(" ")[1]}`;
                time = `<time class="task-time" datetime="${time}"></time>`;
            }
            startDate = startDate !== undefined && !isNaN(startDate.getDate()) ? `<time class="timeago start-date" datetime="${startDate.toISOString()}"></time>` : '';
            $(this).parents("li").after('<li>'
                + time
                + `<span class="editable">${value}</span>`
                + `<time class="timeago start-time" datetime="${new Date().toISOString()}"></time>`
                + startDate
                + ($(this).parents("ul").hasClass("details-list") || $(this).parents("ul").hasClass("archive-list") ? '' : '<i class="fa fa-archive" onclick="archiveParent(event);"></i>')
                + '<i class="fa fa-trash-o" onclick="removeParent(event);"></i></li>');
            $("time.timeago").timeago();
            $(this).val("");
            saveDetails();
            reloadSelectedTodo();
        }
    )
});

function saveDetails() {
    var detailsToSave = {
        'settings': {
            'remoteAddress': $("#remoteAddress").val()
        }
    };

    $(".todo-list, .details-list").each(function () {
        var listData = [];

        $(this).find("li:not(.input)").each(function () {

            listData[listData.length] = {
                title: $(this).find("span.editable").text(),
                createdTime: $(this).find(".start-time").attr("datetime"),
                endTime: $(this).find(".done-time").attr("datetime"),
                startedTime: $(this).find(".started-time").attr("datetime"),
                startDate: $(this).find(".start-date").attr("datetime"),
                taskTime: $(this).find(".task-time").attr("datetime")
            };
        });

        detailsToSave[$(this).data("list-name")] = listData;
    });

    var todoName = 'todo';

    if ($("#selectedTodo").val() !== 'Default') {
        todoName = $("#selectedTodo").val();
    }

    window.localStorage.setItem(todoName, JSON.stringify(detailsToSave));

    if ($("#remoteAddress").val() === "") {
        $.ajax({
            url: "https://api.myjson.com/bins",
            type: "POST",
            data: JSON.stringify(detailsToSave),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var urlSampled = data.uri.replace("https://api.myjson.com/bins/", "");
                $("#remoteAddress").val(urlSampled);
                setTimeout(saveDetails, 300);
            }
        });
    } else {
        $.ajax({
            url: "https://api.myjson.com/bins/" + $("#remoteAddress").val(),
            type: "PUT",
            data: JSON.stringify(detailsToSave),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
            }
        });
    }
}

function reloadTodos() {
    var data = window.localStorage.getItem('todos');

    if (data !== undefined && data !== '') {
        var todos = $.parseJSON(data);

        $.each(todos, function (key, name) {
            $("#selectedTodo").append('<option value="' + name + '">' + name + '</option>');
        });
    }
}

function saveTodos() {
    var todos = [];

    $('#selectedTodo option').each(function () {
        if ($(this).val() === 'Default') {
            return;
        }

        todos[todos.length] = $(this).val();
    });

    window.localStorage.setItem('todos', JSON.stringify(todos));
}

function get_time_diff(datetime) {
    let days = 0;
    if (datetime !== undefined) {
        datetime = typeof datetime !== 'undefined' ? datetime : "2014-01-01 01:02:03.123456";
        datetime = new Date(datetime).getTime();
        let now = new Date().getTime();
        if (isNaN(datetime)) {
            return "";
        }
        let milisec_diff = datetime - now;
        if (datetime < now) {
            milisec_diff = now - datetime;
        }
        days = Math.floor(milisec_diff / 1000 / 60 / (60 * 24));
        let hours = Math.round(milisec_diff / 1000 / 60 / (60));
        days = days === 0 && hours === 24 ? 1 : days;
    }
    return days;
}

function hasPassed(datetime) {
    datetime = typeof datetime !== 'undefined' ? datetime : "2014-01-01 01:02:03.123456";
    datetime = new Date(datetime).getTime();
    let now = new Date().getTime();
    return now > datetime;
}

function cleanTaskTitle(title) {
    let chunks = title.split(" ");
    let weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];
        if (chunk.match("^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]|1[0-5]|[0-9])$")) {
            let prevChunk = chunks[i - 1];
            if (prevChunk !== undefined && prevChunk.trim() === 'at') {
                title = title.replace('at', "");
                title = title.replace(chunk, "");
            }
        }
        for (let j = 0; j < weekDays.length; j++) {
            let day = weekDays[j].toLowerCase();
            chunk = chunk.toLowerCase();
            if (chunk === day || chunk === day.substring(0, 3) || chunk === day.substring(0, 4)) {
                let prevChunk = chunks[i - 1];
                if (prevChunk !== undefined && prevChunk.trim() === 'on') {
                    title = title.replace('on', "");
                    title = title.replace(chunk, "");
                }
            }
        }
    }
    return title;
}

function reloadSelectedTodo(externalContent) {
    $(".todo-list li:not(.input), .details-list li:not(.input)").remove();

    var todoName = 'todo';

    if ($("#selectedTodo").val() !== 'Default') {
        todoName = $("#selectedTodo").val();
    }

    var data = externalContent === undefined ? window.localStorage.getItem(todoName) : externalContent;

    if (data !== undefined && data !== '') {
        var memoryItems = $.parseJSON(data);

        if (memoryItems != null && memoryItems['settings']) {
            $("#remoteAddress").val(memoryItems['settings']['remoteAddress']);
        } else {
            $("#remoteAddress").val("");
        }

        $.each(memoryItems, function (listId, list) {
            $.each(list, function (key, item) {
                let endTime = (item.endTime !== 'undefined' && item.endTime !== undefined ? ('<time class="timeago done-time" datetime="' + item.endTime + '"></time>') : '');
                let startedTime = (item.startedTime !== 'undefined' && item.startedTime !== undefined ? ('<time class="timeago started-time" datetime="' + item.startedTime + '"></time>') : '');
                let startDate = (item.startDate !== 'undefined' && item.startDate !== undefined ? ('<time class="timeago start-date" datetime="' + item.startDate + '"></time>') : '');
                let title = item.title !== 'undefined' && item.title !== undefined ? cleanTaskTitle(item.title) : '';


                let spanItem = `<span class="editable">${title}</span>`;
                let dayDifference = get_time_diff(item.startDate);
                let timeColor = hasPassed(item.startDate) ? 'red' : 'green';
                let time = (item.taskTime !== 'undefined' && item.taskTime !== undefined ? (`<time class="task-time" style="font-size:14px; color: ${timeColor}" datetime="${item.taskTime}">${item.taskTime}</time>`) : '');

                let listItem = '<li>'
                    + time
                    + spanItem
                    + `<time class="timeago start-time" datetime="${item.createdTime}"></time>`
                    + (endTime !== "" ? endTime : startedTime)
                    + startDate
                    + ($("." + listId).hasClass("details-list") || $("." + listId).hasClass("archive-list") ? '' : '<i class="fa fa-archive" onclick="archiveParent(event);"></i>')
                    + '<i class="fa fa-trash-o" onclick="removeParent(event);"></i>'
                    + '</li>';
                if (dayDifference === 1) {
                    let currentList = 'tomorrow-list';
                    $("." + currentList).append(listItem);
                } else if (dayDifference > 1) {
                    let currentList = 'upcoming-list';
                    $("." + currentList).append(listItem);
                } else {
                    $("." + listId).append(listItem);
                }
            });
        });

        $("time.timeago").timeago();
    }
}

function removeParent(event) {
    if (confirm("Are you sure you want to delete this item?")) {
        $(event.target).parents("li").remove();
        saveDetails();
    }
}

function archiveParent(event) {
    $(event.target).parents("li").appendTo(".archive-list").find(".fa-archive").remove();
    saveDetails();
}

function removeTodoPanel() {
    var selectedOption = $("#selectedTodo option:selected").val();

    if (selectedOption !== 'Default' && confirm('Are you sure you want to delete this todo?')) {
        $("#selectedTodo option:selected").remove();

        saveTodos();

        window.localStorage.setItem(selectedOption, undefined);
        reloadSelectedTodo();
    }
}

function addTodoPanel() {
    var name = prompt("Please Enter the Todo name");

    if (name === "" || name === undefined || name === null) {
        return;
    }

    $("#selectedTodo").append('<option selected value="' + name + '">' + name + '</option>');

    saveTodos();
    reloadSelectedTodo();

}

function reloadRemote() {
    if ($("#remoteAddress").val() !== "") {
        $.get("https://api.myjson.com/bins/" + $("#remoteAddress").val(), function (data, textStatus, jqXHR) {
            reloadSelectedTodo(JSON.stringify(data));
            saveDetails();
        });
    }
}
