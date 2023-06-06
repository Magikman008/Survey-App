$(document).ready(function () {
    $('#color_hex').on('animationend', function () {
        $(this).removeClass('shake');
    });

    $('#add_color').click(function (e) {
        e.preventDefault();

        const csrftoken = getCookie('csrftoken');
        const colorName = $('#color_name').val();
        const colorHexElem = $('#color_hex')
        let colorHex = colorHexElem.val();
        const colorCost = $('#color_cost').val();

        if (!colorHex.startsWith('#')) {
            colorHex = '#' + colorHex;
        }

        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

        if (!hexColorRegex.test(colorHex)) {
            colorHexElem.addClass('wrong-input');
            colorHexElem.addClass('shake');
        } else {
            const colorData = {
                name: colorName,
                hex_code: colorHex,
                cost: colorCost
            };

            $.ajax({
                type: 'POST',
                url: '/add_color/',
                data: JSON.stringify(colorData),
                contentType: 'application/json',
                headers: {'X-CSRFToken': csrftoken},
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('X-CSRFToken', csrftoken);
                },
                success: function (response) {
                    if (response.success) {
                        const id = parseInt($('.card-info').last().data('color-id')) + 1;
                        const btn = $('<button class="buy-button activated" data-color-id="' + id + '">Купить</button>');
                        btn.click(buy);
                        $('.card').last().after('<div class="card" style="background-color: ' + colorHex + ' !important;   box-shadow: 0 0 0 0.1rem rgba(123, 123, 123, 0.25); "><div class="card-info" id="' + id + '"><div class="color-info"><div class="color-name">' + colorName + '</div><div class="color-currency">Стоимость: ' + colorCost + '<img src="/static/icons/coin.png"></div></div></div></div>');
                        $('.card-info').last().append(btn);
                    } else {
                        alert('Ошибка при добавлении цвета!');
                    }
                }
            });
        }

    });

    function buy(e) {
        e.preventDefault();

        const csrftoken = getCookie('csrftoken');
        const colorId = $(this).data('color-id');

        $.ajax({
            type: 'POST',
            url: '/purchase_color/',
            data: {'color_id': colorId},
            headers: {'X-CSRFToken': csrftoken},
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
            },
            success: function (response) {
                if (response.success) {
                    $(e.target).removeClass("activate-button");
                    $(e.target).addClass("buy-button");
                    $(e.target).text("Активировать");
                    $(e.target).off();
                    $(e.target).click(activate);
                } else {
                    alert(response.message);
                }
            },
            error: function () {
                alert('Ошибка при отправке запроса!');
            }
        });
    }

    $('.buy-button').click(buy);

    $('.activate-button').click(activate);

    function activate(e) {
        e.preventDefault();

        const csrftoken = getCookie('csrftoken');
        const colorId = $(this).data('color-id');

        $.ajax({
            type: 'POST',
            url: '/activate_color/',
            data: {'color_id': colorId},
            headers: {'X-CSRFToken': csrftoken},
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
            },
            success: function (response) {
                if (response.success) {
                    $('header').css('background-color', $(e.target).closest('.card').css('background-color'));
                    const temp = $('.active-color').first().removeClass('active-color');
                    temp.addClass('nonactive-color');
                    const btn = $('<button class="activate-button activated" data-color-id="' + temp.find('.card-info').attr('id') + '">Активировать</button>');
                    btn.click(activate);
                    temp.find('.activated').replaceWith(btn)
                    $(e.target).closest('.card').removeClass('nonactive-color');
                    $(e.target).closest('.card').addClass('active-color');
                    $(e.target).replaceWith('<div class="activated">Цвет активирован</div>');
                } else {
                    alert('Ошибка при установке цвета!');
                }
            },
            error: function () {
                alert('Ошибка при отправке запроса!');
            }
        });
    }

});