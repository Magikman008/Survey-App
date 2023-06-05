$(document).ready(function () {
    $('#submit-useranswer').click(function (e) {
        e.preventDefault();

        var csrftoken = getCookie('csrftoken');

        var form = $('#survey-form-user')
        var formData = form.serializeArray();
        var formValue = form.attr('value');
        var answers = {};

        // Создание словаря ответов пользователя
        $.each(formData, function (index, field) {
            if (field.name.startsWith('question_')) {
                var questionId = field.name.split('_')[1];
                var fieldType = $('[name="' + field.name + '"]').attr('type');

                // Проверяем, существует ли уже ответ для данного вопроса
                if (answers.hasOwnProperty(questionId)) {
                    // Если ответ уже существует, добавляем текущее значение поля в массив вариантов ответа
                    if (fieldType === 'checkbox' || fieldType === 'radio') {
                        answers[questionId].answer_options.push(field.value);
                    }
                } else {
                    // Если ответ еще не существует, создаем новый объект ответа
                    var answer = {
                        answer_text: null,
                        answer_options: []
                    };

                    if (fieldType === 'text') {
                        answer.answer_text = field.value;
                    } else if (fieldType === 'checkbox' || fieldType === 'radio') {
                        answer.answer_options.push(field.value);
                    }

                    answers[questionId] = answer;
                }
            }
        });

        var can_send = true;
        $('.question-block').each(function () {
            var requiredField = $(this).find('.required');
            if (requiredField.length !== 0) {
                var boxes = $(this).find('input[type="checkbox"], input[type="radio"]');
                if (boxes.length !== 0) {
                    console.log(boxes);
                    var isAnyChecked = boxes.is(":checked");
                    if (isAnyChecked) {
                        $(this).css("border", "1px solid lightgrey");
                    } else {
                        can_send = false;
                        $(this).css("border", "2px solid red");
                    }
                } else {
                    boxes = $(this).find('input[type="text"]').val();
                    if (boxes.length != 0) {
                        $(this).css("border", "1px solid lightgrey");
                    } else {
                        can_send = false;
                        $(this).css("border", "2px solid red");
                    }
                }
            }
        });
        if (can_send) {
            $.ajax({
                type: 'POST',
                url: '/save_answers/',
                data: JSON.stringify(answers),
                contentType: 'application/json',
                headers: {'X-CSRFToken': csrftoken},
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('X-CSRFToken', csrftoken);
                },
                success: function (response) {
                    if (!response.success) {
                        alert('Error saving answers!');
                    }
                }
            });

            var survey = {'survey_id': formValue}
            $.ajax({
                type: 'POST',
                url: '/complete_survey/',
                data: JSON.stringify(survey),
                contentType: 'application/json',
                headers: {'X-CSRFToken': csrftoken},
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('X-CSRFToken', csrftoken);
                },
                success: function (response) {
                    if (response.success) {
                        window.location.href = '/';
                    }
                }
            });
        }
    });


    $('#submit-test').click(function (e) {
        e.preventDefault();
        var title = $('#title').val();
        var price = $('#price').val();
        var description = $('#description').val();

        var csrftoken = getCookie('csrftoken');

        var questionData = [];
        $('.question-block').each(function () {
            var questionType = $(this).find('.question-type').val();
            var questionText = $(this).find('input[name="question-text"]').val();
            var questionOptions = [];
            var required = $(this).find('input[name="question-required"]').prop('checked');
            var isRequired = false;
            if (required) {
                isRequired = true;
            }

            $(this).find('input[name="answer-text"]').each(function () {
                var optionText = $(this).val();
                questionOptions.push(optionText);
            });

            questionData.push({
                'type': questionType,
                'text': questionText,
                'options': questionOptions,
                'required': isRequired
            });
        });

        var formData = {
            'title': title,
            'description': description,
            'questions': questionData,
            'price': price
        };

        var can_send = true;
        $('input[type="text"]').each(function () {
            if ($(this).val() !== "") {
                $(this).css("border", "1px solid lightgrey");
            } else {
                can_send = false;
                $(this).css("border", "2px solid red");
            }
        });


        if (can_send) {
            $.ajax({
                type: 'POST',
                url: '/save_survey/',
                data: JSON.stringify(formData),
                contentType: 'application/json',
                headers: {'X-CSRFToken': csrftoken},
                success: function (response) {
                    if (response.success) {
                        alert('Survey saved successfully!');
                        // Можно выполнить дополнительные действия, например, перенаправить пользователя на страницу опроса
                    } else {
                        alert('Error saving survey!');
                    }
                }
            });
        }
    });


    var questionCount = 0;
    var id = 0;

    function createQuestionBlock(questionType) {
        var questionBlock = $('<div class="question-block"><input type="text" name="question-text" placeholder="Введите текст вопроса"></div>');
        var questionTypeSelect = $('<select class="question-type"></select>')
            .append('<option value="text">Текст</option>')
            .append('<option value="checkbox">Множественный ответ</option>')
            .append('<option value="radio">Одиночный ответ</option>')
            .val("text")
            .appendTo(questionBlock);

        var questionContent = $('<div class="question-content"></div>').appendTo(questionBlock);

        var checked = $('<div class="needed"><div>Обязательный</div><label class="switch"><input type="checkbox" name="question-required"><span class="slider round"></span></label></div>').appendTo(questionBlock);

        var remove_button = $('<button type="button" class="remove-question">Удалить</button>')
        remove_button.click(function () {
            $(this).closest('.question-block').remove();
        });

        remove_button.prependTo(checked);

        questionTypeSelect.on('change', function () {
            var selectedType = $(this).val();
            changeQuestionContent(questionContent, selectedType);
        });

        changeQuestionContent(questionContent, questionType);

        return questionBlock;
    }


    function changeQuestionContent(questionContent, questionType) {
        questionContent.empty();

        if (questionType === 'checkbox' || questionType === 'radio') {
            var addButton = $('<button class="add-option" type="button">Добавить Вариант</button>');


            addButton.on('click', function () {
                id += 1
                var remove_button = $('<button type="button" class="remove-option"><img src="/static/icons/trash.png"></button>')
                remove_button.click(function () {
                    $(this).closest('.answer-option').remove();
                });
                var option = $('<div class="answer-option"><input id="box' + id + '" class="custom-checkbox" type="' + questionType + '" name="question-options" disabled="disabled"><label for="box' + id + '"></label><input type="text" name="answer-text" placeholder="Введите вариант ответа"></div>');

                remove_button.appendTo(option);
                option.insertBefore(addButton);
            });

            addButton.appendTo(questionContent);
            addButton.trigger('click');
        }
    }

    $('#add-question-btn').on('click', function () {
        var questionBlock = createQuestionBlock("text");
        questionBlock.appendTo('#question-container');
        questionCount++;
    });
});