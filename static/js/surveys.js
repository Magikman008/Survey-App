$(document).ready(function () {
    $('.question-block').on('animationend', function () {
        $(this).removeClass('shake');
    });

    $('#submit-useranswer').click(function (e) {
        e.preventDefault();

        const csrftoken = getCookie('csrftoken');

        const form = $('#survey-form-user');
        const formData = form.serializeArray();
        const formValue = form.attr('value');
        const answers = {};

        $.each(formData, function (index, field) {
            if (field.name.startsWith('question_')) {
                const questionId = field.name.split('_')[1];
                const fieldType = $('[name="' + field.name + '"]').attr('type');

                if (answers.hasOwnProperty(questionId)) {
                    if (fieldType === 'checkbox' || fieldType === 'radio') {
                        answers[questionId].answer_options.push(field.value);
                    }
                } else {
                    const answer = {
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

        let can_send = true;
        $('.question-block').each(function () {
            const requiredField = $(this).find('.required');
            if (requiredField.length !== 0) {
                let boxes = $(this).find('input[type="checkbox"], input[type="radio"]');

                if (boxes.length !== 0) {
                    const isAnyChecked = boxes.is(":checked");

                    if (isAnyChecked) {
                        $(this).removeClass('wrong-input');
                    } else {
                        can_send = false;
                        $(this).addClass('wrong-input');
                        $(this).addClass('shake');
                    }
                } else {
                    boxes = $(this).find('input[type="text"]').val();

                    if (boxes.length != 0) {
                        $(this).removeClass('wrong-input');
                    } else {
                        can_send = false;
                        $(this).addClass('wrong-input');
                        $(this).addClass('shake');
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

            const survey = {'survey_id': formValue};
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
                        $('.content').html('<div class="no-access"><p>Результаты отправлены</p></div>');
                    } else {
                        alert('Ошибка отправки результатов, попробуйте в другой раз');
                    }
                }
            });
        }
    });

    $('input[type="text"]').on('animationend', function () {
        $(this).removeClass('shake');
    });

    $('#submit-test').click(function (e) {
        e.preventDefault();
        const title = $('#title').val();
        const price = $('#price').val();
        const description = $('#description').val();

        const csrftoken = getCookie('csrftoken');

        const questionData = [];

        $('.question-block').each(function () {
            const questionType = $(this).find('.question-type').val();
            const questionText = $(this).find('input[name="question-text"]').val();
            const questionOptions = [];
            const required = $(this).find('input[name="question-required"]').prop('checked');
            let isRequired = false;

            if (required) {
                isRequired = true;
            }

            $(this).find('input[name="answer-text"]').each(function () {
                const optionText = $(this).val();
                questionOptions.push(optionText);
            });

            questionData.push({
                'type': questionType,
                'text': questionText,
                'options': questionOptions,
                'required': isRequired
            });
        });

        const formData = {
            'title': title,
            'description': description,
            'questions': questionData,
            'price': price
        };

        let can_send = true;
        $('input[type="text"]').each(function () {
            if ($(this).val() !== "") {
                $(this).removeClass('wrong-input');
            } else {
                can_send = false;
                $(this).addClass('wrong-input');
                $(this).addClass('shake');
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
                        $('.content').html('<div class="no-access"><p>Опрос сохранён</p></div>');
                    } else {
                        alert('Ошибка сохранения опроса, попробуйте попробуйте позже');
                    }
                }
            });
        }
    });


    let questionCount = 0;
    let id = 0;

    function createQuestionBlock(questionType) {
        const input = $('<input type="text" name="question-text" placeholder="Введите текст вопроса">');
        const questionBlock = $('<div class="question-block"></div>').append(input);

        input.on('animationend', function () {
            $(this).removeClass('shake');
        });

        const questionTypeSelect = $('<select class="question-type"></select>')
            .append('<option value="text">Текст</option>')
            .append('<option value="checkbox">Множественный ответ</option>')
            .append('<option value="radio">Одиночный ответ</option>')
            .val("text")
            .appendTo(questionBlock);

        const questionContent = $('<div class="question-content"></div>').appendTo(questionBlock);

        const checked = $('<div class="needed"><div>Обязательный</div><label class="switch"><input type="checkbox" name="question-required"><span class="slider round"></span></label></div>').appendTo(questionBlock);

        const remove_button = $('<button type="button" class="remove-question"><img src="/static/icons/trash.svg"></button>');

        remove_button.click(function () {
            $(this).closest('.question-block').remove();
        });

        remove_button.prependTo(checked);

        questionTypeSelect.on('change', function () {
            const selectedType = $(this).val();
            changeQuestionContent(questionContent, selectedType);
        });

        changeQuestionContent(questionContent, questionType);

        return questionBlock;
    }


    function changeQuestionContent(questionContent, questionType) {
        questionContent.empty();

        if (questionType === 'checkbox' || questionType === 'radio') {
            const addButton = $('<button class="add-option" type="button">Добавить Вариант</button>');

            addButton.on('click', function () {
                id += 1;
                const remove_button = $('<button type="button" class="remove-option"><img src="/static/icons/trash.svg"></button>');

                remove_button.click(function () {
                    $(this).closest('.answer-option').remove();
                });

                const input = $('<input type="text" name="answer-text" placeholder="Введите вариант ответа">');

                input.on('animationend', function () {
                    $(this).removeClass('shake');
                });

                const option = $('<div class="answer-option"><input id="box' + id + '" class="custom-checkbox" type="' + questionType + '" name="question-options" disabled="disabled"><label for="box' + id + '"></label></div>').append(input);
                remove_button.appendTo(option);
                option.insertBefore(addButton);
            });

            addButton.appendTo(questionContent);
            addButton.trigger('click');
        }
    }

    $('#add-question-btn').on('click', function () {
        const questionBlock = createQuestionBlock("text");
        questionBlock.appendTo('#question-container');
        questionCount++;
    });
});