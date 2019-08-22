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

            saveDetails();
        },
        stop: function () {
            saveDetails();
        }
    });

    $(".archive-list").sortable({
        'connectWith': '.todo-list',
        receive: function (event, ui) {
            saveDetails();
        },
        stop: function () {
            saveDetails();
        }
    });

    $(".tomorrow-list").sortable({
        'connectWith': '.todo-list',
        receive: function (event, ui) {
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

    $(".in-progress-list").sortable({
        'connectWith': '.todo-list',
        receive: function (event, ui) {
            ui.item.find(".done-time, .started-time").remove();

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

    var detectEditableInputChange = function (event) {
        var container = $("input.editable-input");
        // if the target of the click isn't the container nor a descendant of the container
        if (!container.is(event.target) && container.has(event.target).length === 0 && container.is(":visible")) {
            var changedValue = container.val();
            var editable = container.parent().find('.editable');
            editable.text(changedValue);
            editable.parent().find(":not(input)").removeClass('hidden');
            container.remove();
            saveDetails();
        }
    };
    $('body').mouseup(function (event) {
        detectEditableInputChange(event);
    });

    $('body').keypress(function (event) {
        if (event.which == 13) {
            detectEditableInputChange(event);
        }
    });

    $(".task-input").on("keydown", function (event) {
        if (event.keyCode !== 13) {
            return;
        }

        $(this).parents("li").after('<li><span class="editable">' + $(this).val() + '</span><time class="timeago start-time" datetime="' + new Date().toISOString() + '"></time>' + ($(this).parents("ul").hasClass("details-list") || $(this).parents("ul").hasClass("archive-list") ? '' : '<i class="fa fa-archive" onclick="archiveParent(event);"></i>') + '<i class="fa fa-trash-o" onclick="removeParent(event);"></i></li>');

        $("time.timeago").timeago();

        $(this).val("");

        saveDetails();
    })
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
                title: $(this).find("span").text(),
                createdTime: $(this).find(".start-time").attr("datetime"),
                endTime: $(this).find(".done-time").attr("datetime"),
                startedTime: $(this).find(".started-time").attr("datetime")
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
                var endTime = (item.endTime !== 'undefined' && item.endTime !== undefined ? ('<time class="timeago done-time" datetime="' + item.endTime + '"></time>') : '');
                var startedTime = (item.startedTime !== 'undefined' && item.startedTime !== undefined ? ('<time class="timeago started-time" datetime="' + item.startedTime + '"></time>') : '');
                var spanItem = '<span class="editable">' + item.title + '</span>';
                var listItem = '<li>' + spanItem + '<time class="timeago start-time" datetime="' + item.createdTime + '"></time>' + (endTime !== "" ? endTime : startedTime) + ($("." + listId).hasClass("details-list") || $("." + listId).hasClass("archive-list") ? '' : '<i class="fa fa-archive" onclick="archiveParent(event);"></i>') + '<i class="fa fa-trash-o" onclick="removeParent(event);"></i></li>';
                $("." + listId).append(listItem);
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

    reloadSelectedTodo();
    saveTodos();
}

function reloadRemote() {
    if ($("#remoteAddress").val() !== "") {
        $.get("https://api.myjson.com/bins/" + $("#remoteAddress").val(), function (data, textStatus, jqXHR) {
            reloadSelectedTodo(JSON.stringify(data));
            saveDetails();
        });
    }
}
