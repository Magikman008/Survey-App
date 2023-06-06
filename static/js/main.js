$(document).ready(function () {
    $(document).on('submit', '#register-form', function (e) {
        e.preventDefault();

        const csrftoken = getCookie('csrftoken');
        $.ajax({
            type: 'POST',
            url: '/register/',
            data: $(this).serialize(),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
            },
            success: function (response) {
                if (response.success) {
                    location.reload();
                } else {
                    $('.error').text('');
                    const errors = response.errors;
                    for (const field in errors) {
                        if (errors.hasOwnProperty(field)) {
                            const error = errors[field][0];
                            $('#' + field + '-error').text(error);
                        }
                    }
                }
            },
            error: function () {
                alert('Произошла ошибка при отправке формы.');
            }
        });
    });

    $(document).on('submit', '#login-form', function (e) {
        e.preventDefault();
        const csrftoken = getCookie('csrftoken');

        $.ajax({
            type: 'POST',
            url: '/login/',
            data: $(this).serialize(),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
            },
            success: function (response) {
                if (response.success) {
                    location.reload();
                } else {
                    $('.error').text('');
                    const errors = response.errors;
                    for (const field in errors) {
                        if (errors.hasOwnProperty(field)) {
                            const error = errors[field][0];
                            $('#' + field + '-error').text(error);
                        }
                    }
                }
            },
            error: function () {
                alert('Произошла ошибка при отправке формы.');
            }
        });
    });

    $("#login").click(function () {
        const overlay = document.querySelector('.overlay');
        const popup = document.querySelector('.popup');

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
            success: function () {
                location.reload()
            }
        });
    });

    $("#signin").click(function () {
        const overlay = document.querySelector('.overlay');
        const popup = document.querySelector('.popup');

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
        const overlay = document.querySelector('.overlay');
        const popup = document.querySelector('.popup');

        overlay.style.display = 'none';
        popup.style.display = 'none';
    });

    const textarea = document.getElementById('description');
    if (textarea) {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto'; // Сбрасывает высоту на авто
            this.style.height = this.scrollHeight + 'px'; // Устанавливает высоту равной высоте содержимого
        });
    }
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
