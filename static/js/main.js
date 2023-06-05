$(document).ready(function () {
    $(document).on('submit', '#register-form', function (e) {
        e.preventDefault();

        var csrftoken = getCookie('csrftoken');
        $.ajax({
            type: 'POST',
            url: '/register/',
            data: $(this).serialize(),
            beforeSend: function (xhr) {
                // Устанавливаем заголовок X-CSRFToken с CSRF токеном
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
            },
            success: function (response) {
                if (response.success) {
                    location.reload();
                } else {
                    $('.error').text('');
                    var errors = response.errors;
                    for (var field in errors) {
                        if (errors.hasOwnProperty(field)) {
                            var error = errors[field][0];
                            $('#' + field + '-error').text(error);
                        }
                    }
                }
            },
            error: function (response) {
                alert('Произошла ошибка при отправке формы.');
            }
        });
    });

    $(document).on('submit', '#login-form', function (e) {
        e.preventDefault();
        console.log("iouh")
        var csrftoken = getCookie('csrftoken');
        $.ajax({
            type: 'POST',
            url: '/login/',
            data: $(this).serialize(),
            beforeSend: function (xhr) {
                // Устанавливаем заголовок X-CSRFToken с CSRF токеном
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
            },
            success: function (response) {
                if (response.success) {
                    location.reload();
                } else {
                    $('.error').text('');
                    var errors = response.errors;
                    console.log(errors)
                    for (var field in errors) {
                        console.log(field)
                        if (errors.hasOwnProperty(field)) {
                            var error = errors[field][0];
                            $('#' + field + '-error').text(error);
                        }
                    }
                }
            },
            error: function (response) {
                alert('Произошла ошибка при отправке формы.');
            }
        });
    });

    $("#login").click(function () {
        var overlay = document.querySelector('.overlay');
        var popup = document.querySelector('.popup');

        $.ajax({
            url: '/get_login_code/',
            type: 'GET',
            success: function (response) {
                popup.innerHTML = response.html_code;
                overlay.style.display = 'block';
                popup.style.display = 'block';
            }
        });
    });

    $("#logout").click(function () {
        $.ajax({
            url: '/logout/',
            type: 'GET',
            success: function (response) {
                location.reload()
            }
        });
    });

    $("#signin").click(function () {
        var overlay = document.querySelector('.overlay');
        var popup = document.querySelector('.popup');

        $.ajax({
            url: '/get_register_code/',
            type: 'GET',
            success: function (response) {
                popup.innerHTML = response.html_code;
                overlay.style.display = 'block';
                popup.style.display = 'block';
            }
        });
    });

    $(".overlay").click(function () {
        var overlay = document.querySelector('.overlay');
        var popup = document.querySelector('.popup');

        overlay.style.display = 'none';
        popup.style.display = 'none';
    });

    const textarea = document.getElementById('description');

    textarea.addEventListener('input', function () {
        this.style.height = 'auto'; // Сбрасывает высоту на авто
        this.style.height = this.scrollHeight + 'px'; // Устанавливает высоту равной высоте содержимого
    });

});

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
